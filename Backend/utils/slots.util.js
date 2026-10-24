// slots.util.js
// Helpers for coach availability and session dates.
// A coach lists weekly slots ({ day: "Saturday", timeSlot: "5 PM - 6 PM" }).
// A booking is one of those slots on a real calendar date ("2026-10-31").
// Dates are calendar dates in APP_TIMEZONE (default India), so "today" and
// "has this session started" mean the same thing for everyone.

const Booking = require('../models/booking.model');

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MAX_SLOTS = 50;
const MAX_SLOT_LENGTH = 40;
const APP_TIMEZONE = process.env.APP_TIMEZONE || 'Asia/Kolkata';
const BOOKING_WINDOW_DAYS = 28; // how far ahead sessions can be booked
const HOLDING_STATUSES = ['pending', 'confirmed'];

// "sat", " Saturday " -> "Saturday"; unknown -> null
const normalizeDay = (day) => {
  if (typeof day !== 'string') return null;
  const key = day.trim().slice(0, 3).toLowerCase();
  return WEEKDAYS.find((d) => d.slice(0, 3).toLowerCase() === key) || null;
};

const slotKey = (day, timeSlot) => `${normalizeDay(day)}|${String(timeSlot).trim().toLowerCase()}`;

// Validates and cleans an availability list from a request.
// Returns { value } or { error }.
const cleanAvailability = (input) => {
  if (!Array.isArray(input)) return { error: 'Availability must be a list' };
  if (input.length > MAX_SLOTS) return { error: `At most ${MAX_SLOTS} slots allowed` };

  const seen = new Set();
  const value = [];
  for (const slot of input) {
    const day = normalizeDay(slot?.day);
    const timeSlot = typeof slot?.timeSlot === 'string' ? slot.timeSlot.trim() : '';
    if (!day) return { error: `Invalid day: ${slot?.day}` };
    if (!timeSlot || timeSlot.length > MAX_SLOT_LENGTH) {
      return { error: `Each time slot needs a time (up to ${MAX_SLOT_LENGTH} characters)` };
    }
    const key = slotKey(day, timeSlot);
    if (!seen.has(key)) {
      seen.add(key);
      value.push({ day, timeSlot });
    }
  }
  return { value };
};

// ---------- Calendar dates ("YYYY-MM-DD") ----------

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const isValidDate = (iso) => {
  if (typeof iso !== 'string' || !DATE_RE.test(iso)) return false;
  const d = new Date(`${iso}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === iso;
};

// Today's date (or the date of `at`) in the app's time zone
const dateInZone = (at = new Date()) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: APP_TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(at);

const addDays = (iso, n) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

const weekdayOf = (iso) => WEEKDAYS[new Date(`${iso}T00:00:00Z`).getUTCDay()];

// First date on or after `from` that falls on `day`
const nextDateOnWeekday = (day, from = dateInZone()) => {
  for (let i = 0; i < 7; i++) {
    if (weekdayOf(addDays(from, i)) === normalizeDay(day)) return addDays(from, i);
  }
  return null;
};

// ---------- Slot times ("6 PM - 7 PM", "7:30am-9am") ----------

const TIME_RE = /(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/gi;

const toMinutes = (m) => (Number(m[1]) % 12 + (m[3].toUpperCase() === 'PM' ? 12 : 0)) * 60 + Number(m[2] || 0);

// { start, end } in minutes after midnight, or null if no time can be read.
// A slot without an end time is treated as one hour long.
const slotMinutes = (timeSlot = '') => {
  const times = [...String(timeSlot).matchAll(TIME_RE)].map(toMinutes);
  if (times.length === 0) return null;
  const start = times[0];
  let end = times[1] ?? start + 60;
  if (end <= start) end += 24 * 60; // "11 PM - 1 AM"
  return { start, end };
};

// UTC offset of the app's time zone at `at`, in minutes (+330 for India)
const zoneOffset = (at) => {
  const name = new Intl.DateTimeFormat('en-US', { timeZone: APP_TIMEZONE, timeZoneName: 'longOffset' })
    .formatToParts(at).find((p) => p.type === 'timeZoneName')?.value || '';
  const m = name.match(/GMT([+-])(\d{2}):(\d{2})/);
  return m ? (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3])) : 0;
};

const instant = (iso, minutes) => {
  const guess = Date.parse(`${iso}T00:00:00Z`) + minutes * 60000;
  return new Date(guess - zoneOffset(new Date(guess)) * 60000);
};

// When a slot starts and ends on a date: { startsAt, endsAt } (nulls if unreadable)
const sessionTimes = (iso, timeSlot) => {
  const mins = slotMinutes(timeSlot);
  if (!mins || !isValidDate(iso)) return { startsAt: null, endsAt: null };
  return { startsAt: instant(iso, mins.start), endsAt: instant(iso, mins.end) };
};

// Checks a requested date + slot against the coach's availability and the
// booking window. Returns { error } or { date, day, timeSlot, startsAt, endsAt }
// with the time slot spelled exactly as the coach listed it.
const resolveSlot = (coach, date, timeSlot, now = new Date()) => {
  if (!isValidDate(date)) return { error: 'Pick a valid date' };
  const slot = typeof timeSlot === 'string' ? timeSlot.trim() : '';
  if (!slot || slot.length > MAX_SLOT_LENGTH) return { error: 'Pick a time slot' };

  const today = dateInZone(now);
  if (date < today) return { error: 'That date has already passed' };
  if (date > addDays(today, BOOKING_WINDOW_DAYS)) {
    return { error: `Sessions can be booked up to ${BOOKING_WINDOW_DAYS / 7} weeks ahead` };
  }

  const day = weekdayOf(date);
  let canonical = slot;
  if (coach.availability?.length) {
    const match = coach.availability.find((s) => slotKey(s.day, s.timeSlot) === slotKey(day, slot));
    if (!match) return { error: `That time is not one of the coach's ${day} slots` };
    canonical = match.timeSlot;
  }

  const { startsAt, endsAt } = sessionTimes(date, canonical);
  if (startsAt && startsAt <= now) return { error: 'That time has already passed today' };
  return { date, day, timeSlot: canonical, startsAt, endsAt };
};

