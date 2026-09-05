const Spotlight = require('../models/Spotlight');

// Brand ek athlete ko sponsor karke spotlight kharidta hai
const createSpotlight = async (req, res) => {
  try {
    const { athleteId, amountPaid, startDate, endDate } = req.body;

    // Overlap check — ek time pe sirf ek active spotlight ho sake
    const overlapping = await Spotlight.findOne({
      startDate: { $lte: new Date(endDate) },
      endDate: { $gte: new Date(startDate) },
    });

    if (overlapping) {
      return res.status(400).json({ message: 'Spotlight slot already booked for this period' });
    }

    const spotlight = await Spotlight.create({
      athlete: athleteId,
      sponsorBrand: req.brand._id,
      amountPaid,
      startDate,
      endDate,
    });

    res.status(201).json(spotlight);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Public — abhi konsa spotlight "live" hai, wo dikhana
const getCurrentSpotlight = async (req, res) => {
  try {
    const now = new Date();
    const spotlight = await Spotlight.findOne({
      startDate: { $lte: now },
      endDate: { $gte: now },
    })
      .populate('athlete', 'name sport bio location')
      .populate('sponsorBrand', 'companyName logo');

    if (!spotlight) {
      return res.json(null);
    }

    res.json(spotlight);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createSpotlight, getCurrentSpotlight };