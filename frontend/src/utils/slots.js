// slots.js
// Helpers for coach availability. A coach lists weekly slots like
// { day: "Saturday", timeSlot: "5 PM - 6 PM" }. Bookings use the same
// weekday + time slot, so a slot is "taken" while a pending or confirmed
// booking holds it (the backend sends those as `takenSlots`).

export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// "sat", " Saturday " -> "Saturday"; unknown -> null
export const normalizeDay = (day = '') => {
    const key = String(day).trim().slice(0, 3).toLowerCase();
    return WEEKDAYS.find((d) => d.slice(0, 3).toLowerCase() === key) || null;
};

export const slotKey = (day, timeSlot) => `${normalizeDay(day)}|${String(timeSlot).trim().toLowerCase()}`;

const TIME_RE = /(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/i;

// Minutes after midnight of a slot's start ("5:30 PM - 6:30 PM" -> 1050), or null
export const slotStartMinutes = (timeSlot = '') => {
    const m = String(timeSlot).match(TIME_RE);
    if (!m) return null;
    let hours = Number(m[1]) % 12;
    if (m[3].toUpperCase() === 'PM') hours += 12;
    return hours * 60 + Number(m[2] || 0);
};

// Short label for a slot button: "5 PM - 6 PM" -> "5 PM", "7:30am" -> "7:30 AM"
export const slotStartLabel = (timeSlot = '') => {
    const m = String(timeSlot).match(TIME_RE);
    return m ? `${m[1]}${m[2] ? `:${m[2]}` : ''} ${m[3].toUpperCase()}` : timeSlot;
};

// The next `count` days starting today: [{ dayName, label: "Today"|"Tomorrow"|"Sat", date }]
export const upcomingDays = (count = 7, now = new Date()) =>
    Array.from({ length: count }, (_, i) => {
        const date = new Date(now);
        date.setDate(now.getDate() + i);
        const dayName = WEEKDAYS[date.getDay()];
        return { dayName, date, label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : dayName.slice(0, 3) };
    });

// A coach's slots on one weekday, sorted by time, each marked taken / already past
export const slotsForDay = (availability = [], takenSlots = [], day, now = new Date()) => {
    const taken = new Set(takenSlots.map((s) => slotKey(s.day, s.timeSlot)));
    const isToday = day.date.toDateString() === now.toDateString();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    return availability
        .filter((s) => normalizeDay(s.day) === day.dayName)
        .map((s) => {
            const start = slotStartMinutes(s.timeSlot);
            return {
                timeSlot: s.timeSlot,
                label: slotStartLabel(s.timeSlot),
                start,
                taken: taken.has(slotKey(s.day, s.timeSlot)),
                past: isToday && start !== null && start <= nowMinutes,
            };
        })
        .sort((a, b) => (a.start ?? 9999) - (b.start ?? 9999));
};

// First bookable slot in the next 7 days: { day, slot } or null
export const nextOpenSlot = (availability, takenSlots, now = new Date()) => {
    for (const day of upcomingDays(7, now)) {
        const slot = slotsForDay(availability, takenSlots, day, now).find((s) => !s.taken && !s.past);
        if (slot) return { day, slot };
    }
    return null;
};

// The next calendar date that falls on `dayName` (today counts)
export const nextDateFor = (dayName, now = new Date()) =>
    upcomingDays(7, now).find((d) => d.dayName === normalizeDay(dayName))?.date || null;
