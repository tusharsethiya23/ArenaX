const mongoose = require('mongoose');

// One skill assessment of an athlete: by themselves ('self') or by a coach
// they've had a session with ('coach'). Scores are 1-10 per skill (see dna.util.js).
const score = { type: Number, required: true, min: 1, max: 10 };

const assessmentSchema = new mongoose.Schema({
  athlete: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  assessor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  source: {
    type: String,
    enum: ['self', 'coach'],
    required: true,
  },
  scores: {
    technique: score,
    gameSense: score,
    fitness: score,
    speed: score,
    mental: score,
    discipline: score,
  },
  note: {
    type: String,
    trim: true,
    maxlength: 500,
    default: '',
  },
}, { timestamps: true });

assessmentSchema.index({ athlete: 1, createdAt: -1 });

module.exports = mongoose.model('Assessment', assessmentSchema);
