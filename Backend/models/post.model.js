const mongoose = require('mongoose');

const MAX_TEXT_LENGTH = 2000;
const MAX_IMAGES = 4;
const MAX_LOCATION_LENGTH = 80;

const postSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  text: {
    type: String,
    trim: true,
    default: '',
    maxlength: MAX_TEXT_LENGTH,
  },
  images: {
    type: [String], // ImageKit URLs
    default: [],
    validate: {
      validator: (arr) => arr.length <= MAX_IMAGES,
      message: `A post can have at most ${MAX_IMAGES} images`,
    },
  },
  // Optional place tag shown on the photo, e.g. "Holkar Ground, Indore"
  location: {
    type: String,
    trim: true,
    default: '',
    maxlength: MAX_LOCATION_LENGTH,
  },
  // Who liked it. Never sent to clients (they get likeCount + isLiked instead).
  likes: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    default: [],
    select: false,
  },
  // Kept in step with `likes` and the comments collection, so the feed can
  // show and sort by them without counting every time
  likeCount: { type: Number, default: 0, min: 0 },
  commentCount: { type: Number, default: 0, min: 0 },
}, { timestamps: true });

// A post needs at least some text or one image
postSchema.pre('validate', function () {
  if (!this.text && this.images.length === 0) {
    this.invalidate('text', 'Post must have text or at least one image');
  }
});

postSchema.index({ likeCount: -1, _id: -1 }); // "Most liked" feed
postSchema.index({ author: 1, _id: -1 });     // Following / Coaches feeds
postSchema.index({ likes: 1 });               // "did I like these?" lookups

module.exports = mongoose.model('Post', postSchema);
module.exports.MAX_TEXT_LENGTH = MAX_TEXT_LENGTH;
module.exports.MAX_IMAGES = MAX_IMAGES;
module.exports.MAX_LOCATION_LENGTH = MAX_LOCATION_LENGTH;
