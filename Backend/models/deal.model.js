const mongoose = require('mongoose');

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
  offerAmount: {
    type: Number,
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
  commissionRate: {
    type: Number,
    default: 0.1, // 10% platform commission
  },
}, { timestamps: true });

module.exports = mongoose.model('Deal', dealSchema);