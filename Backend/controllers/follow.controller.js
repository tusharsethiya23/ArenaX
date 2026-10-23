const mongoose = require('mongoose');
const Follow = require('../models/follow.model');
const User = require('../models/user.model');

const USER_FIELDS = 'name profilePhoto role sport location';
const MAX_LIST = 100;

// Shared checks for follow/unfollow. Returns an error response, or null if OK.
const checkTarget = async (req, res) => {
  // `protect` also lets brand tokens through — only platform users can follow
  if (!req.user) {
    return res.status(403).json({ message: 'Only users can follow people' });
  }
  const { userId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: 'Invalid user id' });
  }
  if (req.user._id.equals(userId)) {
    return res.status(400).json({ message: 'You cannot follow yourself' });
  }
  if (!(await User.exists({ _id: userId }))) {
    return res.status(404).json({ message: 'User not found' });
  }
  return null;
};

const followerCount = (userId) => Follow.countDocuments({ following: userId });

// POST /api/follows/:userId — idempotent: following someone twice is not an error
const followUser = async (req, res) => {
  try {
    if (await checkTarget(req, res)) return;
    const { userId } = req.params;

    await Follow.updateOne(
      { follower: req.user._id, following: userId },
      { $setOnInsert: { follower: req.user._id, following: userId } },
      { upsert: true }
    );

    res.json({ isFollowing: true, followers: await followerCount(userId) });
  } catch (error) {
    // Two simultaneous follow requests can race on the unique index; that still means "following"
    if (error.code === 11000) {
      return res.json({ isFollowing: true, followers: await followerCount(req.params.userId) });
    }
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/follows/:userId — idempotent as well
const unfollowUser = async (req, res) => {
  try {
    if (await checkTarget(req, res)) return;
    const { userId } = req.params;

    await Follow.deleteOne({ follower: req.user._id, following: userId });

    res.json({ isFollowing: false, followers: await followerCount(userId) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/follows/:userId/stats — counts + whether the logged-in user follows them
const getFollowStats = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }

    const [followers, following, isFollowing] = await Promise.all([
      Follow.countDocuments({ following: userId }),
      Follow.countDocuments({ follower: userId }),
      req.user ? Follow.exists({ follower: req.user._id, following: userId }) : null,
    ]);

    res.json({ followers, following, isFollowing: Boolean(isFollowing) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Builds the two list endpoints. `side` is the field matching :userId,
// `other` is the person we return for each row.
const listHandler = (side, other) => async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }

    const rows = await Follow.find({ [side]: userId })
      .sort({ createdAt: -1 })
      .limit(MAX_LIST)
      .populate(other, USER_FIELDS);

    // Skip rows whose user was deleted; include when they followed (used for notifications)
    res.json(rows.filter((r) => r[other]).map((r) => ({ user: r[other], followedAt: r.createdAt })));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/follows/:userId/followers — people who follow :userId
const getFollowers = listHandler('following', 'follower');
// GET /api/follows/:userId/following — people :userId follows
const getFollowing = listHandler('follower', 'following');

// GET /api/follows/suggestions — coaches the logged-in user doesn't follow yet,
// most-followed first, each with their follower count
const getSuggestions = async (req, res) => {
  try {
    if (!req.user) return res.json([]);
    const limit = Math.min(parseInt(req.query.limit, 10) || 5, 20);
    const alreadyFollowing = await Follow.find({ follower: req.user._id }).distinct('following');

    const coaches = await User.find({ role: 'coach', _id: { $nin: [req.user._id, ...alreadyFollowing] } })
      .select(USER_FIELDS)
      .lean();
    const counts = await Follow.aggregate([
      { $match: { following: { $in: coaches.map((c) => c._id) } } },
      { $group: { _id: '$following', n: { $sum: 1 } } },
    ]);
    const countById = Object.fromEntries(counts.map((c) => [String(c._id), c.n]));

    res.json(coaches
      .map((c) => ({ ...c, followerCount: countById[String(c._id)] || 0 }))
      .sort((a, b) => b.followerCount - a.followerCount || String(b._id).localeCompare(String(a._id)))
      .slice(0, limit));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { followUser, unfollowUser, getFollowStats, getFollowers, getFollowing, getSuggestions };
