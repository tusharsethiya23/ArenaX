const express = require('express');
const router = express.Router();
const {
  getAchievementsForUser, addAchievement, updateAchievement, deleteAchievement,
  getVerifiers, requestVerification, getPendingRequests, verifyAchievement, rejectAchievement,
} = require('../controllers/achievement.controller');
const { protect, optionalProtect } = require('../middlewares/auth.middleware');

// Fixed paths before /:userId
router.get('/requests/pending', protect, getPendingRequests); // coach/admin review queue
router.get('/verifiers', protect, getVerifiers);              // coaches I can ask to verify

router.post('/', protect, addAchievement);
router.get('/:userId', optionalProtect, getAchievementsForUser); // public portfolio (+ canVerify when logged in)
router.put('/:id', protect, updateAchievement);
router.delete('/:id', protect, deleteAchievement);
router.post('/:id/request-verification', protect, requestVerification);
router.put('/:id/verify', protect, verifyAchievement);
router.put('/:id/reject', protect, rejectAchievement);

module.exports = router;
