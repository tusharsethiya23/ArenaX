// emailCode.util.js
// Issues and checks 6-digit email verification codes.
//   - a code lasts 10 minutes and allows 5 wrong tries
//   - a new code can be sent at most once a minute, and 5 times an hour
//   - sending a new code replaces the old one

const crypto = require('crypto');
const EmailCode = require('../models/emailCode.model');
const { sendVerificationCode } = require('./mailer.util');

const CODE_MINUTES = 10;
const MAX_ATTEMPTS = 5;
const RESEND_SECONDS = 60;
const MAX_PER_HOUR = 5;

const hash = (code) => crypto.createHash('sha256').update(String(code)).digest('hex');

// Sends a new code. Returns { ok: true } or { ok: false, status, message }.
const issueCode = async (email) => {
  const now = Date.now();
  const recent = await EmailCode.find({ email, createdAt: { $gt: new Date(now - 60 * 60 * 1000) } }).sort({ createdAt: -1 }).lean();
  if (recent[0] && now - new Date(recent[0].createdAt).getTime() < RESEND_SECONDS * 1000) {
    const wait = Math.ceil((RESEND_SECONDS * 1000 - (now - new Date(recent[0].createdAt).getTime())) / 1000);
    return { ok: false, status: 429, message: `Please wait ${wait} seconds before asking for a new code` };
  }
  if (recent.length >= MAX_PER_HOUR) {
    return { ok: false, status: 429, message: 'Too many codes sent. Please try again in an hour.' };
  }

  const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
  // Older codes stop working, but stay (as expired) to count towards the hourly limit
  await EmailCode.updateMany({ email, expiresAt: { $gt: new Date(now) } }, { $set: { expiresAt: new Date(now) } });
  const doc = await EmailCode.create({ email, codeHash: hash(code), expiresAt: new Date(now + CODE_MINUTES * 60 * 1000), deleteAt: new Date(now + 60 * 60 * 1000) });
  try {
    await sendVerificationCode(email, code);
  } catch (err) {
    await EmailCode.deleteOne({ _id: doc._id });
    console.error('Could not send verification email:', err.message);
    return { ok: false, status: 503, message: 'We could not send the email right now. Please try again in a few minutes.' };
  }
  return { ok: true };
};

// Checks a code. Returns { ok: true } or { ok: false, message }.
const checkCode = async (email, code) => {
  const doc = await EmailCode.findOne({ email, expiresAt: { $gt: new Date() } }).sort({ createdAt: -1 });
  if (!doc) return { ok: false, message: 'This code has expired. Ask for a new one.' };
  if (doc.attempts >= MAX_ATTEMPTS) return { ok: false, message: 'Too many wrong tries. Ask for a new code.' };

  const given = hash(String(code || '').trim());
  if (!crypto.timingSafeEqual(Buffer.from(given), Buffer.from(doc.codeHash))) {
    doc.attempts += 1;
    await doc.save();
    const left = MAX_ATTEMPTS - doc.attempts;
    return { ok: false, message: left > 0 ? `Wrong code. ${left} ${left === 1 ? 'try' : 'tries'} left.` : 'Too many wrong tries. Ask for a new code.' };
  }
  // Used: expire it now (the record stays until deleteAt for the hourly limit)
  await EmailCode.updateMany({ email, expiresAt: { $gt: new Date() } }, { $set: { expiresAt: new Date() } });
  return { ok: true };
};

module.exports = { issueCode, checkCode, RESEND_SECONDS };
