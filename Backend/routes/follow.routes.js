const express = require('express');
const router = express.Router();
const {
  followUser, unfollowUser, getFollowStats, getFollowers, getFollowing, getSuggestions,
} = require('../controllers/follow.controller');
const { protect } = require('../middlewares/auth.middleware');

router.get('/suggestions', protect, getSuggestions); // "Coaches to follow"

router.post('/:userId', protect, followUser);
router.delete('/:userId', protect, unfollowUser);
router.get('/:userId/stats', protect, getFollowStats); // protect: isFollowing ke liye logged-in user chahiye
router.get('/:userId/followers', protect, getFollowers);
router.get('/:userId/following', protect, getFollowing);

module.exports = router;
