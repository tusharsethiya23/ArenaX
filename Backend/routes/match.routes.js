const express = require('express');
const router = express.Router();
const { getMatches, getMatchForCoach } = require('../controllers/match.controller');
const { protect } = require('../middlewares/auth.middleware');
const { requireAccess } = require('../utils/access.util');

router.get('/coaches', protect, requireAccess('coachMatching'), getMatches);
router.get('/coaches/:coachId', protect, requireAccess('coachMatching'), getMatchForCoach);

module.exports = router;
