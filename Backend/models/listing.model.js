const mongoose = require('mongoose');

const CONDITIONS = ['new', 'like_new', 'good', 'fair'];
const MAX_PHOTOS = 4;

// A marketplace listing: sports gear someone wants to pass on. No prices or
// checkout; buyers use "Contact seller", which opens a direct message.
const listingSchema = new mongoose.Schema({
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true, maxlength: 80 },
  description: { type: String, default: '', trim: true, maxlength: 1000 },
  condition: { type: String, enum: CONDITIONS, required: true },
  location: { type: String, required: true, trim: true, maxlength: 80 },
  photos: {
    type: [String],
    validate: [(v) => v.length >= 1 && v.length <= MAX_PHOTOS, `Add 1 to ${MAX_PHOTOS} photos`],
  },
  status: { type: String, enum: ['active', 'sold'], default: 'active' },
}, { timestamps: true });

listingSchema.index({ status: 1, createdAt: -1 });
listingSchema.index({ seller: 1, createdAt: -1 });

module.exports = mongoose.model('Listing', listingSchema);
module.exports.CONDITIONS = CONDITIONS;
module.exports.MAX_PHOTOS = MAX_PHOTOS;
