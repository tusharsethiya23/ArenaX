const mongoose = require('mongoose');

// People who tapped "Notify me" on the Pro coming soon page (one entry each)
const waitlistSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  email: { type: String, required: true },
  role: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Waitlist', waitlistSchema, 'waitlist');
