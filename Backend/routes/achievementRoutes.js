const express = require('express');
const router = express.Router();
const {
  addAchievement,
  getAchievementsForUser,
  verifyAchievement,
} = require('../controllers/achievementController');
const { protect } = require('../middlewares/auth.middleware');

router.post('/', protect, addAchievement);
router.get('/:userId', getAchievementsForUser); // public — portfolio dikhane ke liye
router.put('/:id/verify', protect, verifyAchievement);

module.exports = router;