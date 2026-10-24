// dna.controller.js
// Athlete DNA: skill scores from self + coach assessments, a career goal, the
// gap to that goal, a weekly action plan, activity logging, a readiness %, and
// opportunities (coaches at the right level, upcoming tournaments).

const mongoose = require('mongoose');
const User = require('../models/user.model');
const Booking = require('../models/booking.model');
const Tournament = require('../models/tournament.model');
const Review = require('../models/review.model');
const Assessment = require('../models/assessment.model');
const ActivityLog = require('../models/activityLog.model');
const {
  DIMENSIONS, GOALS, ACTIVITY_BY_KEY, combineScores, overallOf, history, gapsFor,
  buildPlan, planProgress, readinessFor, cleanScores,
} = require('../utils/dna.util');

const isId = (id) => mongoose.Types.ObjectId.isValid(id);
const LOG_WINDOW_DAYS = 35; // enough for 4 full weeks of consistency + this week

// A coach may assess / view an athlete they've had a confirmed or completed session with
const hasCoachingRelation = (coachId, athleteId) =>
  Booking.exists({ coach: coachId, learner: athleteId, status: { $in: ['confirmed', 'completed'] } });

// Everything the dashboard shows for one athlete
const buildDashboard = async (athlete, { withOpportunities = false } = {}) => {
  const since = new Date(Date.now() - LOG_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const [assessments, logs] = await Promise.all([
    Assessment.find({ athlete: athlete._id }).sort({ createdAt: -1 }).populate('assessor', 'name profilePhoto role').lean(),
    ActivityLog.find({ athlete: athlete._id, doneAt: { $gte: since } }).sort({ doneAt: -1 }).lean(),
  ]);

  const combined = combineScores(assessments);
  const gaps = gapsFor(combined?.scores, athlete.careerGoal);
  const plan = buildPlan(gaps, athlete.sport);
  const { items, consistency } = planProgress(plan, logs);

  const dashboard = {
    athlete: { _id: athlete._id, name: athlete.name, sport: athlete.sport, location: athlete.location, profilePhoto: athlete.profilePhoto },
    dimensions: DIMENSIONS,
    goals: Object.entries(GOALS).map(([key, g]) => ({ key, label: g.label, target: g.target })),
    goal: athlete.careerGoal ? { key: athlete.careerGoal, ...GOALS[athlete.careerGoal], coachLevels: undefined } : null,
    scores: combined?.scores || null,
    overall: combined ? overallOf(combined.scores) : null,
    sources: combined ? {
      self: combined.self && { date: combined.self.createdAt },
      coaches: combined.coaches.map((a) => ({ name: a.assessor?.name, date: a.createdAt })),
    } : null,
    gaps,
    plan: items,
    consistency: Math.round(consistency * 100),
    readiness: readinessFor(combined?.scores, athlete.careerGoal, consistency),
    history: history(assessments),
    assessments: assessments.slice(0, 10).map((a) => ({
      _id: a._id, source: a.source, scores: a.scores, note: a.note, createdAt: a.createdAt,
      assessor: a.assessor && { _id: a.assessor._id, name: a.assessor.name },
    })),
    recentLogs: logs.slice(0, 15).map((l) => ({
      _id: l._id, activityKey: l.activityKey, title: ACTIVITY_BY_KEY[l.activityKey]?.title(athlete.sport) || l.activityKey,
      minutes: l.minutes, doneAt: l.doneAt,
    })),
    lastSelfAssessment: assessments.find((a) => a.source === 'self')?.createdAt || null,
  };

  if (withOpportunities) dashboard.opportunities = await opportunitiesFor(athlete);
  return dashboard;
};

// Coaches in the athlete's sport who teach at their goal level, plus upcoming tournaments
const opportunitiesFor = async (athlete) => {
  const levels = GOALS[athlete.careerGoal]?.coachLevels || ['beginner', 'intermediate', 'advanced'];
  const sportMatch = athlete.sport ? { $regex: `^${athlete.sport.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } : undefined;

  const coaches = await User.find({ role: 'coach', ...(sportMatch && { sport: sportMatch }), skillLevelTaught: { $in: levels } })
    .select('name profilePhoto sport location skillLevelTaught pricePerSession').lean();
  const ratings = await Review.aggregate([
    { $match: { coach: { $in: coaches.map((c) => c._id) } } },
    { $group: { _id: '$coach', avg: { $avg: '$rating' }, n: { $sum: 1 } } },
  ]);
  const ratingById = Object.fromEntries(ratings.map((r) => [String(r._id), r]));
  const sameCity = (c) => athlete.location && c.location?.toLowerCase() === athlete.location.toLowerCase();

  const rankedCoaches = coaches
    .map((c) => ({ ...c, rating: ratingById[String(c._id)] ? Math.round(ratingById[String(c._id)].avg * 10) / 10 : null, nearby: sameCity(c) }))
    .sort((a, b) => Number(b.nearby) - Number(a.nearby) || (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, 3);

  const tournaments = await Tournament.find({
    ...(sportMatch && { sport: sportMatch }),
    registrationDeadline: { $gte: new Date() },
  }).sort({ startDate: 1 }).limit(3).select('name sport location startDate registrationDeadline').lean();

  return { coaches: rankedCoaches, tournaments };
};

// GET /api/dna/me — the logged-in athlete's dashboard
const getMyDna = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'learner') {
      return res.status(403).json({ message: 'Athlete DNA is for athletes' });
    }
    res.json(await buildDashboard(req.user, { withOpportunities: true }));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/dna/athlete/:id — a coach's view of an athlete they've coached (or admin)
const getAthleteDna = async (req, res) => {
  try {
    if (!isId(req.params.id)) return res.status(400).json({ message: 'Invalid athlete id' });
    const athlete = await User.findOne({ _id: req.params.id, role: 'learner' });
    if (!athlete) return res.status(404).json({ message: 'Athlete not found' });

    const isSelf = req.user?._id.equals(athlete._id);
    const isAdmin = req.user?.role === 'admin';
    const isTheirCoach = req.user?.role === 'coach' && await hasCoachingRelation(req.user._id, athlete._id);
    if (!isSelf && !isAdmin && !isTheirCoach) {
      return res.status(403).json({ message: 'Only this athlete and coaches they have had sessions with can see their DNA' });
    }
    res.json({ ...(await buildDashboard(athlete)), canAssess: Boolean(isTheirCoach) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/dna/goal — { goal }
const setGoal = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'learner') return res.status(403).json({ message: 'Only athletes set a career goal' });
    if (!GOALS[req.body.goal]) return res.status(400).json({ message: 'Unknown goal' });
    await User.updateOne({ _id: req.user._id }, { careerGoal: req.body.goal });
    res.json(await buildDashboard({ ...req.user.toObject(), careerGoal: req.body.goal }, { withOpportunities: true }));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/dna/assessments — { scores, note, athleteId? }
// Athletes assess themselves (no athleteId); coaches assess an athlete they've coached.
const addAssessment = async (req, res) => {
  try {
    if (!req.user) return res.status(403).json({ message: 'Only users can submit assessments' });
    const { scores, error } = cleanScores(req.body.scores);
    if (error) return res.status(400).json({ message: error });
    const note = typeof req.body.note === 'string' ? req.body.note.trim().slice(0, 500) : '';

    const athleteId = req.body.athleteId || req.user._id;
    const self = req.user._id.equals(athleteId);
    if (self) {
      if (req.user.role !== 'learner') return res.status(403).json({ message: 'Only athletes have a DNA to assess' });
    } else {
      if (!isId(athleteId)) return res.status(400).json({ message: 'Invalid athlete id' });
      if (req.user.role !== 'coach') return res.status(403).json({ message: 'Only coaches can assess other athletes' });
      if (!(await User.exists({ _id: athleteId, role: 'learner' }))) return res.status(404).json({ message: 'Athlete not found' });
      if (!(await hasCoachingRelation(req.user._id, athleteId))) {
        return res.status(403).json({ message: 'You can only assess athletes you have had a session with' });
      }
    }

    await Assessment.create({ athlete: athleteId, assessor: req.user._id, source: self ? 'self' : 'coach', scores, note });
    const athlete = self ? req.user : await User.findById(athleteId);
    res.status(201).json(await buildDashboard(athlete, { withOpportunities: self }));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/dna/activities — { activityKey, minutes? } logs one plan activity as done today
const logActivity = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'learner') return res.status(403).json({ message: 'Only athletes log activities' });
    const activity = ACTIVITY_BY_KEY[req.body.activityKey];
    if (!activity) return res.status(400).json({ message: 'Unknown activity' });
    const minutes = req.body.minutes === undefined || req.body.minutes === '' ? undefined : Number(req.body.minutes);
    if (minutes !== undefined && (!Number.isInteger(minutes) || minutes < 1 || minutes > 600)) {
      return res.status(400).json({ message: 'Minutes must be a whole number from 1 to 600' });
    }
    await ActivityLog.create({ athlete: req.user._id, activityKey: activity.key, dimension: activity.dimension, minutes });
    res.status(201).json(await buildDashboard(req.user, { withOpportunities: true }));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/dna/activities/:id — undo a log (own logs only)
const deleteActivity = async (req, res) => {
  try {
    if (!isId(req.params.id)) return res.status(400).json({ message: 'Invalid id' });
    const result = await ActivityLog.deleteOne({ _id: req.params.id, athlete: req.user._id });
    if (!result.deletedCount) return res.status(404).json({ message: 'Activity not found' });
    res.json(await buildDashboard(req.user, { withOpportunities: true }));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/dna/my-athletes — for coaches: athletes they've coached, with readiness
const getMyAthletes = async (req, res) => {
  try {
    if (req.user?.role !== 'coach') return res.status(403).json({ message: 'Only coaches have athletes' });
    const athleteIds = await Booking.find({ coach: req.user._id, status: { $in: ['confirmed', 'completed'] } }).distinct('learner');
    const athletes = await User.find({ _id: { $in: athleteIds }, role: 'learner' }).select('name profilePhoto sport location careerGoal');

    const rows = await Promise.all(athletes.map(async (a) => {
      const d = await buildDashboard(a);
      const mine = d.assessments.find((x) => x.assessor && String(x.assessor._id) === String(req.user._id));
      return {
        _id: a._id, name: a.name, profilePhoto: a.profilePhoto, sport: a.sport,
        goal: d.goal?.label || null, readiness: d.readiness, overall: d.overall,
        lastAssessedByYou: mine?.createdAt || null,
      };
    }));
    res.json(rows.sort((a, b) => a.name.localeCompare(b.name)));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Readiness for many athletes at once (used by brand talent search). { id: readiness|null }
const readinessForAthletes = async (athletes) => {
  const result = {};
  await Promise.all(athletes.map(async (a) => { result[String(a._id)] = (await buildDashboard(a)).readiness; }));
  return result;
};

module.exports = {
  getMyDna, getAthleteDna, setGoal, addAssessment, logActivity, deleteActivity, getMyAthletes,
  readinessForAthletes,
};
