const mongoose = require('mongoose');
const Follow = require('../models/follow.model');
const User = require('../models/user.model');

const { ACCEPTED } = Follow;
const USER_FIELDS = 'name profilePhoto role sport location isPrivate';
const MAX_LIST = 100;

const isId = (id) => mongoose.Types.ObjectId.isValid(id);

// Shared checks for follow/unfollow. Returns the target user, or null after sending an error.
const checkTarget = async (req, res) => {
  // `protect` also lets brand tokens through — only platform users can follow
  if (!req.user) {
    res.status(403).json({ message: 'Only users can follow people' });
    return null;
  }
  const { userId } = req.params;
  if (!isId(userId)) {
    res.status(400).json({ message: 'Invalid user id' });
    return null;
  }
  if (req.user._id.equals(userId)) {
    res.status(400).json({ message: 'You cannot follow yourself' });
    return null;
  }
  const target = await User.findById(userId).select('isPrivate');
  if (!target) {
    res.status(404).json({ message: 'User not found' });
    return null;
  }
  return target;
};

const followerCount = (userId) => Follow.countDocuments({ following: userId, ...ACCEPTED });

// Where the logged-in user stands with `userId`
const relationship = async (me, userId) => {
  const row = await Follow.findOne({ follower: me, following: userId }).select('status');
  return { isFollowing: Boolean(row) && row.status !== 'pending', requested: row?.status === 'pending' };
};

// POST /api/follows/:userId — follows a public account, or sends a request to a
// private one. Idempotent: repeating it never duplicates or downgrades a follow.
const followUser = async (req, res) => {
  try {
    const target = await checkTarget(req, res);
    if (!target) return;
    const { userId } = req.params;

    await Follow.updateOne(
      { follower: req.user._id, following: userId },
      { $setOnInsert: { follower: req.user._id, following: userId, status: target.isPrivate ? 'pending' : 'accepted' } },
      { upsert: true }
    ).catch((e) => { if (e.code !== 11000) throw e; }); // a simultaneous request already created it

    res.json({ ...(await relationship(req.user._id, userId)), followers: await followerCount(userId) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/follows/:userId — unfollow, or cancel a pending request. Idempotent.
const unfollowUser = async (req, res) => {
  try {
    if (!(await checkTarget(req, res))) return;
    const { userId } = req.params;

    await Follow.deleteOne({ follower: req.user._id, following: userId });

    res.json({ isFollowing: false, requested: false, followers: await followerCount(userId) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/follows/:userId/stats — counts + the logged-in user's relationship to them
const getFollowStats = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!isId(userId)) return res.status(400).json({ message: 'Invalid user id' });

    const [followers, following, rel, target] = await Promise.all([
      Follow.countDocuments({ following: userId, ...ACCEPTED }),
      Follow.countDocuments({ follower: userId, ...ACCEPTED }),
      req.user ? relationship(req.user._id, userId) : { isFollowing: false, requested: false },
      User.findById(userId).select('isPrivate'),
    ]);

    res.json({ followers, following, ...rel, isPrivate: Boolean(target?.isPrivate) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Builds the two list endpoints (accepted follows only). `side` is the field
// matching :userId, `other` is the person returned for each row.
const listHandler = (side, other) => async (req, res) => {
  try {
    const { userId } = req.params;
    if (!isId(userId)) return res.status(400).json({ message: 'Invalid user id' });

    const rows = await Follow.find({ [side]: userId, ...ACCEPTED })
      .sort({ updatedAt: -1 })
      .limit(MAX_LIST)
      .populate(other, USER_FIELDS);

    // Skip rows whose user was deleted. `followedAt` = when the follow became
    // active (accepting a request updates it), used for notifications.
    res.json(rows.filter((r) => r[other]).map((r) => ({ user: r[other], followedAt: r.updatedAt })));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/follows/:userId/followers — people who follow :userId
const getFollowers = listHandler('following', 'follower');
// GET /api/follows/:userId/following — people :userId follows
const getFollowing = listHandler('follower', 'following');

// GET /api/follows/me/outgoing — ids I follow and ids I've requested (for Follow buttons)
const getMyOutgoing = async (req, res) => {
  try {
    if (!req.user) return res.json({ following: [], requested: [] });
    const rows = await Follow.find({ follower: req.user._id }).select('following status');
    res.json({
      following: rows.filter((r) => r.status !== 'pending').map((r) => r.following),
      requested: rows.filter((r) => r.status === 'pending').map((r) => r.following),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/follows/requests — people waiting for me to accept their follow request
const getFollowRequests = async (req, res) => {
  try {
    if (!req.user) return res.json([]);
    const rows = await Follow.find({ following: req.user._id, status: 'pending' })
      .sort({ createdAt: -1 })
      .limit(MAX_LIST)
      .populate('follower', USER_FIELDS);
    res.json(rows.filter((r) => r.follower).map((r) => ({ user: r.follower, requestedAt: r.createdAt })));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/follows/requests/:followerId/accept — accept; DELETE /api/follows/requests/:followerId — decline
const respondToRequest = (accept) => async (req, res) => {
  try {
    if (!req.user) return res.status(403).json({ message: 'Only users have follow requests' });
    const { followerId } = req.params;
    if (!isId(followerId)) return res.status(400).json({ message: 'Invalid user id' });

    const filter = { follower: followerId, following: req.user._id, status: 'pending' };
    const result = accept
      ? await Follow.updateOne(filter, { status: 'accepted' })
      : await Follow.deleteOne(filter);
    const changed = accept ? result.modifiedCount : result.deletedCount;
    if (!changed) return res.status(404).json({ message: 'No pending request from this user' });

    res.json({ accepted: accept, followers: await followerCount(req.user._id) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/follows/suggestions — coaches the logged-in user doesn't follow (or
// hasn't requested) yet, most-followed first, each with their follower count
const getSuggestions = async (req, res) => {
  try {
    if (!req.user) return res.json([]);
    const limit = Math.min(parseInt(req.query.limit, 10) || 5, 20);
    const alreadyFollowing = await Follow.find({ follower: req.user._id }).distinct('following');

    const coaches = await User.find({ role: 'coach', _id: { $nin: [req.user._id, ...alreadyFollowing] } })
      .select(USER_FIELDS)
      .lean();
    const counts = await Follow.aggregate([
      { $match: { following: { $in: coaches.map((c) => c._id) }, ...ACCEPTED } },
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

module.exports = {
  followUser, unfollowUser, getFollowStats, getFollowers, getFollowing,
  getMyOutgoing, getFollowRequests,
  acceptRequest: respondToRequest(true), declineRequest: respondToRequest(false),
  getSuggestions,
};
