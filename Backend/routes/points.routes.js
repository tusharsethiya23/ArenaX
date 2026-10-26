const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const { getMyPoints, postCheckIn } = require('../controllers/points.controller');

// Arena Points are for user accounts (athletes, coaches, admins), not brands
const usersOnly = (req, res, next) => (req.user ? next() : res.status(403).json({ message: 'Arena Points are for athlete and coach accounts' }));

router.get('/me', protect, usersOnly, getMyPoints);
router.post('/checkin', protect, usersOnly, postCheckIn);

module.exports = router;
