const mongoose = require('mongoose');

const MAX_COMMENT_LENGTH = 500;

const commentSchema = new mongoose.Schema({
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  text: {
    type: String,
    trim: true,
    required: true,
    maxlength: MAX_COMMENT_LENGTH,
  },
}, { timestamps: true });

// A post's comments, newest first
commentSchema.index({ post: 1, _id: -1 });

module.exports = mongoose.model('Comment', commentSchema);
module.exports.MAX_COMMENT_LENGTH = MAX_COMMENT_LENGTH;
