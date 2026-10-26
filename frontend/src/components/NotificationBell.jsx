// NotificationBell.jsx
// Bell button with a red dot for unread notifications.
// There's no notification service on the backend, so notifications are built
// from data the app already has:
//   - coaches: pending session requests they still need to answer
//   - learners: sessions a coach has confirmed or declined, and finished ones to rate
//   - both: a new time suggested by the other person, or a cancellation
//   - everyone: new followers, and (private accounts) follow requests to
//     accept or decline right in the dropdown
// "Unread" = newer than the last time this user opened the bell. That time is
// remembered per user in localStorage, so opening the bell clears the dot.

import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Bell, X } from 'lucide-react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import useMyBookings from '../hooks/useMyBookings';
import useDismiss from '../hooks/useDismiss';
import useFollowRequests from '../hooks/useFollowRequests';
import Avatar from './Avatar';
import { timeAgo } from '../utils/format';
import { fmtSession, hasStarted } from '../utils/sessions';

const readSeenAt = (key) => {
    try {
        return Number(localStorage.getItem(key)) || 0;
    } catch {
        return 0;
    }
};

// Portfolio verification: requests waiting for me (coaches / admins), and
// reviews of my own achievements
const buildVerificationItems = (requests, reviewed, role) => [
    ...requests.map((a) => ({
        id: `verify-${a._id}`,
        to: role === 'admin' ? '/admin' : '/my-athletes',
        text: `${a.owner?.name || 'Someone'} asked you to verify an achievement`,
        detail: a.title,
        time: new Date(a.requestedAt).getTime(),
    })),
    ...reviewed.map((a) => ({
        id: `reviewed-${a._id}`,
        to: '/profile?tab=portfolio',
        text: a.status === 'verified'
            ? `${a.verifiedBy?.name || 'ArenaX team'} verified your achievement`
            : 'An achievement verification was declined',
        detail: a.title,
        time: new Date(a.reviewedAt).getTime(),
    })),
];

// Session updates that need my attention or tell me what changed
const bookingNotifications = (bookings, role, myId) => bookings.flatMap((b) => {
    const isCoach = role === 'coach';
    const other = (isCoach ? b.learner?.name : b.coach?.name) || (isCoach ? 'A learner' : 'Your coach');
    const item = (suffix, text, at, detail = fmtSession(b)) => ({ id: `${b._id}-${suffix}`, to: '/calendar', text, detail, time: new Date(at).getTime() });
    const items = [];

    if (isCoach && b.status === 'pending' && !hasStarted(b)) items.push(item('req', `${other} requested a session`, b.createdAt));
    if (!isCoach && (b.status === 'confirmed' || b.status === 'declined') && !b.reschedule) {
        items.push(item(b.status, `${other} ${b.status} your session`, b.updatedAt));
    }
    if (!isCoach && b.status === 'completed' && !b.reviewed) items.push(item('rate', `How was your session with ${other}? Rate it`, b.completedAt || b.updatedAt));
    if (b.reschedule && String(b.reschedule.by) !== String(myId)) {
        items.push(item('move', `${other} suggested a new time`, b.reschedule.at, fmtSession(b.reschedule)));
    }
    if (b.status === 'cancelled' && b.cancelledBy && String(b.cancelledBy) !== String(myId)) {
        items.push(item('cancel', `${other} cancelled your session`, b.updatedAt));
    }
    return items;
});

