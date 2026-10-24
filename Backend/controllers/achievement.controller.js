// achievement.controller.js
// Portfolio + verification.
//   - Users add, edit and delete their own achievements (with an optional proof link).
//   - Athletes ask a coach they've trained with to verify one; coaches' own
//     achievements go to the admin (ArenaX team) queue.
//   - Only that coach (or any coach who has trained the athlete) or an admin can
//     verify or decline. Editing an achievement resets its verification.

const mongoose = require('mongoose');
const Achievement = require('../models/achievement.model');
const User = require('../models/user.model');
const { hasCoachingRelation, coachesOf } = require('../utils/coaching.util');

const { CATEGORIES, LEVELS } = Achievement;
const PERSON = 'name profilePhoto role sport';
const isId = (id) => mongoose.Types.ObjectId.isValid(id);

// Older documents only have `verified`; derive the status for them
const statusOf = (a) => a.status || (a.verified ? 'verified' : 'unverified');

// Can `viewer` verify/decline this achievement owned by `owner`?
const canVerify = async (viewer, achievement, owner) => {
  if (!viewer || !owner) return false;
  if (viewer.role === 'admin') return !viewer._id.equals(owner._id);
  if (viewer._id.equals(owner._id)) return false;
  // Coaches verify athletes they've trained; coaches' own achievements are admin-only
  return viewer.role === 'coach' && owner.role === 'learner' && Boolean(await hasCoachingRelation(viewer._id, owner._id));
};

// Achievement as the API returns it
const shape = (a, extra = {}) => ({
  _id: a._id,
  user: a.user,
  title: a.title,
  description: a.description,
  category: a.category || 'competition',
  level: a.level || null,
  date: a.date,
  proofLink: a.proofLink,
  status: statusOf(a),
  verified: statusOf(a) === 'verified',
  // Admin reviews are shown as the ArenaX team, not the admin's own name
  verifiedBy: a.verifiedBy && a.verifiedBy.name
    ? { _id: a.verifiedBy._id, name: a.verifiedBy.role === 'admin' ? 'ArenaX team' : a.verifiedBy.name }
    : null,
  requestedFrom: a.requestedFrom && a.requestedFrom.name ? { _id: a.requestedFrom._id, name: a.requestedFrom.name } : null,
  reviewedAt: a.reviewedAt || null,
  reviewNote: a.reviewNote || '',
  createdAt: a.createdAt,
  ...extra,
});

// Validates the editable fields. `partial` allows leaving fields out (edits).
const clean = (body, partial = false) => {
  const out = {};
  const has = (k) => body[k] !== undefined;

  if (!partial || has('title')) {
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    if (!title) return { error: 'Give the achievement a title' };
    if (title.length > 100) return { error: 'Title can be at most 100 characters' };
    out.title = title;
  }
  if (!partial || has('date')) {
    const date = new Date(body.date);
    if (!body.date || Number.isNaN(date.getTime())) return { error: 'Add the date it happened' };
    if (date > new Date(Date.now() + 24 * 60 * 60 * 1000)) return { error: 'The date cannot be in the future' };
    if (date < new Date('1950-01-01')) return { error: 'That date looks wrong' };
    out.date = date;
  }
  if (has('description')) {
    const d = String(body.description).trim();
    if (d.length > 500) return { error: 'Description can be at most 500 characters' };
    out.description = d;
  }
  if (has('category')) {
    if (!CATEGORIES.includes(body.category)) return { error: 'Unknown category' };
    out.category = body.category;
  }
  if (has('level')) {
    if (body.level !== '' && body.level !== null && !LEVELS.includes(body.level)) return { error: 'Unknown level' };
    out.level = body.level || undefined;
  }
  if (has('proofLink')) {
    const link = String(body.proofLink).trim();
    if (link) {
      let url;
      try { url = new URL(link); } catch { return { error: 'Proof link must be a full web address (https://...)' }; }
      if (!['http:', 'https:'].includes(url.protocol)) return { error: 'Proof link must start with http:// or https://' };
      if (link.length > 500) return { error: 'Proof link is too long' };
    }
    out.proofLink = link;
  }
  return { value: out };
};

const loadOwned = async (req, res) => {
  if (!isId(req.params.id)) { res.status(400).json({ message: 'Invalid achievement id' }); return null; }
  const a = await Achievement.findById(req.params.id);
  if (!a) { res.status(404).json({ message: 'Achievement not found' }); return null; }
  return a;
};

