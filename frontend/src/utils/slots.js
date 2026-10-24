// slots.js
// Helpers for coach availability. A coach lists weekly slots like
// { day: "Saturday", timeSlot: "5 PM - 6 PM" }; a booking is one of those
// slots on a real date ("2026-10-31"). The backend sends the held ones as
// `takenSlots` ({ date, day, timeSlot }; `date` is null for old weekly bookings).

export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const BOOKING_WINDOW_DAYS = 28; // keep in sync with Backend/utils/slots.util.js

// "sat", " Saturday " -> "Saturday"; unknown -> null
export const normalizeDay = (day = '') => {
    const key = String(day).trim().slice(0, 3).toLowerCase();
    return WEEKDAYS.find((d) => d.slice(0, 3).toLowerCase() === key) || null;
};

export const slotKey = (day, timeSlot) => `${normalizeDay(day)}|${String(timeSlot).trim().toLowerCase()}`;

// Local calendar date <-> "YYYY-MM-DD"
export const toISODate = (date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
export const fromISODate = (iso) => {
    const [y, m, d] = String(iso).split('-').map(Number);
    return new Date(y, m - 1, d);
};

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

// The next `count` days starting today:
// [{ dayName, iso, date, label: "Today" | "Tomorrow" | "Sat 31" }]
export const upcomingDays = (count = 7, now = new Date()) =>
    Array.from({ length: count }, (_, i) => {
        const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
        const dayName = WEEKDAYS[date.getDay()];
        return {
            dayName,
            iso: toISODate(date),
            date,
            label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : `${dayName.slice(0, 3)} ${date.getDate()}`,
        };
    });

// A coach's slots on one date, sorted by time, each marked taken / already past
export const slotsForDay = (availability = [], takenSlots = [], day, now = new Date()) => {
    const taken = new Set(takenSlots.map((s) => (s.date ? `${s.date}|${slotKey(s.day, s.timeSlot)}` : slotKey(s.day, s.timeSlot))));
    const isToday = day.iso === toISODate(now);
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    return availability
        .filter((s) => normalizeDay(s.day) === day.dayName)
        .map((s) => {
            const start = slotStartMinutes(s.timeSlot);
            const key = slotKey(s.day, s.timeSlot);
            return {
                timeSlot: s.timeSlot,
                label: slotStartLabel(s.timeSlot),
                start,
                taken: taken.has(`${day.iso}|${key}`) || taken.has(key),
                past: isToday && start !== null && start <= nowMinutes,
            };
        })
        .sort((a, b) => (a.start ?? 9999) - (b.start ?? 9999));
};

export const isOpenSlot = (s) => !s.taken && !s.past;

// First bookable slot in the next `days` days: { day, slot } or null
export const nextOpenSlot = (availability, takenSlots, days = 14, now = new Date()) => {
    for (const day of upcomingDays(days, now)) {
        const slot = slotsForDay(availability, takenSlots, day, now).find(isOpenSlot);
        if (slot) return { day, slot };
    }
    return null;
};
