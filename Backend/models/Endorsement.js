const mongoose = require('mongoose');

const endorsementSchema = new mongoose.Schema({
  endorser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  endorsedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  skill: {
    type: String,
    required: true,
  },
  note: {
    type: String,
    default: '',
  },
}, { timestamps: true });

module.exports = mongoose.model('Endorsement', endorsementSchema);