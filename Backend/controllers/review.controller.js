const mongoose = require('mongoose');
const Review = require('../models/review.model');
const Booking = require('../models/booking.model');
const { refreshCoachVerified } = require('../utils/coachVerification.util');

const createReview = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const rating = Number(req.body.rating);
    const comment = typeof req.body.comment === 'string' ? req.body.comment.trim() : '';

    if (!req.user || !mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be 1 to 5 stars' });
    }
    if (comment.length > 500) {
      return res.status(400).json({ message: 'Keep the review under 500 characters' });
    }

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

    // Ek session ka ek hi review
    if (await Review.exists({ booking: booking._id })) {
      return res.status(409).json({ message: 'You have already reviewed this session' });
    }

    const review = await Review.create({
      booking: bookingId,
      learner: req.user._id,
      coach: booking.coach,
      rating,
      comment,
    });
    await refreshCoachVerified(booking.coach); // the average rating changed

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