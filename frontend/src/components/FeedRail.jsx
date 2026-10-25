// FeedRail.jsx
// Right column of the Feed:
//   0. Follow requests (private accounts): accept / decline
//   1. Session requests (coaches): pending bookings with Accept / Decline
//   2. Upcoming: confirmed and pending sessions with date tiles
//   3. Coaches to follow: most-followed coaches you don't follow yet

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';
import { X } from 'lucide-react';
import Avatar from './Avatar';
import useFollowRequests from '../hooks/useFollowRequests';
import { fromISODate } from '../utils/slots';
import { fmtSession, upcomingSessions, hasStarted } from '../utils/sessions';
import { compact } from '../utils/format';
import { toastError } from '../utils/dialogs';

const STATUS_BADGE = {
    pending: 'bg-accent/15 text-accent',
    confirmed: 'bg-data-mint/15 text-data-mint',
};

const SessionRequests = ({ bookings, onChanged }) => {
    const pending = bookings.filter((b) => b.status === 'pending' && !hasStarted(b));
    const [busyId, setBusyId] = useState(null);
    if (pending.length === 0) return null;

    const respond = async (id, status) => {
        setBusyId(id);
        try {
            await API.put(`/bookings/${id}`, { status });
            onChanged();
        } catch (err) {
            toastError(err);
        }
        setBusyId(null);
    };

    return (
        <section className="card">
            <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight">
                    Session requests <span className="badge bg-white px-2 py-0.5 text-on-ink">{pending.length}</span>
                </h2>
                <Link to="/calendar" className="text-sm text-muted hover:text-ink">See all</Link>
            </div>
            <ul className="space-y-5">
                {pending.slice(0, 2).map((b) => (
                    <li key={b._id}>
                        <Link to={`/profile-view/${b.learner?._id}`} className="flex items-center gap-3">
                            <Avatar name={b.learner?.name} photo={b.learner?.profilePhoto} pastel className="h-12 w-12 text-sm" />
                            <div className="min-w-0">
                                <p className="truncate font-semibold">{b.learner?.name || 'Learner'}</p>
                                <p className="truncate text-sm text-muted">{fmtSession(b)}</p>
                            </div>
                        </Link>
                        <div className="mt-3 grid grid-cols-2 gap-2">
                            <button disabled={busyId === b._id} onClick={() => respond(b._id, 'declined')} className="btn btn-soft">Decline</button>
                            <button disabled={busyId === b._id} onClick={() => respond(b._id, 'confirmed')} className="btn btn-dark">Accept</button>
                        </div>
                    </li>
                ))}
            </ul>
        </section>
    );
};

