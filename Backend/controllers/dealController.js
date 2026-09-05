const Deal = require('../models/Deal');

// Brand deal request bhejta hai
const createDeal = async (req, res) => {
  try {
    const { talentId, offerAmount, message } = req.body;

    const deal = await Deal.create({
      brand: req.brand._id,
      talent: talentId,
      offerAmount,
      message,
    });

    res.status(201).json(deal);
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

    deal.status = status;
    await deal.save();

    // Commission calculate (sirf tracking, real payment abhi nahi)
    if (status === 'accepted') {
      const commission = deal.offerAmount * deal.commissionRate;
      return res.json({
        deal,
        platformCommission: commission,
        talentEarning: deal.offerAmount - commission,
      });
    }

    res.json(deal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createDeal, getMyDeals, updateDealStatus };