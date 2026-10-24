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
  // Replies: one level deep. A reply's `parent` is always a top-level comment
  // (replying to a reply joins the same thread); `replyTo` is the person being
  // answered, shown as "@Name".
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null,
  },
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  replyCount: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

// A post's top-level comments, newest first
commentSchema.index({ post: 1, parent: 1, _id: -1 });
// A comment's replies, oldest first
commentSchema.index({ parent: 1, _id: 1 });

module.exports = mongoose.model('Comment', commentSchema);
module.exports.MAX_COMMENT_LENGTH = MAX_COMMENT_LENGTH;
