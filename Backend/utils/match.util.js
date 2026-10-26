// match.util.js
// Coach matching: ranks coaches for one athlete and explains why.
//
// Each coach gets a 0-100 match from these parts (weights below). A part the
// athlete has no data for (no DNA yet, no city) is left out and the rest are
// scaled up, so scores stay comparable.
//   gaps         does the coach focus on, or have a track record in, the
//                athlete's biggest DNA gaps (bigger gaps count more)
//   level        teaches at the level the athlete's goal (or skill level) needs
//   nearby       same city
//   quality      rating (pulled towards 4/5 when there are few reviews) + verified
//                (coaches are verified automatically, see coachVerification.util.js)
//   availability an open slot in the next week (half credit for the week after)
//
// "Track record": between a coach's first and latest assessment of the same
// athlete, that skill went up by at least TRACK_RECORD_MIN on average.

const User = require('../models/user.model');
const Review = require('../models/review.model');
const Assessment = require('../models/assessment.model');
const Booking = require('../models/booking.model');
const { DIMENSIONS, DIMENSION_KEYS, GOALS, combineScores, gapsFor } = require('./dna.util');
const { takenSlotsByCoach, nextOpenSlot, dateInZone, addDays, weekdayOf, slotMinutes } = require('./slots.util');

const WEIGHTS = { gaps: 40, level: 20, nearby: 15, quality: 15, availability: 10 };
const LEVELS = ['beginner', 'intermediate', 'advanced'];
const TRACK_RECORD_MIN = 1; // average gain (points out of 10) that counts as a track record
const PRIOR_RATING = 4;   // a coach with few reviews starts near 4 stars
const PRIOR_WEIGHT = 2;
const LABEL = Object.fromEntries(DIMENSIONS.map((d) => [d.key, d.label]));

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const sameText = (a, b) => Boolean(a && b && a.trim().toLowerCase() === b.trim().toLowerCase());
const clamp01 = (n) => Math.max(0, Math.min(1, n));

// What the athlete most needs help with: their biggest gaps to the goal, or
// (no goal set) their lowest skills. Weights add up to 1.
const needsOf = (scores, goalKey) => {
  if (!scores) return [];
  const raw = goalKey
    ? gapsFor(scores, goalKey).filter((g) => g.gap > 0).slice(0, 3).map((g) => ({ key: g.key, size: g.gap, gap: g.gap }))
    : DIMENSION_KEYS.map((k) => ({ key: k, size: 10 - scores[k] })).sort((a, b) => b.size - a.size).slice(0, 2);
  const total = raw.reduce((n, x) => n + x.size, 0);
  return total > 0 ? raw.map((x) => ({ ...x, label: LABEL[x.key], weight: x.size / total })) : [];
};

// { coachId: { skillKey: average improvement } } from coaches' repeat assessments
const trackRecords = async (coachIds) => {
  const rows = await Assessment.find({ source: 'coach', assessor: { $in: coachIds } })
    .sort({ createdAt: 1 }).select('assessor athlete scores').lean();
  const pairs = {};
  for (const a of rows) (pairs[`${a.assessor}|${a.athlete}`] ||= []).push(a);

  const sums = {};
  for (const list of Object.values(pairs)) {
    if (list.length < 2) continue;
    const coach = String(list[0].assessor);
    const first = list[0].scores;
    const last = list[list.length - 1].scores;
    const s = (sums[coach] ||= { n: 0, ...Object.fromEntries(DIMENSION_KEYS.map((k) => [k, 0])) });
    s.n++;
    for (const k of DIMENSION_KEYS) s[k] += last[k] - first[k];
  }
  return Object.fromEntries(Object.entries(sums).map(([coach, s]) => [
    coach, Object.fromEntries(DIMENSION_KEYS.map((k) => [k, Math.round((s[k] / s.n) * 10) / 10])),
  ]));
};

// "today, 6 PM" / "tomorrow, 7 AM" / "Sat 31 Oct, 6 PM"
const whenLabel = ({ date, timeSlot }, today) => {
  const mins = slotMinutes(timeSlot);
  const time = mins ? `${(Math.floor(mins.start / 60) % 12) || 12}${mins.start % 60 ? `:${String(mins.start % 60).padStart(2, '0')}` : ''} ${mins.start >= 720 ? 'PM' : 'AM'}` : timeSlot;
  const day = date === today ? 'today' : date === addDays(today, 1) ? 'tomorrow'
    : `${weekdayOf(date).slice(0, 3)} ${Number(date.slice(8))} ${new Date(`${date}T00:00:00Z`).toLocaleString('en-GB', { month: 'short', timeZone: 'UTC' })}`;
  return `${day}, ${time}`;
};

