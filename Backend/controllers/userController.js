const User = require('../models/User');
const imagekit = require('../config/imagekit');

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

module.exports = { getCoaches, updateProfile, uploadProfilePhoto, getUserById };

