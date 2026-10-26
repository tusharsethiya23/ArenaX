// dna.util.js
// The rules behind "Athlete DNA": the six skills, career goals and their target
// scores, the drill library and its levels, and the maths that turns assessments and
// activity logs into scores, gaps, an action plan and a readiness %.
// Pure functions, no database access, so they're easy to reason about.

// ---------- Skills (scored 1-10) ----------
const DIMENSIONS = [
  { key: 'technique', label: 'Technique' },
  { key: 'gameSense', label: 'Game sense' },
  { key: 'fitness', label: 'Fitness' },
  { key: 'speed', label: 'Speed & agility' },
  { key: 'mental', label: 'Mental strength' },
  { key: 'discipline', label: 'Discipline' },
];
const DIMENSION_KEYS = DIMENSIONS.map((d) => d.key);

// ---------- Career goals: each sets a target score and which coaches suit it ----------
const GOALS = {
  recreational: { label: 'Stay fit & enjoy the game', target: 4, coachLevels: ['beginner', 'intermediate'] },
  club: { label: 'Play for a club', target: 5, coachLevels: ['beginner', 'intermediate'] },
  district: { label: 'District level', target: 6, coachLevels: ['intermediate', 'advanced'] },
  state: { label: 'State level', target: 7, coachLevels: ['intermediate', 'advanced'] },
  national: { label: 'National level', target: 8, coachLevels: ['advanced'] },
  professional: { label: 'Professional', target: 9, coachLevels: ['advanced'] },
};

// ---------- Drill library: what to do to close a gap in each skill ----------
// Every skill has a beginner, intermediate and advanced drill (see DRILL_LEVELS
// for how levels unlock). Keys are stored in activity logs: never rename them.
const ACTIVITIES = [
  { key: 'technique-drills', level: 'beginner', dimension: 'technique', title: (s) => `${s || 'Sport'} technique drills`, perWeek: 3 },
  { key: 'video-review', level: 'intermediate', dimension: 'technique', title: () => 'Film and review your technique', perWeek: 1 },
  { key: 'pressure-reps', level: 'advanced', dimension: 'technique', title: () => 'Technique under pressure: 50 game-speed reps', perWeek: 2 },
  { key: 'study-games', level: 'beginner', dimension: 'gameSense', title: () => 'Watch and analyse a top-level match', perWeek: 1 },
  { key: 'match-play', level: 'intermediate', dimension: 'gameSense', title: () => 'Play a practice match', perWeek: 2 },
  { key: 'scenario-play', level: 'advanced', dimension: 'gameSense', title: () => 'Scenario training: play out 10 match situations', perWeek: 2 },
  { key: 'endurance', level: 'beginner', dimension: 'fitness', title: () => '30-min endurance run or cycle', perWeek: 3 },
  { key: 'strength', level: 'intermediate', dimension: 'fitness', title: () => 'Strength session (gym or bodyweight)', perWeek: 2 },
  { key: 'hiit', level: 'advanced', dimension: 'fitness', title: () => 'HIIT circuit: 20 min of 40 s on / 20 s off', perWeek: 2 },
  { key: 'agility', level: 'beginner', dimension: 'speed', title: () => 'Agility ladder and cone drills', perWeek: 2 },
  { key: 'sprints', level: 'intermediate', dimension: 'speed', title: () => 'Sprint intervals (8 × 30 m)', perWeek: 2 },
  { key: 'reaction-sprints', level: 'advanced', dimension: 'speed', title: () => 'Reaction sprints on a partner\'s call (10 × 20 m)', perWeek: 2 },
  { key: 'journal', level: 'beginner', dimension: 'mental', title: () => 'Training journal: what went well, what to fix', perWeek: 2 },
  { key: 'visualisation', level: 'intermediate', dimension: 'mental', title: () => '10-min visualisation and breathing', perWeek: 4 },
  { key: 'pressure-routine', level: 'advanced', dimension: 'mental', title: () => 'Mock competition with your pre-game routine', perWeek: 1 },
  { key: 'sleep', level: 'beginner', dimension: 'discipline', title: () => '8 hours of sleep', perWeek: 5 },
  { key: 'mobility', level: 'intermediate', dimension: 'discipline', title: () => '15-min mobility and stretching', perWeek: 4 },
  { key: 'recovery-protocol', level: 'advanced', dimension: 'discipline', title: () => 'Full recovery routine: mobility, foam roll, cold shower', perWeek: 3 },
];
const ACTIVITY_BY_KEY = Object.fromEntries(ACTIVITIES.map((a) => [a.key, a]));

