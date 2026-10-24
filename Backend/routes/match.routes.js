const express = require('express');
const router = express.Router();
const { getMatches, getMatchForCoach } = require('../controllers/match.controller');
const { protect } = require('../middlewares/auth.middleware');

router.get('/coaches', protect, getMatches);
router.get('/coaches/:coachId', protect, getMatchForCoach);

module.exports = router;
