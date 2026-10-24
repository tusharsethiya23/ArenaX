const express = require('express');
const router = express.Router();
const {
  createBooking,
  getMyBookingsAsCoach,
  updateBookingStatus,
  getMyBookingsAsLearner,
  proposeReschedule,
  respondReschedule,
} = require('../controllers/booking.controller');
const { protect } = require('../middlewares/auth.middleware');

router.post('/', protect, createBooking);
router.get('/my-requests', protect, getMyBookingsAsCoach);
router.get('/my-bookings', protect, getMyBookingsAsLearner);
router.put('/:id', protect, updateBookingStatus);
router.post('/:id/reschedule', protect, proposeReschedule);
router.post('/:id/reschedule/respond', protect, respondReschedule);

module.exports = router;
