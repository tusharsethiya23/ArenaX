const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['learner', 'coach'],
    required: true,
  },
  profilePhoto: {
    type: String,
    default: '',
  },
  bio: {
    type: String,
    default: '',
  },
  location: {
    type: String,
    default: '',
  },

  // Coach-only fields
  sport: {
    type: String,
  },
  pricePerSession: {
    type: Number,
  },
  skillLevelTaught: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
  },
  availability: [
    {
      day: String,      // "Saturday"
      timeSlot: String, // "5 PM - 6 PM"
    },
  ],

  // Learner-only fields
  goals: {
    type: String,
  },
  skillLevel: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
  },

}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);