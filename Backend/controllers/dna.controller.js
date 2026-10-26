// dna.controller.js
// Athlete DNA: skill scores from self + coach assessments, a career goal, the
// gap to that goal, a weekly action plan, drill logging (drills have levels that
// unlock, see DRILL_LEVELS in dna.util.js), a readiness %, and opportunities
// (coaches at the right level, upcoming tournaments).

const mongoose = require('mongoose');
const User = require('../models/user.model');
const Booking = require('../models/booking.model');
const Tournament = require('../models/tournament.model');
const Assessment = require('../models/assessment.model');
const ActivityLog = require('../models/activityLog.model');
const {
  DIMENSIONS, GOALS, ACTIVITIES, ACTIVITY_BY_KEY, DRILL_LEVELS, drillUnlocks, combineScores, overallOf, history, gapsFor,
  buildPlan, planProgress, readinessFor, cleanScores,
} = require('../utils/dna.util');
const { canAccess } = require('../utils/access.util');
// A coach may assess / view an athlete they've had a confirmed or completed session with
const { hasCoachingRelation } = require('../utils/coaching.util');
const { matchCoachesFor } = require('../utils/match.util');

const isId = (id) => mongoose.Types.ObjectId.isValid(id);
const LOG_WINDOW_DAYS = 35; // enough for 4 full weeks of consistency + this week


// Which drill levels the athlete has unlocked, from their all-time completed
// drills per level, best streak and Arena Points
const drillLevelsFor = async (athlete) => {
  const [counts, fresh] = await Promise.all([
    ActivityLog.aggregate([{ $match: { athlete: athlete._id } }, { $group: { _id: '$activityKey', n: { $sum: 1 } } }]),
    User.findById(athlete._id).select('points streak plan').lean(), // never a cached copy
  ]);
  const done = { beginner: 0, intermediate: 0, advanced: 0 };
  for (const c of counts) {
    const level = ACTIVITY_BY_KEY[c._id]?.level;
    if (level) done[level] += c.n;
  }
  const levels = drillUnlocks({ done, bestStreak: fresh?.streak?.best || 0, points: fresh?.points || 0 });
  // Advanced drills may become a Pro feature one day
  if (!canAccess(fresh, 'advancedDrills')) levels.advanced = { ...levels.advanced, unlocked: false, condition: 'Coming with ArenaX Pro' };
  return { done, levels, unlocked: DRILL_LEVELS.filter((l) => levels[l].unlocked) };
};

// Everything the dashboard shows for one athlete
const buildDashboard = async (athlete, { withOpportunities = false } = {}) => {
  const since = new Date(Date.now() - LOG_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const [assessments, logs, drillLevels] = await Promise.all([
    Assessment.find({ athlete: athlete._id }).sort({ createdAt: -1 }).populate('assessor', 'name profilePhoto role').lean(),
    ActivityLog.find({ athlete: athlete._id, doneAt: { $gte: since } }).sort({ doneAt: -1 }).lean(),
    drillLevelsFor(athlete),
  ]);

  const combined = combineScores(assessments);
  const gaps = gapsFor(combined?.scores, athlete.careerGoal);
  const plan = buildPlan(gaps, athlete.sport, drillLevels.unlocked);
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
    // The whole drill library by level, with what's locked and how to unlock it
    drillLevels: DRILL_LEVELS.map((level) => ({ level, ...drillLevels.levels[level], completed: drillLevels.done[level] })),
    drills: ACTIVITIES.map((a) => ({
      key: a.key, level: a.level, dimension: a.dimension,
      dimensionLabel: DIMENSIONS.find((d) => d.key === a.dimension)?.label,
      title: a.title(athlete.sport), perWeek: a.perWeek,
      locked: !drillLevels.unlocked.includes(a.level),
    })),
  };

  if (withOpportunities) dashboard.opportunities = await opportunitiesFor(athlete);
  return dashboard;
};

// Best-matching coaches for the athlete's gaps (utils/match.util.js), plus upcoming tournaments
const opportunitiesFor = async (athlete) => {
  const sportMatch = athlete.sport ? { $regex: `^${athlete.sport.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } : undefined;
  const { coaches } = await matchCoachesFor(athlete, { limit: 3 });
  const rankedCoaches = coaches.map((c) => ({
    _id: c._id, name: c.name, profilePhoto: c.profilePhoto, sport: c.sport, location: c.location,
    skillLevelTaught: c.skillLevelTaught, rating: c.rating, match: c.match,
  }));

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
    const { levels } = await drillLevelsFor(req.user);
    if (!levels[activity.level].unlocked) {
      return res.status(403).json({ code: 'DRILL_LOCKED', message: `This ${activity.level} drill is locked. ${levels[activity.level].condition} to unlock it.` });
    }
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
