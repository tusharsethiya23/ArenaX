// NotificationBell.jsx
// Bell button with a red dot for unread notifications.
// There's no notification service on the backend, so notifications are built
// from data the app already has:
//   - coaches: pending booking requests they still need to answer
//   - learners: bookings a coach has confirmed or declined
//   - everyone: new followers
// "Unread" = newer than the last time this user opened the bell. That time is
// remembered per user in localStorage, so opening the bell clears the dot.

import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import API from '../api/axios';
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

// Turn bookings and new followers into notification items, newest first
const buildNotifications = (bookings, followers, role) => {
    const bookingItems = role === 'coach'
        ? bookings
            .filter((b) => b.status === 'pending')
            .map((b) => ({
                id: b._id,
                to: '/bookings',
                text: `${b.learner?.name || 'A learner'} requested a session`,
                detail: `${b.day} · ${b.timeSlot}`,
                time: new Date(b.createdAt).getTime(),
            }))
        : bookings
            .filter((b) => b.status === 'confirmed' || b.status === 'declined')
            .map((b) => ({
                id: b._id,
                to: '/bookings',
                text: `${b.coach?.name || 'Your coach'} ${b.status} your session`,
                detail: `${b.day} · ${b.timeSlot}`,
                time: new Date(b.updatedAt).getTime(),
            }));
    const followerItems = followers.map((f) => ({
        id: `follow-${f.user._id}`,
        to: `/profile-view/${f.user._id}`,
        text: `${f.user.name} started following you`,
        detail: [f.user.role, f.user.sport].filter(Boolean).join(' · '),
        time: new Date(f.followedAt).getTime(),
    }));
    return [...bookingItems, ...followerItems].sort((a, b) => b.time - a.time).slice(0, 8);
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

    // People who follow me (newest first), for "started following you"
    const [followers, setFollowers] = useState([]);
    useEffect(() => {
        let cancelled = false;
        API.get(`/follows/${user._id}/followers`)
            .then((res) => !cancelled && setFollowers(res.data))
            .catch(() => { /* bell just shows booking notifications */ });
        return () => { cancelled = true; };
    }, [user._id]);

    const notifications = buildNotifications(bookings, followers, user.role);
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
                className="relative flex h-11 w-11 items-center justify-center rounded-full bg-surface text-ink transition-shadow hover:shadow-sm"
            >
                <Bell size={18} strokeWidth={1.8} />
                {hasUnread && (
                    <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-danger ring-2 ring-surface" />
                )}
            </button>

            {open && (
                <div className="absolute right-0 top-full z-50 mt-3 w-[min(320px,calc(100vw-2rem))] overflow-hidden rounded-3xl border border-line bg-surface shadow-[0_20px_50px_rgba(0,0,0,0.12)]">
                    <p className="border-b border-line px-5 py-3.5 text-sm font-bold">
                        Notifications
                    </p>

                    {notifications.length === 0 ? (
                        <p className="px-5 py-8 text-center text-sm text-muted">You're all caught up.</p>
                    ) : (
                        <ul className="max-h-80 overflow-y-auto p-2">
                            {notifications.map((n) => (
                                <li key={n.id}>
                                    <Link
                                        to={n.to}
                                        onClick={close}
                                        className="flex gap-3 rounded-2xl px-3 py-3 transition-colors hover:bg-canvas"
                                    >
                                        <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.time > highlightBefore ? 'bg-lime ring-1 ring-ink/20' : 'bg-transparent'}`} />
                                        <span className="min-w-0">
                                            <span className="block text-sm font-medium">{n.text}</span>
                                            <span className="block text-xs text-muted">{n.detail}</span>
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
