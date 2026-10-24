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
    required: function () {
      return !this.googleId; // only required if NOT a Google account
    },
  }, googleId: {
    type: Boolean,
    default: false,
  },
  role: {
    type: String,
    enum: ['learner', 'coach', 'admin'],
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
  // Private accounts approve followers, and only approved followers see their posts
  isPrivate: {
    type: Boolean,
    default: false,
  },
  yearsExperience: {
    type: Number,
    min: 0,
    max: 60,
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