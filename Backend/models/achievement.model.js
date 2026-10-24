const mongoose = require('mongoose');

// A portfolio item: a result, selection, certificate... with an optional proof link.
// Verification: athletes ask a coach they've trained with; coaches' own
// achievements are reviewed by admins. `verified` stays a plain boolean
// (used by stats and the verified badge); `status` tracks the whole flow.
const CATEGORIES = ['competition', 'selection', 'certification', 'record', 'award'];
const LEVELS = ['school', 'club', 'district', 'state', 'national', 'international'];

const achievementSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  description: {
    type: String,
    default: '',
    trim: true,
    maxlength: 500,
  },
  category: {
    type: String,
    enum: CATEGORIES,
    default: 'competition',
  },
  level: {
    type: String,
    enum: LEVELS,
  },
  date: {
    type: Date,
    required: true,
  },
  proofLink: {
    type: String,
    default: '',
    trim: true,
    maxlength: 500,
  },
  verified: {
    type: Boolean,
    default: false,
  },
  // unverified -> pending (requested) -> verified | rejected
  status: {
    type: String,
    enum: ['unverified', 'pending', 'verified', 'rejected'],
    default: 'unverified',
  },
  // Coach asked to verify; null while pending means the admin (ArenaX team) queue
  requestedFrom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  // The coach who verified it has since deleted their account (verifiedBy is
  // then null, which on its own would read as "verified by the ArenaX team")
  verifierRemoved: {
    type: Boolean,
    default: false,
  },
  reviewedAt: Date,
  reviewNote: {
    type: String,
    default: '',
    trim: true,
    maxlength: 300,
  },
}, { timestamps: true });

achievementSchema.index({ user: 1, date: -1 });
achievementSchema.index({ status: 1, requestedFrom: 1 });

module.exports = mongoose.model('Achievement', achievementSchema);
module.exports.CATEGORIES = CATEGORIES;
module.exports.LEVELS = LEVELS;
