// analytics.controller.js
// Aggregates data from multiple collections to build a coach's performance
// dashboard — bookings, earnings, and now also review ratings, endorsements,
// and achievements, giving a fuller picture of the athlete's track record.

const ProfileView = require('../models/ProfilePreview.js');
const Booking = require('../models/Booking.js');
const Deal = require('../models/Deal.js');
const Review = require('../models/Review.js');
const Endorsement = require('../models/Endorsement.js');
const Achievement = require('../models/Achievement.js');
const recordProfileView = async (req, res) => {
  try {
    await ProfileView.create({ profileOwner: req.params.userId });
    res.status(201).json({ message: 'View recorded' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

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

    // Performance metrics — new in this update
    const reviews = await Review.find({ coach: coachId });
    const averageRating = reviews.length
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : null;

    const endorsementCount = await Endorsement.countDocuments({ endorsedUser: coachId });
    const achievementCount = await Achievement.countDocuments({ user: coachId });
    const verifiedAchievementCount = await Achievement.countDocuments({ user: coachId, verified: true });

    // Booking completion rate — what % of confirmed bookings actually got completed
    const completionRate = confirmedBookings + completedBookings > 0
      ? Math.round((completedBookings / (confirmedBookings + completedBookings)) * 100)
      : null;

    res.json({
      totalViews,
      totalBookings,
      confirmedBookings,
      completedBookings,
      totalBrandEarnings,
      totalBrandDeals: acceptedDeals.length,
      averageRating,
      totalReviews: reviews.length,
      endorsementCount,
      achievementCount,
      verifiedAchievementCount,
      completionRate,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { recordProfileView, getMyAnalytics };