const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
  learner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  content: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Content',
    required: true,
  },
  pricePaid: {
    type: Number,
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Purchase', purchaseSchema);