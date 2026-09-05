const Achievement = require('../models/Achievement');

const addAchievement = async (req, res) => {
  try {
    const { title, description, date, proofLink } = req.body;

    const achievement = await Achievement.create({
      user: req.user._id,
      title,
      description,
      date,
      proofLink,
    });

    res.status(201).json(achievement);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAchievementsForUser = async (req, res) => {
  try {
    const achievements = await Achievement.find({ user: req.params.userId }).sort({ date: -1 });
    res.json(achievements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Verification — abhi simple: koi bhi logged-in coach dusre ko verify kar sake
// (asli app me admin-only hoga, abhi V2 basic ke liye peer-verification)
const verifyAchievement = async (req, res) => {
  try {
    const achievement = await Achievement.findById(req.params.id);

    if (!achievement) {
      return res.status(404).json({ message: 'Achievement not found' });
    }

    if (achievement.user.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot verify your own achievement' });
    }

    achievement.verified = true;
    await achievement.save();

    res.json(achievement);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { addAchievement, getAchievementsForUser, verifyAchievement };