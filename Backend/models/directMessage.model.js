const mongoose = require('mongoose');

// A private message between two users (not tied to a booking; booking chats
// use message.model.js). Allowed when either of them follows the other, or
// when it's about a marketplace listing (see directMessage.controller.js).
const directMessageSchema = new mongoose.Schema({
  from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true, trim: true, maxlength: 2000 },
  readAt: { type: Date, default: null }, // set when `to` opens the conversation
  listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', default: null }, // "Contact seller" messages
}, { timestamps: true });

// One conversation's history, both directions, in order
directMessageSchema.index({ from: 1, to: 1, createdAt: -1 });
// "What haven't I read yet?"
directMessageSchema.index({ to: 1, readAt: 1 });

module.exports = mongoose.model('DirectMessage', directMessageSchema);
