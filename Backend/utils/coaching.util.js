// coaching.util.js
// "Has this coach actually trained this athlete?" — a confirmed or completed
// booking between them. Used wherever a coach gets rights over an athlete:
// assessing their Athlete DNA and verifying their achievements.

const Booking = require('../models/booking.model');

const COACHED_STATUSES = ['confirmed', 'completed'];

const hasCoachingRelation = (coachId, athleteId) =>
  Booking.exists({ coach: coachId, learner: athleteId, status: { $in: COACHED_STATUSES } });

// Coach ids an athlete has trained with
const coachesOf = (athleteId) =>
  Booking.find({ learner: athleteId, status: { $in: COACHED_STATUSES } }).distinct('coach');

module.exports = { hasCoachingRelation, coachesOf, COACHED_STATUSES };
