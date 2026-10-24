// match.controller.js
// Coach recommendations for athletes, based on their DNA gaps, goal level,
// city, coach quality and availability (see utils/match.util.js).

const mongoose = require('mongoose');
const { matchCoachesFor } = require('../utils/match.util');

const MAX_LIMIT = 50;

const learnerOnly = (req, res) => {
  if (!req.user || req.user.role !== 'learner') {
    res.status(403).json({ message: 'Coach matching is for athletes' });
    return false;
  }
  return true;
};

// GET /api/match/coaches?limit=6 — best-matching coaches in my sport, best first
const getMatches = async (req, res) => {
  try {
    if (!learnerOnly(req, res)) return;
    const limit = Math.min(MAX_LIMIT, Math.max(1, Number.parseInt(req.query.limit, 10) || MAX_LIMIT));
    res.json(await matchCoachesFor(req.user, { limit }));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/match/coaches/:coachId — how well one coach fits me (any sport)
const getMatchForCoach = async (req, res) => {
  try {
    if (!learnerOnly(req, res)) return;
    if (!mongoose.Types.ObjectId.isValid(req.params.coachId)) {
      return res.status(404).json({ message: 'Coach not found' });
    }
    const { basis, coaches } = await matchCoachesFor(req.user, { coachId: req.params.coachId });
    if (!coaches.length) return res.status(404).json({ message: 'Coach not found' });
    res.json({ basis, coach: coaches[0] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getMatches, getMatchForCoach };
