const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
  coach: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  price: {
    type: Number,
    required: true,
  },
  fileLink: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['training_plan', 'drill', 'video_course'],
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Content', contentSchema);