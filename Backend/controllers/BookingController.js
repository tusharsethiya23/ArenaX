const Booking = require('../models/Booking');

// Learner booking request banata hai
const createBooking = async (req, res) => {
  try {
    const { coachId, day, timeSlot } = req.body;

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
      .populate('learner', 'name email location')
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
      .populate('coach', 'name email sport location pricePerSession')
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createBooking, getMyBookingsAsCoach, updateBookingStatus, getMyBookingsAsLearner };