// Ranks coaches for `athlete` (a User document or lean object).
// Options: coachId (score just this coach), limit.
// Returns { basis, coaches: [{ ...coach, rating, reviewCount, verified, takenSlots, match }] }
const matchCoachesFor = async (athlete, { coachId, limit } = {}) => {
  const assessments = await Assessment.find({ athlete: athlete._id }).lean();
  const combined = combineScores(assessments);
  const goal = GOALS[athlete.careerGoal] ? athlete.careerGoal : null;
  const needs = needsOf(combined?.scores, goal);

  const filter = { role: 'coach', _id: { $ne: athlete._id } };
  if (coachId) filter._id = coachId;
  else if (athlete.sport) filter.sport = { $regex: `^${escapeRegex(athlete.sport.trim())}$`, $options: 'i' };
  const coaches = await User.find(filter)
    .select('name profilePhoto sport location bio skillLevelTaught yearsExperience availability coachFocus coachVerified foundingMember')
    .lean();
  const ids = coaches.map((c) => c._id);

  const [ratings, taken, records, coachedBefore] = await Promise.all([
    Review.aggregate([
      { $match: { coach: { $in: ids } } },
      { $group: { _id: '$coach', avg: { $avg: '$rating' }, n: { $sum: 1 } } },
    ]),
    takenSlotsByCoach(ids),
    trackRecords(ids),
    Booking.find({ learner: athlete._id, coach: { $in: ids }, status: { $in: ['confirmed', 'completed'] } }).distinct('coach'),
  ]);
  const ratingById = Object.fromEntries(ratings.map((r) => [String(r._id), r]));
  const coachedIds = new Set(coachedBefore.map(String));

  const wantedLevels = goal ? GOALS[goal].coachLevels : athlete.skillLevel ? [athlete.skillLevel] : null;
  const today = dateInZone();
  const weekEnd = addDays(today, 6);

  const ranked = coaches.map((c) => {
    const id = String(c._id);
    const focus = c.coachFocus || [];
    const record = records[id] || {};
    const r = ratingById[id];
    const isVerified = Boolean(c.coachVerified);
    const next = nextOpenSlot(c.availability, taken[c._id] || [], 14);
    const parts = {};
    const reasons = [];

    // Gaps: full credit for each need the coach focuses on or has improved before.
    // One reason sums it up, so city, rating and slots still get a line.
    const hits = needs.filter((need) => focus.includes(need.key) || record[need.key] >= TRACK_RECORD_MIN);
    if (needs.length) {
      parts.gaps = hits.reduce((n, need) => n + need.weight, 0);
    }
    if (hits.length) {
      const top = hits[0].key === needs[0].key;
      const where = goal
        ? (top ? (hits.length > 1 ? 'your top gaps' : 'your biggest gap') : (hits.length > 1 ? 'two of your gaps' : 'one of your gaps'))
        : (top ? (hits.length > 1 ? 'your weakest skills' : 'your weakest skill') : (hits.length > 1 ? 'some of your weaker skills' : 'one of your weaker skills'));
      const proven = hits.find((need) => record[need.key] >= TRACK_RECORD_MIN);
      reasons.push({
        type: 'gap',
        text: proven && proven === hits[0]
          ? `${proven.label}, ${top ? (goal ? 'your biggest gap' : 'your weakest skill') : (goal ? 'one of your gaps' : 'one of your weaker skills')}: athletes improve +${record[proven.key]} with this coach`
          : `Focuses on ${hits.map((n) => n.label).join(' and ')}, ${where}`,
      });
    }

    // Level
    if (wantedLevels) {
      const taught = LEVELS.indexOf(c.skillLevelTaught);
      const distance = taught < 0 ? null : Math.min(...wantedLevels.map((l) => Math.abs(LEVELS.indexOf(l) - taught)));
      parts.level = distance === null ? 0.5 : distance === 0 ? 1 : distance === 1 ? 0.4 : 0;
      if (distance === 0) {
        reasons.push({ type: 'level', text: goal ? `Right level for your ${GOALS[goal].label.toLowerCase()} goal` : `Teaches ${c.skillLevelTaught} players like you` });
      }
    }

    // Nearby
    if (athlete.location) {
      parts.nearby = sameText(c.location, athlete.location) ? 1 : 0;
      if (parts.nearby) reasons.push({ type: 'nearby', text: `In ${c.location}` });
    }

    // Quality
    const bayes = ((r?.avg || 0) * (r?.n || 0) + PRIOR_RATING * PRIOR_WEIGHT) / ((r?.n || 0) + PRIOR_WEIGHT);
    parts.quality = clamp01((bayes - 3) / 2 + (isVerified ? 0.15 : 0));
    if (r?.n) reasons.push({ type: 'quality', text: `${Math.round(r.avg * 10) / 10}★ from ${r.n} ${r.n === 1 ? 'review' : 'reviews'}` });
    else if (isVerified) reasons.push({ type: 'quality', text: 'Verified coach' });

    // Availability
    parts.availability = !next ? 0 : next.date <= weekEnd ? 1 : 0.5;
    if (next) reasons.push({ type: 'availability', text: `Free ${whenLabel(next, today)}` });
    if (coachedIds.has(id)) reasons.push({ type: 'history', text: "You've trained together before" });

    const used = Object.keys(parts);
    const total = used.reduce((n, k) => n + WEIGHTS[k], 0);
    const score = Math.round((used.reduce((n, k) => n + parts[k] * WEIGHTS[k], 0) / total) * 100);

    return {
      ...c,
      rating: r ? Math.round(r.avg * 10) / 10 : null,
      reviewCount: r?.n || 0,
      verified: isVerified,
      takenSlots: taken[c._id] || [],
      match: {
        score,
        reasons: reasons.slice(0, 3),
        gapHits: needs.filter((n) => focus.includes(n.key) || record[n.key] >= TRACK_RECORD_MIN).map((n) => n.key),
        coachedBefore: coachedIds.has(id),
        nextSlot: next,
      },
    };
  }).sort((a, b) => b.match.score - a.match.score || (b.rating ?? 0) - (a.rating ?? 0) || a.name.localeCompare(b.name));

  return {
    basis: {
      hasDna: Boolean(combined),
      goal: goal && { key: goal, label: GOALS[goal].label },
      needs: needs.map(({ key, label, gap }) => ({ key, label, gap: gap ?? null })),
      sport: athlete.sport || null,
      location: athlete.location || null,
    },
    coaches: limit ? ranked.slice(0, limit) : ranked,
  };
};

module.exports = { matchCoachesFor, needsOf, WEIGHTS };
