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
  // The Athlete DNA skills a coach focuses on (up to 3; keys of DIMENSIONS in
  // utils/dna.util.js). Used to match athletes with coaches for their gaps.
  coachFocus: [{
    type: String,
    enum: ['technique', 'gameSense', 'fitness', 'speed', 'mental', 'discipline'],
  }],
  // Athlete DNA: the level the athlete is aiming for (keys of GOALS in utils/dna.util.js)
  careerGoal: {
    type: String,
    enum: ['recreational', 'club', 'district', 'state', 'national', 'professional'],
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