const User = require('../models/user.model');
const imagekit = require('../config/imagekit.config');
const Review = require('../models/review.model.js');
const Endorsement = require('../models/endorsement.model.js');
const { removeUserFeedContent } = require('./post.controller.js');
const Follow = require('../models/follow.model.js');
const Assessment = require('../models/assessment.model.js');
const ActivityLog = require('../models/activityLog.model.js');
const Achievement = require('../models/achievement.model.js');
const { cleanAvailability, takenSlotsByCoach } = require('../utils/slots.util.js');

const getCoaches = async (req, res) => {
  try {
    const { sport, location, skillLevelTaught, minPrice, maxPrice } = req.query;

    // Ek filter object banate hain — sirf wahi cheeze isme daalenge jo user ne bheji hain
    let filter = { role: 'coach' };

    // Escape user input, then use a case-insensitive partial match. This makes
    // searches such as "mumbai" match a coach whose location is "Mumbai".
    const toCaseInsensitiveMatch = (value) => ({
      $regex: value.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
      $options: 'i',
    });

    if (sport?.trim()) {
      filter.sport = toCaseInsensitiveMatch(sport);
    }

    if (location?.trim()) {
      filter.location = toCaseInsensitiveMatch(location);
    }

    if (skillLevelTaught) {
      filter.skillLevelTaught = skillLevelTaught;
    }

    if (minPrice || maxPrice) {
      filter.pricePerSession = {};
      if (minPrice) filter.pricePerSession.$gte = Number(minPrice);
      if (maxPrice) filter.pricePerSession.$lte = Number(maxPrice);
    }

    const coaches = await User.find(filter).select('-password').lean();
    const ids = coaches.map((c) => c._id);

    // Extra info for the Discover cards, fetched in bulk (not one query per coach):
    // rating + review count, "verified" (has a verified achievement), and taken slots
    const [ratings, verified, taken] = await Promise.all([
      Review.aggregate([
        { $match: { coach: { $in: ids } } },
        { $group: { _id: '$coach', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
      ]),
      Achievement.distinct('user', { user: { $in: ids }, verified: true }),
      takenSlotsByCoach(ids),
    ]);
    const ratingById = Object.fromEntries(ratings.map((r) => [String(r._id), r]));
    const verifiedIds = new Set(verified.map(String));

    res.json(coaches.map((c) => {
      const r = ratingById[String(c._id)];
      return {
        ...c,
        rating: r ? Math.round(r.avg * 10) / 10 : null,
        reviewCount: r ? r.count : 0,
        verified: verifiedIds.has(String(c._id)),
        takenSlots: taken[c._id] || [],
      };
    }));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Jo bhi field bheji hai, wahi update karo — baaki purani value rakho
    const fieldsToUpdate = [
      'name', 'bio', 'location', 'profilePhoto',
      'sport', 'pricePerSession', 'skillLevelTaught', 'yearsExperience', 'availability', 'isPrivate',
      'goals', 'skillLevel',
    ];

    // Availability comes from the Settings editor: check days/times before saving
    if (req.body.availability !== undefined) {
      const { value, error } = cleanAvailability(req.body.availability);
      if (error) return res.status(400).json({ message: error });
      req.body.availability = value;
    }
    // Empty inputs from the form clear these fields instead of failing validation
    for (const field of ['skillLevelTaught', 'skillLevel', 'yearsExperience', 'pricePerSession']) {
      if (req.body[field] === '') {
        user[field] = undefined;
        delete req.body[field];
      }
    }

    if (req.body.isPrivate !== undefined) req.body.isPrivate = req.body.isPrivate === true || req.body.isPrivate === 'true';
    const wasPrivate = Boolean(user.isPrivate);

    fieldsToUpdate.forEach((field) => {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    });

    const updatedUser = await user.save();

    // Going public: everyone waiting for approval becomes a follower
    if (wasPrivate && !updatedUser.isPrivate) {
      await Follow.updateMany({ following: user._id, status: 'pending' }, { status: 'accepted' });
    }

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      bio: updatedUser.bio,
      location: updatedUser.location,
      sport: updatedUser.sport,
      pricePerSession: updatedUser.pricePerSession,
      skillLevelTaught: updatedUser.skillLevelTaught,
      yearsExperience: updatedUser.yearsExperience,
      availability: updatedUser.availability,
      isPrivate: updatedUser.isPrivate,
      goals: updatedUser.goals,
      skillLevel: updatedUser.skillLevel,
    });
  } catch (error) {
    // Bad values (e.g. unknown skill level, negative experience) are the client's mistake
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};


const uploadProfilePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    const result = await imagekit.upload({
      file: req.file.buffer.toString('base64'), // buffer ko base64 me convert karna padta hai ImageKit ke liye
      fileName: `profile_${req.user._id}_${Date.now()}`,
      folder: '/arenax_profiles',
    });

    const user = await User.findById(req.user._id);
    user.profilePhoto = result.url;
    await user.save();

    res.json({ profilePhoto: user.profilePhoto });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password').lean();
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (user.role !== 'coach') return res.json(user);

    // Coaches: add what the profile card shows (rating, verified badge, taken slots)
    const [ratings, isVerified, taken] = await Promise.all([
      Review.aggregate([
        { $match: { coach: user._id } },
        { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
      ]),
      Achievement.exists({ user: user._id, verified: true }),
      takenSlotsByCoach([user._id]),
    ]);
    res.json({
      ...user,
      rating: ratings[0] ? Math.round(ratings[0].avg * 10) / 10 : null,
      reviewCount: ratings[0]?.count || 0,
      verified: Boolean(isVerified),
      takenSlots: taken[user._id] || [],
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Permanently deletes the logged-in user's own account.
// The user ID always comes from the verified token (req.user._id),
// never from the request — so nobody can delete someone else's account.
const deleteAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await User.findByIdAndDelete(req.user._id);
    await removeUserFeedContent(req.user._id); // posts, comments, likes, saves
    await Assessment.deleteMany({ $or: [{ athlete: req.user._id }, { assessor: req.user._id }] });
    await ActivityLog.deleteMany({ athlete: req.user._id });
    await Follow.deleteMany({ $or: [{ follower: req.user._id }, { following: req.user._id }] });

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin-only: view all users on the platform
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin-only: delete ANY user by ID (unlike deleteAccount, which only
// deletes the logged-in user's own account)
const adminDeleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    await User.findByIdAndDelete(req.params.id);
    await removeUserFeedContent(req.params.id); // posts, comments, likes, saves
    await Assessment.deleteMany({ $or: [{ athlete: req.params.id }, { assessor: req.params.id }] });
    await ActivityLog.deleteMany({ athlete: req.params.id });
    await Follow.deleteMany({ $or: [{ follower: req.params.id }, { following: req.params.id }] });
    res.json({ message: 'User deleted by admin' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getRecommendedCoaches = async (req, res) => {
  try {
    if (req.user.role !== 'learner') {
      return res.status(403).json({ message: 'Only learners can view recommendations' });
    }

    const learner = req.user;

    // Base filter: only coaches, and matching the learner's preferred sport
    // if they've set one
    let filter = { role: 'coach' };
    if (learner.sport) filter.sport = learner.sport;

    const coaches = await User.find(filter).select('-password');

    // Score each coach: rating + endorsements + skill-level match bonus
    const scoredCoaches = await Promise.all(
      coaches.map(async (coach) => {
        const reviews = await Review.find({ coach: coach._id });
        const avgRating = reviews.length
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          : 0;

        const endorsementCount = await Endorsement.countDocuments({ endorsedUser: coach._id });

        let matchScore = avgRating * 2 + endorsementCount * 0.5;

        // Bonus if the coach teaches at the learner's exact skill level
        if (learner.skillLevel && coach.skillLevelTaught === learner.skillLevel) {
          matchScore += 3;
        }

        return {
          ...coach.toObject(),
          avgRating: avgRating.toFixed(1),
          endorsementCount,
          matchScore,
        };
      })
    );

    // Highest match score first
    scoredCoaches.sort((a, b) => b.matchScore - a.matchScore);

    res.json(scoredCoaches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getCoaches, updateProfile, uploadProfilePhoto, getUserById,
  deleteAccount, getAllUsers, adminDeleteUser, getRecommendedCoaches,
};

