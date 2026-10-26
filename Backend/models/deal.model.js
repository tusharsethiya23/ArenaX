const mongoose = require('mongoose');

// A brand's sponsorship offer to an athlete or coach: a message they accept or
// decline. (No money is handled in ArenaX.)
const dealSchema = new mongoose.Schema({
  brand: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand',
    required: true,
  },
  talent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  message: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined'],
    default: 'pending',
  },
}, { timestamps: true });

module.exports = mongoose.model('Deal', dealSchema);