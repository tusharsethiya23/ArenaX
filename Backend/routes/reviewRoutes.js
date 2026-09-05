const express = require('express');
const router = express.Router();
const { createReview, getCoachReviews } = require('../controllers/reviewController');
const { protect } = require('../middlewares/auth.middleware');

router.post('/', protect, createReview);
router.get('/:coachId', getCoachReviews); // public route — protect nahi lagaya

module.exports = router;