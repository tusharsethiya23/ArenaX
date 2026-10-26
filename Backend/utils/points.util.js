// points.util.js
// Arena Points: what each action earns, awarding them exactly once, and the
// daily streak.
//   streak   +10  each day you open ArenaX (one award per day)
//   session  +50  a completed session (the athlete and the coach)
//   post      +5  a new post (taken back if the post is deleted)
//   referral +100 a friend you invited signs up and verifies their account
// Every award is a PointsLog row keyed by (user, reason, ref); the unique index
// means a repeat of the same award is simply ignored.

const crypto = require('crypto');
const User = require('../models/user.model');
const PointsLog = require('../models/pointsLog.model');

const POINTS = { streak: 10, session: 50, post: 5, referral: 100 };
const TIMEZONE = 'Asia/Kolkata'; // a "day" for streaks
const DAY_MS = 24 * 60 * 60 * 1000;

// "2026-10-26" for the given moment, in ArenaX's timezone
const dayKey = (date = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE }).format(date);

// Gives `reason` points to a user once per `ref`. Returns true if awarded now.
const awardPoints = async (userId, reason, ref) => {
  if (!userId || !POINTS[reason]) return false;
  try {
    await PointsLog.create({ user: userId, reason, ref: String(ref), amount: POINTS[reason] });
  } catch (error) {
    if (error.code === 11000) return false; // already awarded
    throw error;
  }
  await User.updateOne({ _id: userId }, { $inc: { points: POINTS[reason] } });
  return true;
};

// Takes back an award (e.g. the post was deleted). Points never go below 0.
const revokePoints = async (userId, reason, ref) => {
  const log = await PointsLog.findOneAndDelete({ user: userId, reason, ref: String(ref) });
  if (!log) return false;
  await User.updateOne({ _id: userId }, [{ $set: { points: { $max: [0, { $subtract: ['$points', log.amount] }] } } }], { updatePipeline: true });
  return true;
};

// Called when the app opens. The first visit of a day continues the streak
// (or restarts it at 1 after a missed day) and earns the daily points.
const checkIn = async (userId) => {
  const today = dayKey();
  const yesterday = dayKey(new Date(Date.now() - DAY_MS));
  const user = await User.findById(userId).select('streak points');
  if (!user) return null;
  if (user.streak?.lastDay === today) return { awarded: 0, user };

  const count = user.streak?.lastDay === yesterday ? (user.streak.count || 0) + 1 : 1;
  // Only one request per day gets past the lastDay check, even if several arrive at once
  const updated = await User.findOneAndUpdate(
    { _id: userId, 'streak.lastDay': { $ne: today } },
    { $set: { 'streak.count': count, 'streak.lastDay': today }, $max: { 'streak.best': count } },
    { new: true },
  ).select('streak points');
  if (!updated) return { awarded: 0, user: await User.findById(userId).select('streak points') };

  const awarded = await awardPoints(userId, 'streak', today) ? POINTS.streak : 0;
  return { awarded, user: await User.findById(userId).select('streak points') };
};

// The user's invite code, made on first use (8 characters, easy to read aloud)
const inviteCodeFor = async (userId) => {
  const user = await User.findById(userId).select('inviteCode');
  if (user?.inviteCode) return user.inviteCode;
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = crypto.randomBytes(6).toString('base64url').replace(/[-_]/g, '').slice(0, 8).toUpperCase();
    if (code.length < 8) continue;
    try {
      const saved = await User.findOneAndUpdate({ _id: userId, inviteCode: { $exists: false } }, { inviteCode: code }, { new: true }).select('inviteCode');
      return saved?.inviteCode || (await User.findById(userId).select('inviteCode')).inviteCode;
    } catch (error) {
      if (error.code !== 11000) throw error; // code taken: try another
    }
  }
  throw new Error('Could not create an invite code');
};

// The inviter's id for a code from a sign-up link, or undefined
const inviterFor = async (code) => {
  if (typeof code !== 'string' || !/^[A-Za-z0-9]{8}$/.test(code)) return undefined;
  return (await User.findOne({ inviteCode: code.toUpperCase() }).select('_id'))?._id;
};

// Once an invited user's account is verified, their inviter earns the referral points
const rewardReferral = (user) => (user?.referredBy ? awardPoints(user.referredBy, 'referral', user._id) : false);

module.exports = { POINTS, dayKey, awardPoints, revokePoints, checkIn, inviteCodeFor, inviterFor, rewardReferral };
