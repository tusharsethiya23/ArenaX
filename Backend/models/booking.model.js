const mongoose = require('mongoose');

// A new time suggested by the coach or the learner; the other one accepts or declines
const rescheduleSchema = new mongoose.Schema({
  date: { type: String, required: true },
  day: { type: String, required: true },
  timeSlot: { type: String, required: true },
  startsAt: Date,
  endsAt: Date,
  by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  at: { type: Date, default: Date.now },
}, { _id: false });

const bookingSchema = new mongoose.Schema({
  learner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  coach: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // Calendar date of the session ("2026-10-31", in APP_TIMEZONE).
  // Bookings made before dates existed only have `day`.
  date: {
    type: String,
  },
  day: {
    type: String,
    required: true,
  },
  timeSlot: {
    type: String,
    required: true,
  },
  // Exact start/end, worked out from date + timeSlot (null if the slot has no readable time)
  startsAt: Date,
  endsAt: Date,
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'declined', 'completed', 'cancelled'],
    default: 'pending',
  },
  reschedule: {
    type: rescheduleSchema,
    default: null,
  },
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  completedAt: Date,
}, { timestamps: true });

bookingSchema.index({ coach: 1, date: 1 });
bookingSchema.index({ learner: 1, date: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