// ---------- Which slots are held ----------

// Bookings (and suggested new times) that hold a coach's slot. Bookings from
// before dates existed hold their weekday + time every week.
const holdingQuery = (coachIds, today) => ({
  coach: { $in: coachIds },
  status: { $in: HOLDING_STATUSES },
  $or: [
    { date: { $gte: today } },
    { 'reschedule.date': { $gte: today } },
    { date: { $in: [null, ''] } },
  ],
});

// { coachId: [{ date, day, timeSlot }] } for held slots from today on.
// `date` is null for old weekly bookings. Never says who booked them.
const takenSlotsByCoach = async (coachIds, now = new Date()) => {
  const today = dateInZone(now);
  const bookings = await Booking.find(holdingQuery(coachIds, today)).select('coach date day timeSlot reschedule');

  const map = {};
  for (const b of bookings) {
    const list = (map[b.coach] ||= []);
    if (!b.date) list.push({ date: null, day: normalizeDay(b.day) || b.day, timeSlot: b.timeSlot });
    else if (b.date >= today) list.push({ date: b.date, day: weekdayOf(b.date), timeSlot: b.timeSlot });
    if (b.reschedule?.date >= today) {
      list.push({ date: b.reschedule.date, day: weekdayOf(b.reschedule.date), timeSlot: b.reschedule.timeSlot });
    }
  }
  return map;
};

// Is this coach's slot on this date held by another booking (or a suggested
// new time)? `excludeId` skips the booking being moved.
const isSlotTaken = async (coachId, { date, day, timeSlot }, excludeId = null) => {
  const sameSlot = new RegExp(`^${timeSlot.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
  return Boolean(await Booking.exists({
    coach: coachId,
    status: { $in: HOLDING_STATUSES },
    ...(excludeId && { _id: { $ne: excludeId } }),
    $or: [
      { date, timeSlot: sameSlot },
      { 'reschedule.date': date, 'reschedule.timeSlot': sameSlot },
      { date: { $in: [null, ''] }, day, timeSlot: sameSlot },
    ],
  }));
};

// A coach's first bookable slot in the next `days` days: { date, timeSlot } or null.
// `taken` is that coach's list from takenSlotsByCoach.
const nextOpenSlot = (availability = [], taken = [], days = 14, now = new Date()) => {
  const held = new Set(taken.map((s) => `${s.date || ''}|${slotKey(s.day, s.timeSlot)}`));
  const today = dateInZone(now);
  for (let i = 0; i < days; i++) {
    const date = addDays(today, i);
    const day = weekdayOf(date);
    const open = availability
      .filter((s) => normalizeDay(s.day) === day)
      .map((s) => ({ timeSlot: s.timeSlot, ...sessionTimes(date, s.timeSlot) }))
      .filter((s) => !held.has(`${date}|${slotKey(day, s.timeSlot)}`) && !held.has(`|${slotKey(day, s.timeSlot)}`))
      .filter((s) => !s.startsAt || s.startsAt > now)
      .sort((a, b) => (a.startsAt || 0) - (b.startsAt || 0));
    if (open.length) return { date, timeSlot: open[0].timeSlot };
  }
  return null;
};

module.exports = {
  WEEKDAYS, APP_TIMEZONE, BOOKING_WINDOW_DAYS, HOLDING_STATUSES,
  normalizeDay, slotKey, cleanAvailability,
  isValidDate, dateInZone, addDays, weekdayOf, nextDateOnWeekday,
  slotMinutes, sessionTimes, resolveSlot,
  takenSlotsByCoach, isSlotTaken, nextOpenSlot,
};
