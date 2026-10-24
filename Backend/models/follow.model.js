const mongoose = require('mongoose');

// One document per "follower follows following". Kept as its own collection
// (not arrays on User) so counts and lists stay cheap as people gain followers.
const followSchema = new mongoose.Schema({
  follower: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  following: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // Following a private account creates a 'pending' request until they accept.
  // Follows saved before requests existed have no status: treat them as accepted
  // (query with ACCEPTED below, never `status: 'accepted'`).
  status: {
    type: String,
    enum: ['accepted', 'pending'],
    default: 'accepted',
  },
}, { timestamps: true });

// A user can follow someone only once
followSchema.index({ follower: 1, following: 1 }, { unique: true });
// "Who follows X" lookups, newest first
followSchema.index({ following: 1, createdAt: -1 });

module.exports = mongoose.model('Follow', followSchema);
// Filter for real (accepted) follows, including old documents without a status
module.exports.ACCEPTED = { status: { $ne: 'pending' } };
