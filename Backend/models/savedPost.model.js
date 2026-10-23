const mongoose = require('mongoose');

// A post someone bookmarked. Private: only the saver sees their saved list.
const savedPostSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true,
  },
}, { timestamps: true });

// Saving twice is a no-op; listing is newest-saved first
savedPostSchema.index({ user: 1, post: 1 }, { unique: true });
savedPostSchema.index({ user: 1, _id: -1 });

module.exports = mongoose.model('SavedPost', savedPostSchema);
