const mongoose = require('mongoose');

const profileViewSchema = new mongoose.Schema({
  profileOwner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  viewedAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: false });

module.exports = mongoose.model('ProfileView', profileViewSchema);