const Upcoming = ({ bookings, role }) => {
    const items = upcomingSessions(bookings).slice(0, 3);

    return (
        <section className="card">
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold tracking-tight">Upcoming</h2>
                <Link to="/calendar" className="text-sm text-muted hover:text-ink">See all</Link>
            </div>
            {items.length === 0 ? (
                <p className="text-sm text-muted">No upcoming sessions.</p>
            ) : (
                <ul className="space-y-3">
                    {items.map((b, i) => {
                        const other = role === 'coach' ? b.learner : b.coach;
                        const date = b.date && fromISODate(b.date);
                        return (
                            <li key={b._id}>
                                <Link to="/calendar" className="flex items-center gap-3">
                                    <div className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl ${i === 0 ? 'bg-ink text-on-ink' : 'bg-canvas'}`}>
                                        <span className="text-xl font-extrabold leading-none">{date ? date.getDate() : '—'}</span>
                                        <span className={`mt-0.5 text-[10px] font-bold uppercase ${i === 0 ? 'text-on-ink/60' : 'text-muted'}`}>{b.day?.slice(0, 3)}</span>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate font-semibold">{other?.name || 'Session'}</p>
                                        <p className="truncate text-sm text-muted">{b.timeSlot}</p>
                                    </div>
                                    <span className={`badge shrink-0 capitalize ${STATUS_BADGE[b.status]}`}>{b.status}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            )}
        </section>
    );
};

// Follow requests (private accounts): accept or decline right here
const FollowRequests = () => {
    const { requests, busyId, accept, decline } = useFollowRequests();
    if (requests.length === 0) return null;

    return (
        <section className="card">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold tracking-tight">
                Follow requests <span className="badge bg-white px-2 py-0.5 text-on-ink">{requests.length}</span>
            </h2>
            <ul className="space-y-4">
                {requests.slice(0, 3).map(({ user }) => (
                    <li key={user._id} className="flex items-center gap-3">
                        <Link to={`/profile-view/${user._id}`} className="flex min-w-0 flex-1 items-center gap-3">
                            <Avatar name={user.name} photo={user.profilePhoto} pastel className="h-11 w-11 text-sm" />
                            <div className="min-w-0">
                                <p className="truncate font-semibold">{user.name}</p>
                                <p className="truncate text-sm capitalize text-muted">
                                    {[user.role === 'learner' ? 'athlete' : user.role, user.sport].filter(Boolean).join(' · ')}
                                </p>
                            </div>
                        </Link>
                        <div className="flex shrink-0 gap-1.5">
                            <button
                                onClick={() => decline(user._id)}
                                disabled={busyId === user._id}
                                aria-label={`Decline ${user.name}`}
                                className="flex h-9 w-9 items-center justify-center rounded-full bg-canvas text-muted hover:text-ink"
                            >
                                <X size={16} />
                            </button>
                            <button
                                onClick={() => accept(user._id)}
                                disabled={busyId === user._id}
                                aria-label={`Accept ${user.name}`}
                                className="btn btn-dark px-4 py-2"
                            >
                                Accept
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
            {requests.length > 3 && <p className="mt-3 text-sm text-muted">+{requests.length - 3} more in your notifications</p>}
        </section>
    );
};

const FOLLOW_LABEL = { following: 'Following', requested: 'Requested', none: 'Follow' };

const CoachesToFollow = ({ followState, onToggleFollow }) => {
    const [coaches, setCoaches] = useState(null);

    // Fetched once; followed coaches stay in the list showing "Following"/"Requested"
    useEffect(() => {
        API.get('/follows/suggestions', { params: { limit: 3 } })
            .then((res) => setCoaches(res.data))
            .catch(() => setCoaches([]));
    }, []);

    if (!coaches?.length) return null;

    return (
        <section className="card">
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold tracking-tight">Coaches to follow</h2>
                <Link to="/discover" className="text-sm text-muted hover:text-ink">More</Link>
            </div>
            <ul className="space-y-4">
                {coaches.map((c) => {
                    const state = followState(c._id);
                    // Count includes me once I've followed from here (a request doesn't count)
                    const count = c.followerCount + (state === 'following' ? 1 : 0);
                    return (
                        <li key={c._id} className="flex items-center gap-3">
                            <Link to={`/profile-view/${c._id}`} className="flex min-w-0 flex-1 items-center gap-3">
                                <Avatar name={c.name} photo={c.profilePhoto} pastel className="h-12 w-12 text-sm" />
                                <div className="min-w-0">
                                    <p className="truncate font-semibold">{c.name}</p>
                                    <p className="truncate text-sm text-muted">
                                        {[c.sport, `${compact(count)} ${count === 1 ? 'follower' : 'followers'}`].filter(Boolean).join(' · ')}
                                    </p>
                                </div>
                            </Link>
                            <button
                                onClick={() => onToggleFollow(c._id)}
                                aria-label={{ following: `Unfollow ${c.name}`, requested: `Cancel follow request to ${c.name}` }[state] || `Follow ${c.name}`}
                                className={`btn shrink-0 border px-4 py-2 ${state === 'none' ? 'border-line hover:border-ink' : 'border-transparent bg-canvas'}`}
                            >
                                {FOLLOW_LABEL[state]}
                            </button>
                        </li>
                    );
                })}
            </ul>
        </section>
    );
};

const FeedRail = ({ profile, bookings, reloadBookings, followState, onToggleFollow }) => (
    <aside className="space-y-5">
        <FollowRequests />
        {profile.role === 'coach' && <SessionRequests bookings={bookings} onChanged={reloadBookings} />}
        <Upcoming bookings={bookings} role={profile.role} />
        <CoachesToFollow followState={followState} onToggleFollow={onToggleFollow} />
    </aside>
);

export default FeedRail;
