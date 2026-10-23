const mongoose = require('mongoose');
const Booking = require('../models/booking.model');
const User = require('../models/user.model');
const { normalizeDay, slotKey, takenSlotsByCoach } = require('../utils/slots.util');

// Learner booking request banata hai
const createBooking = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(403).json({ message: 'Only users can book sessions' });
    }
    const { coachId } = req.body;
    const day = normalizeDay(req.body.day);
    const timeSlot = typeof req.body.timeSlot === 'string' ? req.body.timeSlot.trim() : '';

    if (!mongoose.Types.ObjectId.isValid(coachId)) {
      return res.status(400).json({ message: 'Invalid coach' });
    }
    if (!day || !timeSlot) {
      return res.status(400).json({ message: 'Pick a day and a time slot' });
    }
    if (req.user._id.equals(coachId)) {
      return res.status(400).json({ message: 'You cannot book yourself' });
    }

    const coach = await User.findOne({ _id: coachId, role: 'coach' }).select('availability');
    if (!coach) {
      return res.status(404).json({ message: 'Coach not found' });
    }

    // If the coach has listed their slots, the booking must be one of them
    const key = slotKey(day, timeSlot);
    if (coach.availability?.length && !coach.availability.some((s) => slotKey(s.day, s.timeSlot) === key)) {
      return res.status(400).json({ message: 'That time is not one of the coach\'s slots' });
    }

    // A slot held by a pending or confirmed booking can't be booked again
    const taken = (await takenSlotsByCoach([coach._id]))[coach._id] || [];
    if (taken.some((s) => slotKey(s.day, s.timeSlot) === key)) {
      return res.status(409).json({ message: 'That slot was just taken. Please pick another one.' });
    }

    const booking = await Booking.create({
      learner: req.user._id,   // token se aaya — request bhejne wala hi learner hai
      coach: coachId,
      day,
      timeSlot,
    });

    res.status(201).json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMyBookingsAsCoach = async (req, res) => {
  try {
    const bookings = await Booking.find({ coach: req.user._id })
      .populate('learner', 'name email location profilePhoto')
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Coach accept/decline karta hai
const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body; // "confirmed" ya "declined"
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Security check: sirf wahi coach update kar sake jiske liye ye booking hai
    if (booking.coach.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized for this booking' });
    }

    booking.status = status;
    await booking.save();

    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMyBookingsAsLearner = async (req, res) => {
  try {
    const bookings = await Booking.find({ learner: req.user._id })
      .populate('coach', 'name email sport location pricePerSession profilePhoto')
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createBooking, getMyBookingsAsCoach, updateBookingStatus, getMyBookingsAsLearner };