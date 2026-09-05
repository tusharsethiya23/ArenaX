const express = require('express');
const router = express.Router();
const {
  createBooking,
  getMyBookingsAsCoach,
  updateBookingStatus,
  getMyBookingsAsLearner,
} = require('../controllers/BookingController');
const { protect } = require('../middlewares/auth.middleware');

router.post('/', protect, createBooking);
router.get('/my-requests', protect, getMyBookingsAsCoach);
router.get('/my-bookings', protect, getMyBookingsAsLearner);
router.put('/:id', protect, updateBookingStatus);

module.exports = router;