// NotificationBell.jsx
// Bell button with a red dot for unread notifications.
// There's no notification service on the backend, so notifications are built
// from bookings the app already has:
//   - coaches: pending booking requests they still need to answer
//   - learners: bookings a coach has confirmed or declined
// "Unread" = newer than the last time this user opened the bell. That time is
// remembered per user in localStorage, so opening the bell clears the dot.

import { useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import useMyBookings from '../hooks/useMyBookings';
import useDismiss from '../hooks/useDismiss';

const readSeenAt = (key) => {
    try {
        return Number(localStorage.getItem(key)) || 0;
    } catch {
        return 0;
    }
};

// Turn bookings into notification items, newest first
const buildNotifications = (bookings, role) => {
    const items = role === 'coach'
        ? bookings
            .filter((b) => b.status === 'pending')
            .map((b) => ({
                id: b._id,
                text: `${b.learner?.name || 'A learner'} requested a session`,
                detail: `${b.day} · ${b.timeSlot}`,
                time: new Date(b.createdAt).getTime(),
            }))
        : bookings
            .filter((b) => b.status === 'confirmed' || b.status === 'declined')
            .map((b) => ({
                id: b._id,
                text: `${b.coach?.name || 'Your coach'} ${b.status} your session`,
                detail: `${b.day} · ${b.timeSlot}`,
                time: new Date(b.updatedAt).getTime(),
            }));
    return items.sort((a, b) => b.time - a.time).slice(0, 6);
};

const NotificationBell = () => {
    const { user } = useAuth();
    const { bookings } = useMyBookings();
    const storageKey = `arenax:notifSeenAt:${user._id}`;

    const [open, setOpen] = useState(false);
    const [seenAt, setSeenAt] = useState(() => readSeenAt(storageKey));
    // Snapshot of seenAt from before the bell was opened, so items stay
    // highlighted as "new" while the dropdown is showing them
    const [highlightBefore, setHighlightBefore] = useState(0);
    const wrapperRef = useRef(null);

    const close = useCallback(() => setOpen(false), []);
    useDismiss(wrapperRef, open, close);

    const notifications = buildNotifications(bookings, user.role);
    const hasUnread = notifications.some((n) => n.time > seenAt);

    const toggle = () => {
        if (!open) {
            const now = Date.now();
            setHighlightBefore(seenAt);
            setSeenAt(now);
            try { localStorage.setItem(storageKey, String(now)); } catch { /* storage unavailable: dot just won't persist */ }
        }
        setOpen(!open);
    };

    return (
        <div ref={wrapperRef} className="relative">
            <button
                onClick={toggle}
                aria-label={hasUnread ? 'Notifications (unread)' : 'Notifications'}
                aria-expanded={open}
                className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/70 transition-colors hover:border-white/25 hover:text-white"
            >
                <Bell size={17} strokeWidth={1.8} />
                {hasUnread && (
                    <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#E11D1D] ring-2 ring-[#07090F]" />
                )}
            </button>

            {open && (
                <div className="absolute right-0 top-full z-50 mt-3 w-[min(320px,calc(100vw-2rem))] overflow-hidden rounded-xl border border-white/10 bg-[#0D1220] shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                    <p className="border-b border-white/10 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-white/50">
                        Notifications
                    </p>

                    {notifications.length === 0 ? (
                        <p className="px-4 py-6 text-center text-sm text-white/40">You're all caught up.</p>
                    ) : (
                        <ul className="max-h-80 overflow-y-auto py-1">
                            {notifications.map((n) => (
                                <li key={n.id}>
                                    <Link
                                        to="/bookings"
                                        onClick={close}
                                        className="flex gap-3 px-4 py-3 transition-colors hover:bg-white/[0.04]"
                                    >
                                        <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${n.time > highlightBefore ? 'bg-[#E11D1D]' : 'bg-transparent'}`} />
                                        <span className="min-w-0">
                                            <span className="block text-sm text-white/90">{n.text}</span>
                                            <span className="block text-xs text-white/40">{n.detail}</span>
                                        </span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
