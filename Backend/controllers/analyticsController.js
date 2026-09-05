const ProfileView = require('../models/ProfilePreview');
const Booking = require('../models/Booking');
const Deal = require('../models/Deal');

// Jab bhi koi profile dekhe, ek view record karo
const recordProfileView = async (req, res) => {
  try {
    await ProfileView.create({ profileOwner: req.params.userId });
    res.status(201).json({ message: 'View recorded' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Coach apna analytics dashboard dekhta hai
const getMyAnalytics = async (req, res) => {
  try {
    const coachId = req.user._id;

    const totalViews = await ProfileView.countDocuments({ profileOwner: coachId });

    const totalBookings = await Booking.countDocuments({ coach: coachId });
    const confirmedBookings = await Booking.countDocuments({ coach: coachId, status: 'confirmed' });
    const completedBookings = await Booking.countDocuments({ coach: coachId, status: 'completed' });

    const acceptedDeals = await Deal.find({ talent: coachId, status: 'accepted' });
    const totalBrandEarnings = acceptedDeals.reduce(
      (sum, deal) => sum + (deal.offerAmount - deal.offerAmount * deal.commissionRate),
      0
    );

    res.json({
      totalViews,
      totalBookings,
      confirmedBookings,
      completedBookings,
      totalBrandEarnings,
      totalBrandDeals: acceptedDeals.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { recordProfileView, getMyAnalytics };