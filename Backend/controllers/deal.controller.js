const Deal = require('../models/deal.model');
const User = require('../models/user.model');

// Brand deal request bhejta hai
const createDeal = async (req, res) => {
  try {
    if (!req.brand) return res.status(403).json({ message: 'Only brands can send deal offers' });
    const { talentId } = req.body;
    const talent = await User.exists({ _id: talentId, role: { $in: ['coach', 'learner'] } }).catch(() => null);
    if (!talent) return res.status(404).json({ message: 'Coach or athlete not found' });
    const message = typeof req.body.message === 'string' ? req.body.message.trim() : '';
    if (!message) return res.status(400).json({ message: 'Write a message about your offer' });

    const deal = await Deal.create({
      brand: req.brand._id,
      talent: talentId,
      message,
    });

    res.status(201).json(deal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Brand sees the offers it has sent, newest first, with each one's status
const getSentDeals = async (req, res) => {
  try {
    if (!req.brand) return res.status(403).json({ message: 'Only brands have sent offers' });
    const deals = await Deal.find({ brand: req.brand._id })
      .populate('talent', 'name role sport location profilePhoto')
      .sort({ createdAt: -1 });

    res.json(deals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Talent (coach) apne deals dekhta hai
const getMyDeals = async (req, res) => {
  try {
    const deals = await Deal.find({ talent: req.user._id })
      .populate('brand', 'companyName industry website')
      .sort({ createdAt: -1 });

    res.json(deals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Talent accept/decline karta hai
const updateDealStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const deal = await Deal.findById(req.params.id);

    if (!deal) {
      return res.status(404).json({ message: 'Deal not found' });
    }

    if (deal.talent.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized for this deal' });
    }

    if (!['accepted', 'declined'].includes(status)) {
      return res.status(400).json({ message: 'Status must be accepted or declined' });
    }
    deal.status = status;
    await deal.save();

    res.json(deal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createDeal, getSentDeals, getMyDeals, updateDealStatus };