// ---------- Drill levels and how they unlock ----------
//   beginner:     open to everyone
//   intermediate: 5 completed beginner drills, or a 7-day streak (best streak counts)
//   advanced:     5 completed intermediate drills, or 500 Arena Points
const DRILL_LEVELS = ['beginner', 'intermediate', 'advanced'];
const UNLOCK = {
  intermediate: { drills: 5, streak: 7, condition: 'Complete 5 beginner drills or reach a 7-day streak' },
  advanced: { drills: 5, points: 500, condition: 'Complete 5 intermediate drills or earn 500 Arena Points' },
};

// done: { beginner, intermediate } completed-drill counts (all time)
const drillUnlocks = ({ done, bestStreak = 0, points = 0 }) => ({
  beginner: { unlocked: true },
  intermediate: {
    unlocked: done.beginner >= UNLOCK.intermediate.drills || bestStreak >= UNLOCK.intermediate.streak,
    condition: UNLOCK.intermediate.condition,
    progress: [
      { label: 'Beginner drills', value: Math.min(done.beginner, UNLOCK.intermediate.drills), target: UNLOCK.intermediate.drills },
      { label: 'Best streak (days)', value: Math.min(bestStreak, UNLOCK.intermediate.streak), target: UNLOCK.intermediate.streak },
    ],
  },
  advanced: {
    unlocked: done.intermediate >= UNLOCK.advanced.drills || points >= UNLOCK.advanced.points,
    condition: UNLOCK.advanced.condition,
    progress: [
      { label: 'Intermediate drills', value: Math.min(done.intermediate, UNLOCK.advanced.drills), target: UNLOCK.advanced.drills },
      { label: 'Arena Points', value: Math.min(points, UNLOCK.advanced.points), target: UNLOCK.advanced.points },
    ],
  },
});

const COACH_WEIGHT = 2;          // a coach's assessment counts double a self-rating
const COACH_ASSESSMENT_DAYS = 120; // older coach assessments stop counting
const DAY = 24 * 60 * 60 * 1000;
const round1 = (n) => Math.round(n * 10) / 10;

// Monday 00:00 of the week containing `date`
const weekStart = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
};

// Combines assessments (newest self-rating + each coach's newest recent one)
// into one score per skill. Returns null when there's nothing to go on.
const combineScores = (assessments, at = new Date()) => {
  const usable = assessments.filter((a) => new Date(a.createdAt) <= at);
  const self = usable.filter((a) => a.source === 'self').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
  const latestByCoach = {};
  for (const a of usable.filter((x) => x.source === 'coach' && at - new Date(x.createdAt) <= COACH_ASSESSMENT_DAYS * DAY)) {
    const id = String(a.assessor?._id || a.assessor);
    if (!latestByCoach[id] || new Date(a.createdAt) > new Date(latestByCoach[id].createdAt)) latestByCoach[id] = a;
  }
  const weighted = [
    ...(self ? [{ a: self, w: 1 }] : []),
    ...Object.values(latestByCoach).map((a) => ({ a, w: COACH_WEIGHT })),
  ];
  if (weighted.length === 0) return null;

  const totalWeight = weighted.reduce((n, x) => n + x.w, 0);
  const scores = Object.fromEntries(DIMENSION_KEYS.map((k) => [
    k, round1(weighted.reduce((n, x) => n + x.a.scores[k] * x.w, 0) / totalWeight),
  ]));
  return { scores, self: self || null, coaches: Object.values(latestByCoach) };
};

const overallOf = (scores) => round1(DIMENSION_KEYS.reduce((n, k) => n + scores[k], 0) / DIMENSION_KEYS.length);

