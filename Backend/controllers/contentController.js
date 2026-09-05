const Content = require('../models/Content');
const Purchase = require('../models/Purchase');

const createContent = async (req, res) => {
  try {
    const { title, description, price, fileLink, type } = req.body;

    const content = await Content.create({
      coach: req.user._id,
      title,
      description,
      price,
      fileLink,
      type,
    });

    res.status(201).json(content);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllContent = async (req, res) => {
  try {
    const { sport, type } = req.query;
    let filter = {};
    if (type) filter.type = type;

    let content = await Content.find(filter).populate('coach', 'name sport');

    if (sport) {
      content = content.filter((c) => c.coach.sport === sport);
    }

    res.json(content);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Simple purchase (no real payment gateway yet)
const purchaseContent = async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);

    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }

    const purchase = await Purchase.create({
      learner: req.user._id,
      content: content._id,
      pricePaid: content.price,
    });

    res.status(201).json(purchase);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMyPurchases = async (req, res) => {
  try {
    const purchases = await Purchase.find({ learner: req.user._id })
      .populate({ path: 'content', populate: { path: 'coach', select: 'name' } })
      .sort({ createdAt: -1 });

    res.json(purchases);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createContent, getAllContent, purchaseContent, getMyPurchases };