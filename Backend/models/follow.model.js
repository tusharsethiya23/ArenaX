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
}, { timestamps: true });

// A user can follow someone only once
followSchema.index({ follower: 1, following: 1 }, { unique: true });
// "Who follows X" lookups, newest first
followSchema.index({ following: 1, createdAt: -1 });

module.exports = mongoose.model('Follow', followSchema);
