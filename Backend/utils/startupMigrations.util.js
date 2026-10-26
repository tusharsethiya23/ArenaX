// startupMigrations.util.js
// Brings older data up to date when the server starts. Every step is safe to
// run again (it only touches documents that still need it), so it simply runs
// on each start instead of needing a manual script on the host.
//   - accounts from before these fields existed: founding member, free plan, 0 points
//   - money is gone from ArenaX: drop stored session prices, deal and spotlight amounts
//   - coaches: work out the automatic verified badge from their record

const mongoose = require('mongoose');
const User = require('../models/user.model');
const Booking = require('../models/booking.model');
const { MIN_SESSIONS, refreshCoachVerified } = require('./coachVerification.util');

const runStartupMigrations = async () => {
  // Raw collection updates: these fields may not be in the schema any more
  const users = User.collection;
  const results = await Promise.all([
    users.updateMany({ foundingMember: { $exists: false } }, { $set: { foundingMember: true } }),
    users.updateMany({ plan: { $exists: false } }, { $set: { plan: 'free' } }),
    users.updateMany({ points: { $exists: false } }, { $set: { points: 0 } }),
    users.updateMany({ pricePerSession: { $exists: true } }, { $unset: { pricePerSession: '' } }),
    User.db.collection('deals').updateMany({ offerAmount: { $exists: true } }, { $unset: { offerAmount: '', commissionRate: '' } }),
    User.db.collection('spotlights').updateMany({ amountPaid: { $exists: true } }, { $unset: { amountPaid: '' } }),
  ]);

  // Coaches who could qualify, plus anyone already marked (in case they no longer do)
  const busy = await Booking.aggregate([
    { $match: { status: 'completed' } },
    { $group: { _id: '$coach', n: { $sum: 1 } } },
    { $match: { n: { $gte: MIN_SESSIONS } } },
  ]);
  const marked = await User.find({ role: 'coach', coachVerified: true }).distinct('_id');
  const coachIds = [...new Set([...busy.map((b) => String(b._id)), ...marked.map(String)])];
  for (const id of coachIds) await refreshCoachVerified(new mongoose.Types.ObjectId(id));

  const changed = results.reduce((n, r) => n + (r.modifiedCount || 0), 0);
  if (changed || coachIds.length) console.log(`Startup migrations: ${changed} documents updated, ${coachIds.length} coaches checked for verification`);
};

module.exports = { runStartupMigrations };
