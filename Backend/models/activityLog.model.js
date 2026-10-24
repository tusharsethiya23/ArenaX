const mongoose = require('mongoose');

// One completed action-plan activity (e.g. "Sprint intervals") logged by an athlete.
// `activityKey` is a key from the activity library in dna.util.js.
const activityLogSchema = new mongoose.Schema({
  athlete: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  activityKey: {
    type: String,
    required: true,
  },
  dimension: {
    type: String,
    required: true,
  },
  minutes: {
    type: Number,
    min: 1,
    max: 600,
  },
  doneAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

activityLogSchema.index({ athlete: 1, doneAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
