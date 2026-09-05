const Subscription = require('../models/Subscription');

const PLAN_DURATION_DAYS = 30;

const subscribe = async (req, res) => {
  try {
    const { plan } = req.body; // 'coach_pro' or 'learner_premium'

    // Check karo pehle se active subscription toh nahi hai
    const existing = await Subscription.findOne({
      user: req.user._id,
      status: 'active',
    });

    if (existing) {
      return res.status(400).json({ message: 'You already have an active subscription' });
    }

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + PLAN_DURATION_DAYS);

    const subscription = await Subscription.create({
      user: req.user._id,
      plan,
      endDate,
    });

    res.status(201).json(subscription);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMySubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      user: req.user._id,
      status: 'active',
    });

    if (!subscription) {
      return res.json({ active: false });
    }

    // Check karo expire toh nahi ho gaya
    if (new Date() > subscription.endDate) {
      subscription.status = 'expired';
      await subscription.save();
      return res.json({ active: false });
    }

    res.json({ active: true, subscription });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const cancelSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      user: req.user._id,
      status: 'active',
    });

    if (!subscription) {
      return res.status(404).json({ message: 'No active subscription found' });
    }

    subscription.status = 'cancelled';
    await subscription.save();

    res.json({ message: 'Subscription cancelled', subscription });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { subscribe, getMySubscription, cancelSubscription };