// GET /api/achievements/:userId — someone's portfolio, newest first.
// Includes `canVerify` for the viewer (if logged in).
const getAchievementsForUser = async (req, res) => {
  try {
    if (!isId(req.params.userId)) return res.status(400).json({ message: 'Invalid user id' });
    const owner = await User.findById(req.params.userId).select('role');
    if (!owner) return res.status(404).json({ message: 'User not found' });

    const items = await Achievement.find({ user: owner._id })
      .sort({ date: -1 })
      .populate('verifiedBy', 'name role')
      .populate('requestedFrom', 'name')
      .lean();
    const viewerCanVerify = await canVerify(req.user, items[0] || {}, owner);
    res.json(items.map((a) => shape(a, { canVerify: viewerCanVerify && statusOf(a) !== 'verified' })));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/achievements — add to my portfolio
const addAchievement = async (req, res) => {
  try {
    if (!req.user) return res.status(403).json({ message: 'Only users have a portfolio' });
    const { value, error } = clean(req.body);
    if (error) return res.status(400).json({ message: error });
    const a = await Achievement.create({ ...value, user: req.user._id, status: 'unverified', verified: false });
    res.status(201).json(shape(a.toObject()));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/achievements/:id — edit my achievement; resets any verification
const updateAchievement = async (req, res) => {
  try {
    const a = await loadOwned(req, res);
    if (!a) return;
    if (!req.user || !a.user.equals(req.user._id)) return res.status(403).json({ message: 'You can only edit your own achievements' });
    const { value, error } = clean(req.body, true);
    if (error) return res.status(400).json({ message: error });

    Object.assign(a, value);
    // Verification was for the old details: start over
    Object.assign(a, { status: 'unverified', verified: false, verifiedBy: null, requestedFrom: null, reviewedAt: undefined, reviewNote: '' });
    await a.save();
    res.json(shape(a.toObject()));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/achievements/:id — owner or admin
const deleteAchievement = async (req, res) => {
  try {
    const a = await loadOwned(req, res);
    if (!a) return;
    if (!req.user || (!a.user.equals(req.user._id) && req.user.role !== 'admin')) {
      return res.status(403).json({ message: 'You can only delete your own achievements' });
    }
    await a.deleteOne();
    res.json({ message: 'Achievement deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/achievements/verifiers — coaches I can ask (athletes: coaches I've trained with)
const getVerifiers = async (req, res) => {
  try {
    if (req.user?.role !== 'learner') return res.json([]);
    const ids = await coachesOf(req.user._id);
    res.json(await User.find({ _id: { $in: ids }, role: 'coach' }).select(PERSON).sort({ name: 1 }));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/achievements/:id/request-verification — { coachId } for athletes;
// coaches' requests go to the admin queue
const requestVerification = async (req, res) => {
  try {
    const a = await loadOwned(req, res);
    if (!a) return;
    if (!req.user || !a.user.equals(req.user._id)) return res.status(403).json({ message: 'You can only request verification for your own achievements' });
    if (statusOf(a) === 'verified') return res.status(400).json({ message: 'This achievement is already verified' });

    let requestedFrom = null;
    if (req.user.role === 'learner') {
      const { coachId } = req.body;
      if (!isId(coachId)) return res.status(400).json({ message: 'Choose a coach to verify it' });
      if (!(await hasCoachingRelation(coachId, req.user._id))) {
        return res.status(403).json({ message: 'You can only ask coaches you have had a session with' });
      }
      requestedFrom = coachId;
    } else if (req.user.role !== 'coach') {
      return res.status(403).json({ message: 'Only athletes and coaches can request verification' });
    }

    Object.assign(a, { status: 'pending', requestedFrom, reviewNote: '', reviewedAt: undefined });
    await a.save();
    await a.populate('requestedFrom', 'name');
    res.json(shape(a.toObject()));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/achievements/:id/verify — { note? }   PUT /api/achievements/:id/reject — { note }
const review = (approve) => async (req, res) => {
  try {
    const a = await loadOwned(req, res);
    if (!a) return;
    const owner = await User.findById(a.user).select('role');
    if (!(await canVerify(req.user, a, owner))) {
      return res.status(403).json({
        message: owner?.role === 'coach'
          ? "Coaches' achievements are reviewed by the ArenaX team"
          : 'Only coaches who have trained this athlete can review their achievements',
      });
    }
    const note = typeof req.body.note === 'string' ? req.body.note.trim().slice(0, 300) : '';
    if (!approve && !note) return res.status(400).json({ message: 'Add a short note explaining why' });

    Object.assign(a, {
      status: approve ? 'verified' : 'rejected',
      verified: approve,
      verifiedBy: approve ? req.user._id : null,
      requestedFrom: null,
      reviewedAt: new Date(),
      reviewNote: note,
    });
    await a.save();
    await a.populate('verifiedBy', 'name role');
    res.json(shape(a.toObject()));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/achievements/requests/pending — what's waiting for me to review
// (coaches: requests addressed to them; admins: the ArenaX team queue)
const getPendingRequests = async (req, res) => {
  try {
    let filter;
    if (req.user?.role === 'coach') filter = { status: 'pending', requestedFrom: req.user._id };
    else if (req.user?.role === 'admin') filter = { status: 'pending', requestedFrom: null };
    else return res.json([]);

    const items = await Achievement.find(filter).sort({ updatedAt: 1 }).populate('user', PERSON).lean();
    res.json(items.filter((a) => a.user).map((a) => shape(a, { owner: a.user, user: a.user._id, requestedAt: a.updatedAt })));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAchievementsForUser, addAchievement, updateAchievement, deleteAchievement,
  getVerifiers, requestVerification, getPendingRequests,
  verifyAchievement: review(true), rejectAchievement: review(false),
};