// Turn bookings and new followers into notification items, newest first
const buildNotifications = (bookings, followers, role, myId, verificationItems = []) => {
    const bookingItems = bookingNotifications(bookings, role, myId);
    const followerItems = followers.map((f) => ({
        id: `follow-${f.user._id}`,
        to: `/profile-view/${f.user._id}`,
        text: `${f.user.name} started following you`,
        detail: [f.user.role, f.user.sport].filter(Boolean).join(' · '),
        time: new Date(f.followedAt).getTime(),
    }));
    return [...bookingItems, ...followerItems, ...verificationItems].sort((a, b) => b.time - a.time).slice(0, 8);
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

    // Achievement verification requests (coaches / admins) and reviews of mine
    const [verifyRequests, setVerifyRequests] = useState([]);
    const [reviewed, setReviewed] = useState([]);
    useEffect(() => {
        let cancelled = false;
        if (user.role === 'coach' || user.role === 'admin') {
            API.get('/achievements/requests/pending')
                .then((res) => !cancelled && setVerifyRequests(res.data))
                .catch(() => {});
        }
        if (user.role !== 'admin') {
            API.get(`/achievements/${user._id}`)
                .then((res) => !cancelled && setReviewed(res.data.filter((a) => a.reviewedAt && a.status !== 'pending')))
                .catch(() => {});
        }
        return () => { cancelled = true; };
    }, [user._id, user.role]);

    // Follow requests waiting for me (private accounts), shown first with Accept / Decline
    const { requests, busyId, accept, decline, reload: reloadRequests } = useFollowRequests();

    const notifications = buildNotifications(bookings, followers, user.role, user._id, buildVerificationItems(verifyRequests, reviewed, user.role));
    const hasUnread = notifications.some((n) => n.time > seenAt)
        || requests.some((r) => new Date(r.requestedAt).getTime() > seenAt);

    const toggle = () => {
        if (!open) {
            const now = Date.now();
            setHighlightBefore(seenAt);
            setSeenAt(now);
            reloadRequests(); // pick up requests that arrived since the page loaded
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
                className="relative flex h-11 w-11 items-center justify-center rounded-full nav-glass text-ink transition-shadow hover:shadow-sm"
            >
                <Bell size={18} strokeWidth={1.8} />
                {hasUnread && (
                    <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-like ring-2 ring-surface" />
                )}
            </button>

            {open && (
                // Phones: pinned to the screen with a 16px margin each side (the bell isn't at
                // the right edge, so hanging off it would push the panel off-screen) and
                // scrolls inside if long. From sm up: hangs under the bell as before.
                <div className="fixed inset-x-4 top-20 z-50 max-h-[calc(100dvh-10rem)] overflow-y-auto overscroll-contain rounded-3xl border border-line bg-popover shadow-[0_20px_50px_rgba(0,0,0,0.12)] sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-3 sm:max-h-[min(40rem,calc(100dvh-7rem))] sm:w-80">
                    <p className="border-b border-line px-5 py-3.5 text-sm font-bold">
                        Notifications
                    </p>

                    {/* ---------- Follow requests ---------- */}
                    {requests.length > 0 && (
                        <div className="border-b border-line p-2">
                            <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wider text-muted">
                                Follow requests · {requests.length}
                            </p>
                            <ul className="max-h-56 overflow-y-auto">
                                {requests.map(({ user: requester, requestedAt }) => (
                                    <li key={requester._id} className="flex items-center gap-3 rounded-2xl px-3 py-2.5 hover:bg-canvas">
                                        <Link to={`/profile-view/${requester._id}`} onClick={close} className="flex min-w-0 flex-1 items-center gap-3">
                                            <Avatar name={requester.name} photo={requester.profilePhoto} pastel className="h-9 w-9 text-xs" />
                                            <span className="min-w-0">
                                                <span className="block truncate text-sm font-medium">{requester.name}</span>
                                                <span className="block truncate text-xs text-muted">wants to follow you · {timeAgo(requestedAt)}</span>
                                            </span>
                                        </Link>
                                        <button
                                            onClick={() => decline(requester._id)}
                                            disabled={busyId === requester._id}
                                            aria-label={`Decline ${requester.name}`}
                                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted hover:bg-white/10 hover:text-ink"
                                        >
                                            <X size={15} />
                                        </button>
                                        <button
                                            onClick={() => accept(requester._id)}
                                            disabled={busyId === requester._id}
                                            aria-label={`Accept ${requester.name}`}
                                            className="btn btn-dark shrink-0 px-3 py-1.5 text-xs"
                                        >
                                            Accept
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {notifications.length === 0 && requests.length === 0 ? (
                        <p className="px-5 py-8 text-center text-sm text-muted">You're all caught up.</p>
                    ) : notifications.length === 0 ? null : (
                        <ul className="max-h-80 overflow-y-auto p-2">
                            {notifications.map((n) => (
                                <li key={n.id}>
                                    <Link
                                        to={n.to}
                                        onClick={close}
                                        className="flex gap-3 rounded-2xl px-3 py-3 transition-colors hover:bg-canvas"
                                    >
                                        <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.time > highlightBefore ? 'bg-likent ring-1 ring-ink/20' : 'bg-transparent'}`} />
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
