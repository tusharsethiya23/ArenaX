const express = require('express');
const router = express.Router();
const {
  followUser, unfollowUser, getFollowStats, getFollowers, getFollowing,
  getMyOutgoing, getFollowRequests, acceptRequest, declineRequest, getSuggestions,
} = require('../controllers/follow.controller');
const { protect } = require('../middlewares/auth.middleware');

// Fixed paths first, so they aren't read as a :userId
router.get('/suggestions', protect, getSuggestions);   // "Coaches to follow"
router.get('/me/outgoing', protect, getMyOutgoing);    // who I follow / have requested
router.get('/requests', protect, getFollowRequests);   // requests waiting for me
router.post('/requests/:followerId/accept', protect, acceptRequest);
router.delete('/requests/:followerId', protect, declineRequest);

router.post('/:userId', protect, followUser);
router.delete('/:userId', protect, unfollowUser);
router.get('/:userId/stats', protect, getFollowStats); // protect: isFollowing ke liye logged-in user chahiye
router.get('/:userId/followers', protect, getFollowers);
router.get('/:userId/following', protect, getFollowing);

module.exports = router;
