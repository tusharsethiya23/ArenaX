const mongoose = require('mongoose');
const Booking = require('../models/booking.model');
const Review = require('../models/review.model');
const User = require('../models/user.model');
const { normalizeDay, nextDateOnWeekday, resolveSlot, isSlotTaken } = require('../utils/slots.util');

const TAKEN_MESSAGE = 'That slot was just taken. Please pick another one.';

// Learner booking request banata hai — { coachId, date: "2026-10-31", timeSlot }
// (older clients send `day` instead of `date`; that books the next such day)
const createBooking = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(403).json({ message: 'Only users can book sessions' });
    }
    const { coachId, timeSlot } = req.body;

    if (!mongoose.Types.ObjectId.isValid(coachId)) {
      return res.status(400).json({ message: 'Invalid coach' });
    }
    if (req.user._id.equals(coachId)) {
      return res.status(400).json({ message: 'You cannot book yourself' });
    }

    const coach = await User.findOne({ _id: coachId, role: 'coach' }).select('availability');
    if (!coach) {
      return res.status(404).json({ message: 'Coach not found' });
    }

    const day = normalizeDay(req.body.day);
    const date = req.body.date || (day && nextDateOnWeekday(day));
    if (!date || !timeSlot) {
      return res.status(400).json({ message: 'Pick a date and a time slot' });
    }

    const slot = resolveSlot(coach, date, timeSlot);
    if (slot.error) return res.status(400).json({ message: slot.error });

    // A slot held by a pending or confirmed booking can't be booked again
    if (await isSlotTaken(coach._id, slot)) {
      return res.status(409).json({ message: TAKEN_MESSAGE });
    }

    const booking = await Booking.create({
      learner: req.user._id,   // token se aaya — request bhejne wala hi learner hai
      coach: coachId,
      ...slot,
    });

    res.status(201).json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Learners see whether they've already rated each completed session
const withReviewed = async (bookings) => {
  const reviewed = new Set((await Review.find({ booking: { $in: bookings.map((b) => b._id) } }).distinct('booking')).map(String));
  return bookings.map((b) => ({ ...b.toObject(), reviewed: reviewed.has(String(b._id)) }));
};

const getMyBookingsAsCoach = async (req, res) => {
  try {
    const bookings = await Booking.find({ coach: req.user._id })
      .populate('learner', 'name email location sport profilePhoto')
      .sort({ createdAt: -1 });

    res.json(await withReviewed(bookings));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMyBookingsAsLearner = async (req, res) => {
  try {
    const bookings = await Booking.find({ learner: req.user._id })
      .populate('coach', 'name email sport location pricePerSession profilePhoto')
      .sort({ createdAt: -1 });

    res.json(await withReviewed(bookings));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Loads a booking the logged-in user is part of. Sends the error response
// and returns null otherwise.
const loadOwnBooking = async (req, res) => {
  if (!req.user || !mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(404).json({ message: 'Booking not found' });
    return null;
  }
  const booking = await Booking.findById(req.params.id);
  if (!booking) {
    res.status(404).json({ message: 'Booking not found' });
    return null;
  }
  const me = req.user._id;
  if (!booking.coach.equals(me) && !booking.learner.equals(me)) {
    // Security check: sirf is booking ke coach ya learner hi kuch badal sakte hain
    res.status(403).json({ message: 'Not authorized for this booking' });
    return null;
  }
  return booking;
};

const hasStarted = (booking, now = new Date()) => Boolean(booking.startsAt && booking.startsAt <= now);

// PUT /api/bookings/:id — { status }
//   coach:   pending -> confirmed | declined;  confirmed -> completed (once it has started)
//   either:  pending | confirmed -> cancelled (before it starts)
const updateBookingStatus = async (req, res) => {
  try {
    const booking = await loadOwnBooking(req, res);
    if (!booking) return;

    const { status } = req.body;
    const isCoach = booking.coach.equals(req.user._id);
    const fail = (message, code = 400) => res.status(code).json({ message });

    if (status === 'confirmed' || status === 'declined') {
      if (!isCoach) return fail('Only the coach can accept or decline a request', 403);
      if (booking.status !== 'pending') return fail(`This session is already ${booking.status}`);
      if (status === 'confirmed' && hasStarted(booking)) {
        return fail('This time has already passed. Suggest a new time instead.');
      }
      booking.reschedule = null;
    } else if (status === 'cancelled') {
      if (!['pending', 'confirmed'].includes(booking.status)) return fail(`This session is already ${booking.status}`);
      if (hasStarted(booking)) return fail('This session has already started');
      booking.cancelledBy = req.user._id;
      booking.reschedule = null;
    } else if (status === 'completed') {
      if (!isCoach) return fail('Only the coach can mark a session as completed', 403);
      if (booking.status !== 'confirmed') return fail('Only confirmed sessions can be completed');
      if (booking.startsAt && !hasStarted(booking)) return fail('You can mark it completed once the session has started');
      booking.completedAt = new Date();
      booking.reschedule = null;
    } else {
      return fail('Invalid status');
    }

    booking.status = status;
    await booking.save();
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/bookings/:id/reschedule — { date, timeSlot }
// Either side suggests a new time from the coach's slots; the other side answers.
const proposeReschedule = async (req, res) => {
  try {
    const booking = await loadOwnBooking(req, res);
    if (!booking) return;
    if (!['pending', 'confirmed'].includes(booking.status)) {
      return res.status(400).json({ message: `This session is already ${booking.status}` });
    }

    const coach = await User.findById(booking.coach).select('availability');
    const slot = resolveSlot(coach, req.body.date, req.body.timeSlot);
    if (slot.error) return res.status(400).json({ message: slot.error });
    if (slot.date === booking.date && slot.timeSlot === booking.timeSlot) {
      return res.status(400).json({ message: 'That is the current time. Pick a different one.' });
    }
    if (await isSlotTaken(booking.coach, slot, booking._id)) {
      return res.status(409).json({ message: TAKEN_MESSAGE });
    }

    booking.reschedule = { ...slot, by: req.user._id, at: new Date() };
    await booking.save();
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/bookings/:id/reschedule/respond — { accept }
// The other side accepts (the session moves and is confirmed) or declines;
// whoever suggested it can withdraw it (accept: false).
const respondReschedule = async (req, res) => {
  try {
    const booking = await loadOwnBooking(req, res);
    if (!booking) return;
    const proposal = booking.reschedule;
    if (!proposal || !['pending', 'confirmed'].includes(booking.status)) {
      return res.status(400).json({ message: 'There is no new time to answer' });
    }

    if (req.body.accept === true) {
      if (proposal.by.equals(req.user._id)) {
        return res.status(403).json({ message: 'The other person needs to accept your suggestion' });
      }
      if (proposal.startsAt && proposal.startsAt <= new Date()) {
        booking.reschedule = null;
        await booking.save();
        return res.status(400).json({ message: 'That suggested time has already passed' });
      }
      if (await isSlotTaken(booking.coach, proposal, booking._id)) {
        return res.status(409).json({ message: 'That time has been taken since it was suggested' });
      }
      Object.assign(booking, {
        date: proposal.date,
        day: proposal.day,
        timeSlot: proposal.timeSlot,
        startsAt: proposal.startsAt,
        endsAt: proposal.endsAt,
        status: 'confirmed', // both sides have now agreed on this time
      });
    }

    booking.reschedule = null;
    await booking.save();
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createBooking,
  getMyBookingsAsCoach,
  updateBookingStatus,
  getMyBookingsAsLearner,
  proposeReschedule,
  respondReschedule,
};
