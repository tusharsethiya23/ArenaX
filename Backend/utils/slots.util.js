// slots.util.js
// Helpers for coach availability. Bookings store a weekday ("Saturday") and a
// time slot ("5 PM - 6 PM"), not a calendar date, so a slot counts as taken
// while a pending or confirmed booking holds that weekday + time slot.

const Booking = require('../models/booking.model');

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MAX_SLOTS = 50;
const MAX_SLOT_LENGTH = 40;

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

// { coachId: [{ day, timeSlot }] } for slots held by pending/confirmed bookings.
// Only day + time are returned, never who booked them.
const takenSlotsByCoach = async (coachIds) => {
  const bookings = await Booking.find({
    coach: { $in: coachIds },
    status: { $in: ['pending', 'confirmed'] },
  }).select('coach day timeSlot');

  const map = {};
  for (const b of bookings) {
    (map[b.coach] ||= []).push({ day: normalizeDay(b.day) || b.day, timeSlot: b.timeSlot });
  }
  return map;
};

module.exports = { WEEKDAYS, normalizeDay, slotKey, cleanAvailability, takenSlotsByCoach };
