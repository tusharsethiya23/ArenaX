// coachVerification.util.js
// Coaches earn the verified badge automatically: at least 10 completed
// sessions and an average rating of 4.5 or above. Re-checked whenever a
// session is completed or a review is written, so the badge follows the
// coach's record (it goes away if the average drops below 4.5).
//
// Athletes are verified as before: by having a verified portfolio achievement.

const User = require('../models/user.model');
const Booking = require('../models/booking.model');
const Review = require('../models/review.model');
const Achievement = require('../models/achievement.model');

const MIN_SESSIONS = 10;
const MIN_RATING = 4.5;

const refreshCoachVerified = async (coachId) => {
  const [sessions, ratings] = await Promise.all([
    Booking.countDocuments({ coach: coachId, status: 'completed' }),
    Review.aggregate([{ $match: { coach: coachId } }, { $group: { _id: null, avg: { $avg: '$rating' } } }]),
  ]);
  const verified = sessions >= MIN_SESSIONS && (ratings[0]?.avg ?? 0) >= MIN_RATING;
  await User.updateOne({ _id: coachId, role: 'coach', coachVerified: { $ne: verified } }, { coachVerified: verified });
  return verified;
};

// Which of these users show the verified badge. `users` need _id, role and
// coachVerified (coaches); athletes are looked up in their achievements.
const verifiedIdSet = async (users) => {
  const ids = new Set(users.filter((u) => u?.role === 'coach' && u.coachVerified).map((u) => String(u._id)));
  const others = users.filter((u) => u && u.role !== 'coach').map((u) => u._id);
  if (others.length) {
    (await Achievement.distinct('user', { user: { $in: others }, verified: true })).forEach((id) => ids.add(String(id)));
  }
  return ids;
};

module.exports = { MIN_SESSIONS, MIN_RATING, refreshCoachVerified, verifiedIdSet };
