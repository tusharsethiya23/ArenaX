const mongoose = require('mongoose');

const MAX_DEAL_MESSAGE_LENGTH = 2000;

// A chat message between a brand and the coach/athlete on an accepted deal.
// `fromBrand` tells the two sides apart (brands and users are separate
// collections, so there is no single sender ref).
const dealMessageSchema = new mongoose.Schema({
  deal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Deal',
    required: true,
    index: true,
  },
  fromBrand: {
    type: Boolean,
    required: true,
  },
  text: {
    type: String,
    trim: true,
    required: true,
    maxlength: MAX_DEAL_MESSAGE_LENGTH,
  },
}, { timestamps: true });

const DealMessage = mongoose.model('DealMessage', dealMessageSchema);
DealMessage.MAX_LENGTH = MAX_DEAL_MESSAGE_LENGTH;

module.exports = DealMessage;
