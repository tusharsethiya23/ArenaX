const mongoose = require('mongoose');

// One Arena Points award. (user, reason, ref) is unique, so the same thing can
// never pay twice: one daily-streak award per day, one per completed session,
// post or invited friend. See utils/points.util.js.
const pointsLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reason: { type: String, enum: ['streak', 'session', 'post', 'referral'], required: true },
  // What it was for: the day ("2026-10-26"), booking id, post id or invited user's id
  ref: { type: String, required: true },
  amount: { type: Number, required: true },
}, { timestamps: true });

pointsLogSchema.index({ user: 1, reason: 1, ref: 1 }, { unique: true });
pointsLogSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('PointsLog', pointsLogSchema);
