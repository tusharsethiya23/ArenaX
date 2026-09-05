const Endorsement = require('../models/Endorsement');

const createEndorsement = async (req, res) => {
  try {
    const { endorsedUserId, skill, note } = req.body;

    if (endorsedUserId === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot endorse yourself' });
    }

    const endorsement = await Endorsement.create({
      endorser: req.user._id,
      endorsedUser: endorsedUserId,
      skill,
      note,
    });

    res.status(201).json(endorsement);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getEndorsementsForUser = async (req, res) => {
  try {
    const endorsements = await Endorsement.find({ endorsedUser: req.params.userId })
      .populate('endorser', 'name role sport')
      .sort({ createdAt: -1 });

    res.json(endorsements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createEndorsement, getEndorsementsForUser };