// Overall score after each assessment, oldest first (one point per day)
const history = (assessments) => {
  const days = [...new Set(assessments.map((a) => new Date(a.createdAt).toISOString().slice(0, 10)))].sort();
  return days.map((day) => {
    const combined = combineScores(assessments, new Date(`${day}T23:59:59.999Z`));
    return combined && { date: day, overall: overallOf(combined.scores) };
  }).filter(Boolean);
};

// target - current for each skill, biggest gap first
const gapsFor = (scores, goalKey) => {
  const target = GOALS[goalKey]?.target;
  if (!scores || !target) return [];
  return DIMENSIONS
    .map((d) => ({ ...d, current: scores[d.key], target, gap: round1(Math.max(0, target - scores[d.key])) }))
    .sort((a, b) => b.gap - a.gap || a.current - b.current);
};

// Weekly plan from the three biggest gaps (two drills for the biggest), using
// only unlocked levels and the hardest unlocked drill first. If every skill
// already meets the goal, a maintenance plan for the two lowest.
const buildPlan = (gaps, sport, unlockedLevels = ['beginner']) => {
  if (gaps.length === 0) return [];
  const open = gaps.filter((g) => g.gap > 0);
  const focus = open.length ? open.slice(0, 3) : [...gaps].sort((a, b) => a.current - b.current).slice(0, 2);
  return focus.flatMap((g, i) => ACTIVITIES
    .filter((a) => a.dimension === g.key && unlockedLevels.includes(a.level))
    .sort((a, b) => DRILL_LEVELS.indexOf(b.level) - DRILL_LEVELS.indexOf(a.level))
    .slice(0, i === 0 && open.length ? 2 : 1)
    .map((a) => ({ key: a.key, level: a.level, dimension: a.dimension, dimensionLabel: g.label, title: a.title(sport), perWeek: a.perWeek })));
};

// This week's progress per plan item, and plan consistency over the last 4 weeks (0-1)
const planProgress = (plan, logs, now = new Date()) => {
  const thisWeek = weekStart(now);
  const items = plan.map((p) => ({
    ...p,
    doneThisWeek: logs.filter((l) => l.activityKey === p.key && new Date(l.doneAt) >= thisWeek).length,
  }));
  if (plan.length === 0) return { items, consistency: 0 };

  let done = 0;
  let expected = 0;
  for (let w = 0; w < 4; w++) {
    const start = new Date(thisWeek.getTime() - w * 7 * DAY);
    const end = new Date(start.getTime() + 7 * DAY);
    // The current week only counts the share of the week that has passed
    const share = w === 0 ? Math.min(1, (now - start) / (7 * DAY)) : 1;
    for (const p of plan) {
      const n = logs.filter((l) => l.activityKey === p.key && new Date(l.doneAt) >= start && new Date(l.doneAt) < end).length;
      done += Math.min(n, p.perWeek);
      expected += p.perWeek * share;
    }
  }
  return { items, consistency: expected ? Math.min(1, done / expected) : 0 };
};

// Career readiness %: 80% how close skills are to the goal, 20% plan consistency
const readinessFor = (scores, goalKey, consistency) => {
  const target = GOALS[goalKey]?.target;
  if (!scores || !target) return null;
  const skill = DIMENSION_KEYS.reduce((n, k) => n + Math.min(scores[k] / target, 1), 0) / DIMENSION_KEYS.length;
  return Math.round((0.8 * skill + 0.2 * consistency) * 100);
};

// Validates a scores object from a request: every skill, whole numbers 1-10
const cleanScores = (input) => {
  if (!input || typeof input !== 'object') return { error: 'Scores are required' };
  const scores = {};
  for (const k of DIMENSION_KEYS) {
    const n = Number(input[k]);
    if (!Number.isInteger(n) || n < 1 || n > 10) return { error: `${DIMENSIONS.find((d) => d.key === k).label} must be a whole number from 1 to 10` };
    scores[k] = n;
  }
  return { scores };
};

module.exports = {
  DIMENSIONS, DIMENSION_KEYS, GOALS, ACTIVITIES, ACTIVITY_BY_KEY, DRILL_LEVELS, drillUnlocks,
  combineScores, overallOf, history, gapsFor, buildPlan, planProgress, readinessFor, cleanScores, weekStart,
};
