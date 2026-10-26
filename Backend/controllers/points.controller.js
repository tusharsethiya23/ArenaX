// points.controller.js
//   GET  /api/points/me       points, streak, invite code, how to earn, recent awards
//   POST /api/points/checkin  the app calls this when it opens: continues the
//                             daily streak and awards the day's points (once a day)

const User = require('../models/user.model');
const PointsLog = require('../models/pointsLog.model');
const { POINTS, dayKey, checkIn, inviteCodeFor } = require('../utils/points.util');

const EARN = [
  { reason: 'streak', label: 'Open ArenaX every day (daily streak)', points: POINTS.streak },
  { reason: 'session', label: 'Complete a session', points: POINTS.session },
  { reason: 'post', label: 'Share a new post', points: POINTS.post },
  { reason: 'referral', label: 'Invite a friend who signs up', points: POINTS.referral },
];
const LABEL = { streak: 'Daily streak', session: 'Completed session', post: 'New post', referral: 'Friend joined' };

const streakOf = (user) => {
  const s = user.streak || {};
  const today = dayKey();
  const yesterday = dayKey(new Date(Date.now() - 24 * 60 * 60 * 1000));
  // A streak whose last day is before yesterday is already broken
  const alive = s.lastDay === today || s.lastDay === yesterday;
  return { count: alive ? s.count || 0 : 0, best: s.best || 0, activeToday: s.lastDay === today };
};

const getMyPoints = async (req, res) => {
  try {
    const [user, history, inviteCode] = await Promise.all([
      User.findById(req.user._id).select('points streak').lean(),
      PointsLog.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(15).lean(),
      inviteCodeFor(req.user._id),
    ]);
    res.json({
      points: user.points || 0,
      streak: streakOf(user),
      inviteCode,
      earn: EARN,
      history: history.map((h) => ({ _id: h._id, reason: h.reason, label: LABEL[h.reason], amount: h.amount, at: h.createdAt })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const postCheckIn = async (req, res) => {
  try {
    const result = await checkIn(req.user._id);
    if (!result) return res.status(404).json({ message: 'User not found' });
    res.json({ awarded: result.awarded, points: result.user.points || 0, streak: streakOf(result.user) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getMyPoints, postCheckIn };
