// sessions.js
// Helpers for booked sessions (bookings with a date, time slot and status).

import { fromISODate, slotStartMinutes } from './slots';

export const STATUS = {
    pending: { label: 'Requested', className: 'bg-warn/15 text-warn' },
    confirmed: { label: 'Confirmed', className: 'bg-ok/15 text-ok' },
    completed: { label: 'Completed', className: 'bg-ok/15 text-ok' },
    declined: { label: 'Declined', className: 'bg-danger/15 text-danger' },
    cancelled: { label: 'Cancelled', className: 'bg-danger/15 text-danger' },
};

// "Mon, 27 Oct" (or another format) for a "YYYY-MM-DD" date
export const fmtDate = (iso, opts = { weekday: 'short', day: 'numeric', month: 'short' }) =>
    iso ? fromISODate(iso).toLocaleDateString(undefined, opts) : '';

// "Mon, 27 Oct · 6 PM - 7 PM"; old bookings without a date show their weekday
export const fmtSession = (s) => `${s.date ? fmtDate(s.date) : `Every ${s.day}`} · ${s.timeSlot}`;

const startTime = (b) => (b.startsAt
    ? new Date(b.startsAt).getTime()
    : b.date ? fromISODate(b.date).getTime() + (slotStartMinutes(b.timeSlot) ?? 0) * 60000 : Infinity);

export const hasStarted = (b, now = Date.now()) => startTime(b) <= now;

// Pending or confirmed and not started yet
export const isUpcoming = (b, now = Date.now()) => ['pending', 'confirmed'].includes(b.status) && !hasStarted(b, now);

// Soonest first
export const byStart = (a, b) => startTime(a) - startTime(b);

export const upcomingSessions = (bookings, now = Date.now()) => bookings.filter((b) => isUpcoming(b, now)).sort(byStart);

// "Add to Google Calendar" link for a session with start/end times
export const googleCalendarUrl = (b, title) => {
    if (!b.startsAt || !b.endsAt) return null;
    const stamp = (d) => new Date(d).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: title,
        dates: `${stamp(b.startsAt)}/${stamp(b.endsAt)}`,
        details: 'Booked on ArenaX',
    });
    return `https://calendar.google.com/calendar/render?${params}`;
};
