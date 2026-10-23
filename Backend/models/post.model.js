const mongoose = require('mongoose');

const MAX_TEXT_LENGTH = 2000;
const MAX_IMAGES = 4;

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
}, { timestamps: true });

// A post needs at least some text or one image
postSchema.pre('validate', function () {
  if (!this.text && this.images.length === 0) {
    this.invalidate('text', 'Post must have text or at least one image');
  }
});

module.exports = mongoose.model('Post', postSchema);
module.exports.MAX_TEXT_LENGTH = MAX_TEXT_LENGTH;
module.exports.MAX_IMAGES = MAX_IMAGES;
