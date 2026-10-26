// access.js
// What each plan includes. Keep in sync with Backend/utils/access.util.js
// (the server enforces it; this decides what the app shows). Everything is
// free today: when a feature becomes Pro, move it out of `free` in both files.
//
//   canAccess(user, 'aiCoach') -> true / false

export const FEATURES = [
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

export const canAccess = (user, feature) => {
    const plan = PLAN_FEATURES[user?.plan] ? user.plan : 'free';
    return PLAN_FEATURES[plan].has(feature);
};
