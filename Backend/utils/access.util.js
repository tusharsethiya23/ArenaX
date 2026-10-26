// access.util.js
// The one place that decides what each plan includes. Everything is free
// today; when a feature becomes Pro later, move it out of the `free` list
// here (and in frontend/src/utils/access.js) and nothing else needs to change.
//
//   canAccess(user, 'aiCoach')      -> true / false
//   router.post('/', protect, requireAccess('aiCoach'), handler)

const FEATURES = [
  'aiCoach',            // AI coach chat
  'athleteDna',         // Athlete DNA dashboard, assessments and drills
  'advancedDrills',     // advanced-level drills
  'coachMatching',      // best-matching coaches for your gaps
  'directMessages',     // private messages
  'marketplaceListing', // listing gear on the marketplace
  'coachStats',         // coach performance stats
];

const PLAN_FEATURES = {
  free: new Set(FEATURES),
  pro: new Set(FEATURES),
};

const canAccess = (user, feature) => {
  const plan = PLAN_FEATURES[user?.plan] ? user.plan : 'free';
  return PLAN_FEATURES[plan].has(feature);
};

// Express middleware: 403 with code UPGRADE_REQUIRED if the user's plan lacks the feature
const requireAccess = (feature) => (req, res, next) => (canAccess(req.user, feature)
  ? next()
  : res.status(403).json({ code: 'UPGRADE_REQUIRED', feature, message: 'This is a Pro feature. Pro is coming soon.' }));

module.exports = { FEATURES, canAccess, requireAccess };
