// tournament.model.js
// Represents a tournament event that users can register teams for.
const mongoose = require('mongoose');

const tournamentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sport: { type: String, required: true },
  description: { type: String, default: '' },
  location: { type: String, required: true },
  startDate: { type: Date, required: true },
  registrationDeadline: { type: Date, required: true },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Tournament', tournamentSchema);