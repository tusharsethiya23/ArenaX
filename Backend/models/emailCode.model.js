const mongoose = require('mongoose');

// A 6-digit email verification code (stored hashed). The code works until
// `expiresAt`; the record is kept for an hour (`deleteAt`, removed
// automatically by MongoDB) so the "5 codes an hour" limit can be counted.
const emailCodeSchema = new mongoose.Schema({
  email: { type: String, required: true, index: true },
  codeHash: { type: String, required: true },
  attempts: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true },
  deleteAt: { type: Date, required: true },
}, { timestamps: true });

emailCodeSchema.index({ deleteAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('EmailCode', emailCodeSchema);
