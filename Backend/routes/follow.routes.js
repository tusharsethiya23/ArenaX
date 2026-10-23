const express = require('express');
const router = express.Router();
const {
  followUser, unfollowUser, getFollowStats, getFollowers, getFollowing,
} = require('../controllers/follow.controller');
const { protect } = require('../middlewares/auth.middleware');

router.post('/:userId', protect, followUser);
router.delete('/:userId', protect, unfollowUser);
router.get('/:userId/stats', protect, getFollowStats); // protect: isFollowing ke liye logged-in user chahiye
router.get('/:userId/followers', protect, getFollowers);
router.get('/:userId/following', protect, getFollowing);

module.exports = router;
