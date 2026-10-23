// SideRail.jsx
// Right-hand column on Discover and Feed (large screens), as in the mockup:
//   1. Profile card: avatar, name, sport/role, and two stat tiles
//   2. Upcoming sessions: the user's active bookings, linking to My bookings
// Stats come from real bookings. Bookings store a weekday + time slot (no
// calendar date), so the date tile shows the weekday.

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import useMyBookings from '../hooks/useMyBookings';
import Avatar from './Avatar';

const ProfileCard = ({ user, bookings }) => {
    const isCoach = user.role === 'coach';
    const stats = isCoach
        ? [
            { value: bookings.filter((b) => b.status === 'pending').length, label: 'Pending requests' },
            { value: bookings.filter((b) => b.status === 'completed').length, label: 'Sessions done' },
        ]
        : [
            { value: bookings.length, label: 'Sessions booked' },
            { value: bookings.filter((b) => b.status === 'completed').length, label: 'Sessions done' },
        ];

    return (
        <div className="card">
            <Link to="/profile" className="flex items-center gap-4">
                <Avatar name={user.name} photo={user.profilePhoto} className="h-16 w-16 text-xl" />
                <div className="min-w-0">
                    <p className="truncate text-xl font-bold tracking-tight">{user.name}</p>
                    <p className="truncate text-sm capitalize text-muted">
                        {[user.sport, user.role].filter(Boolean).join(' · ')}
                    </p>
                </div>
            </Link>

            <div className="mt-5 grid grid-cols-2 gap-3">
                {stats.map((s, i) => (
                    <div key={s.label} className={`rounded-3xl p-4 ${i === 0 ? 'bg-lime' : 'bg-canvas'}`}>
                        <p className="text-3xl font-extrabold tracking-tight">{s.value}</p>
                        <p className={`mt-1 text-xs ${i === 0 ? 'text-ink/70' : 'text-muted'}`}>{s.label}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const UpcomingSessions = ({ user, bookings, limit = 3 }) => {
    // Confirmed sessions first, then ones still awaiting the coach
    const active = [
        ...bookings.filter((b) => b.status === 'confirmed'),
        ...bookings.filter((b) => b.status === 'pending'),
    ].slice(0, limit);

    return (
        <div className="card">
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold tracking-tight">Upcoming sessions</h2>
                <Link to="/bookings" className="text-sm text-muted transition-colors hover:text-ink">See all</Link>
            </div>

            {active.length === 0 ? (
                <p className="py-4 text-sm text-muted">No upcoming sessions yet.</p>
            ) : (
                <ul className="space-y-3">
                    {active.map((b, i) => {
                        const other = user.role === 'coach' ? b.learner : b.coach;
                        return (
                            <li key={b._id}>
                                <Link to="/bookings" className="group flex items-center gap-3">
                                    {/* Weekday tile: first one highlighted, like the mockup */}
                                    <div className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl ${i === 0 ? 'bg-ink text-white' : 'bg-canvas text-ink'}`}>
                                        <span className="text-base font-extrabold leading-none">{b.day?.slice(0, 3).toUpperCase()}</span>
                                        <span className={`mt-1 text-[10px] font-semibold uppercase ${i === 0 ? 'text-lime' : 'text-muted'}`}>
                                            {b.status === 'confirmed' ? 'Booked' : 'Pending'}
                                        </span>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate font-semibold">{other?.name || 'Session'}</p>
                                        <p className="truncate text-sm text-muted">{b.timeSlot}</p>
                                    </div>
                                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-canvas transition-colors group-hover:bg-lime">
                                        <ArrowUpRight size={16} />
                                    </span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
};

const SideRail = () => {
    const { user } = useAuth();
    const { bookings } = useMyBookings();
    // The user saved at login only has name/email/role, so load the full
    // profile (sport, photo...) for the card; show the saved one meanwhile.
    const [profile, setProfile] = useState(null);

    useEffect(() => {
        let cancelled = false;
        API.get(`/users/${user._id}`)
            .then((res) => !cancelled && setProfile(res.data))
            .catch(() => { /* keep showing the saved user */ });
        return () => { cancelled = true; };
    }, [user._id]);

    return (
        <aside className="space-y-6">
            <ProfileCard user={profile || user} bookings={bookings} />
            <UpcomingSessions user={user} bookings={bookings} />
        </aside>
    );
};

export default SideRail;
