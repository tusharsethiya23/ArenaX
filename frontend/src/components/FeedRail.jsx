// FeedRail.jsx
// Right column of the Feed:
//   1. Session requests (coaches): pending bookings with Accept / Decline
//   2. Upcoming: confirmed and pending sessions with date tiles
//   3. Coaches to follow: most-followed coaches you don't follow yet
// Bookings store a weekday, so dates shown are the next date on that weekday.

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';
import Avatar from './Avatar';
import { nextDateFor } from '../utils/slots';
import { compact } from '../utils/format';

const fmtDay = (day) => {
    const date = nextDateFor(day);
    return date ? date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' }) : day;
};

const STATUS_BADGE = {
    pending: 'bg-[#FBF0D2] text-[#8A5B00]',
    confirmed: 'bg-lime text-ink',
};

const SessionRequests = ({ bookings, onChanged }) => {
    const pending = bookings.filter((b) => b.status === 'pending');
    const [busyId, setBusyId] = useState(null);
    if (pending.length === 0) return null;

    const respond = async (id, status) => {
        setBusyId(id);
        try {
            await API.put(`/bookings/${id}`, { status });
            onChanged();
        } catch (err) {
            alert(err.response?.data?.message || 'Something went wrong');
        }
        setBusyId(null);
    };

    return (
        <section className="card">
            <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight">
                    Session requests <span className="badge bg-lime px-2 py-0.5 text-ink">{pending.length}</span>
                </h2>
                <Link to="/bookings" className="text-sm text-muted hover:text-ink">See all</Link>
            </div>
            <ul className="space-y-5">
                {pending.slice(0, 2).map((b) => (
                    <li key={b._id}>
                        <Link to={`/profile-view/${b.learner?._id}`} className="flex items-center gap-3">
                            <Avatar name={b.learner?.name} photo={b.learner?.profilePhoto} pastel className="h-12 w-12 text-sm" />
                            <div className="min-w-0">
                                <p className="truncate font-semibold">{b.learner?.name || 'Learner'}</p>
                                <p className="truncate text-sm text-muted">{fmtDay(b.day)} · {b.timeSlot}</p>
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
    const items = [
        ...bookings.filter((b) => b.status === 'confirmed'),
        ...bookings.filter((b) => b.status === 'pending'),
    ].slice(0, 3);

    return (
        <section className="card">
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold tracking-tight">Upcoming</h2>
                <Link to="/bookings" className="text-sm text-muted hover:text-ink">See all</Link>
            </div>
            {items.length === 0 ? (
                <p className="text-sm text-muted">No sessions yet.</p>
            ) : (
                <ul className="space-y-3">
                    {items.map((b, i) => {
                        const other = role === 'coach' ? b.learner : b.coach;
                        const date = nextDateFor(b.day);
                        return (
                            <li key={b._id}>
                                <Link to="/bookings" className="flex items-center gap-3">
                                    <div className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl ${i === 0 ? 'bg-ink text-white' : 'bg-canvas'}`}>
                                        <span className="text-xl font-extrabold leading-none">{date ? date.getDate() : '—'}</span>
                                        <span className={`mt-0.5 text-[10px] font-bold uppercase ${i === 0 ? 'text-lime' : 'text-muted'}`}>{b.day?.slice(0, 3)}</span>
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

const CoachesToFollow = ({ followingIds, onToggleFollow }) => {
    const [coaches, setCoaches] = useState(null);

    // Fetched once; followed coaches stay in the list showing "Following"
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
                    const following = followingIds.has(c._id);
                    // Count includes me once I've followed from here
                    const count = c.followerCount + (following ? 1 : 0);
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
                                aria-label={following ? `Unfollow ${c.name}` : `Follow ${c.name}`}
                                className={`btn shrink-0 border px-4 py-2 ${following ? 'border-transparent bg-canvas' : 'border-line hover:border-ink'}`}
                            >
                                {following ? 'Following' : 'Follow'}
                            </button>
                        </li>
                    );
                })}
            </ul>
        </section>
    );
};

const FeedRail = ({ profile, bookings, reloadBookings, followingIds, onToggleFollow }) => (
    <aside className="space-y-5">
        {profile.role === 'coach' && <SessionRequests bookings={bookings} onChanged={reloadBookings} />}
        <Upcoming bookings={bookings} role={profile.role} />
        <CoachesToFollow followingIds={followingIds} onToggleFollow={onToggleFollow} />
    </aside>
);

export default FeedRail;
