const Review = require('../models/Review');
const Booking = require('../models/Booking');

const createReview = async (req, res) => {
  try {
    const { bookingId, rating, comment } = req.body;

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Sirf learner hi review de sakta hai, aur wo bhi apni khud ki booking ka
    if (booking.learner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to review this booking' });
    }

    // Sirf completed booking pe review ho sake
    if (booking.status !== 'completed') {
      return res.status(400).json({ message: 'Can only review completed sessions' });
    }

    const review = await Review.create({
      booking: bookingId,
      learner: req.user._id,
      coach: booking.coach,
      rating,
      comment,
    });

    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Kisi coach ki saari reviews dekhna (public — profile pe dikhane ke liye)
const getCoachReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ coach: req.params.coachId })
      .populate('learner', 'name')
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createReview, getCoachReviews };