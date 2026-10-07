const User = require('../models/User');
const imagekit = require('../config/imagekit');
const Review = require('../models/Review.js');
const Endorsement = require('../models/Endorsement.js');

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

    const coaches = await User.find(filter).select('-password');

    res.json(coaches);
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
      'sport', 'pricePerSession', 'skillLevelTaught', 'availability',
      'goals', 'skillLevel',
    ];

    fieldsToUpdate.forEach((field) => {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    });

    const updatedUser = await user.save();

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
      availability: updatedUser.availability,
      goals: updatedUser.goals,
      skillLevel: updatedUser.skillLevel,
    });
  } catch (error) {
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
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
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

