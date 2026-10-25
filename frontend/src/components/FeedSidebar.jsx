// FeedSidebar.jsx
// Left column of the Feed (large screens):
//   1. Profile summary: avatar, name, "<sport> coach · <city>", and
//      followers / following / sessions counts
//   2. Menu: Home feed, My DNA (athletes) / My athletes (coaches), Calendar
//      (with a badge for sessions waiting on my answer), My stats (coaches),
//      Saved posts, Settings

import { Link, NavLink } from 'react-router-dom';
import { Home, CalendarDays, BarChart3, Bookmark, Settings, Dna, Users } from 'lucide-react';
import Avatar from './Avatar';
import VerifiedBadge from './VerifiedBadge';
import useFollow from '../hooks/useFollow';
import { compact } from '../utils/format';
import { hasStarted } from '../utils/sessions';
import { toneFor, TONES, STAT_TONES } from '../utils/tones';

const roleTitle = (profile) => {
    const role = profile.role === 'learner' ? 'athlete' : profile.role;
    const what = profile.sport ? `${profile.sport} ${role}` : role;
    return [what.charAt(0).toUpperCase() + what.slice(1), profile.location].filter(Boolean).join(' · ');
};

const FeedSidebar = ({ profile, bookings }) => {
    const follow = useFollow(profile._id);
    // Sessions that actually happen or will: confirmed + completed
    const sessions = bookings.filter((b) => b.status === 'confirmed' || b.status === 'completed').length;
    const pending = bookings.filter((b) => ['pending', 'confirmed'].includes(b.status) && (
        (profile.role === 'coach' && b.status === 'pending' && !b.reschedule && !hasStarted(b))
        || (b.reschedule && String(b.reschedule.by) !== String(profile._id))
    )).length;

    const stats = [
        { label: 'Followers', value: follow.followers },
        { label: 'Following', value: follow.following },
        { label: 'Sessions', value: sessions },
    ];

    const items = [
        { to: '/', label: 'Home feed', icon: Home, end: true },
        profile.role === 'learner' && { to: '/dna', label: 'My DNA', icon: Dna },
        profile.role === 'coach' && { to: '/my-athletes', label: 'My athletes', icon: Users },
        { to: '/calendar', label: 'Calendar', icon: CalendarDays, badge: pending },
        profile.role === 'coach' && { to: '/profile?tab=stats', label: 'My stats', icon: BarChart3 },
        { to: '/saved', label: 'Saved posts', icon: Bookmark },
        { to: '/settings', label: 'Settings', icon: Settings },
    ].filter(Boolean);

    return (
        <aside className="space-y-4">
            {/* ---------- Profile summary (compact so the whole column fits on short screens) ---------- */}
            <section className="card p-4 sm:p-4">
                <div className="flex items-center gap-3">
                    <Link to="/profile" className="shrink-0 rounded-full ring-2 ring-ink ring-offset-2 ring-offset-surface">
                        <Avatar name={profile.name} photo={profile.profilePhoto} className="h-12 w-12 text-base" />
                    </Link>
                    <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                            <Link to="/profile" className="truncate font-bold hover:underline">{profile.name}</Link>
                            {profile.verified && <VerifiedBadge size={15} />}
                        </div>
                        <p className="truncate text-sm text-muted">{roleTitle(profile)}</p>
                    </div>
                </div>

                <div className="mt-3 grid grid-cols-3 border-t border-line pt-3 text-center">
                    {stats.map((s, i) => (
                        <div key={s.label}>
                            <p className="font-extrabold">{compact(s.value)}</p>
                            <p className="flex items-center justify-center gap-1.5 text-xs text-muted">
                                <span className={`h-1.5 w-1.5 rounded-full ${TONES[STAT_TONES[i]].dot}`} />
                                {s.label}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ---------- Menu ---------- */}
            <nav className="card p-2 sm:p-2">
                {items.map(({ to, label, icon: Icon, badge, end }) => (
                    <NavLink
                        key={to}
                        to={to}
                        end={end}
                        className={({ isActive }) =>
                            `flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium transition-colors ${isActive ? toneFor(to).soft : 'hover:bg-canvas'}`
                        }
                    >
                        <Icon size={18} strokeWidth={1.8} className={toneFor(to).text} />
                        <span className="flex-1">{label}</span>
                        {badge > 0 && <span className="badge bg-white px-2 py-0.5 text-on-ink">{badge}</span>}
                    </NavLink>
                ))}
            </nav>
        </aside>
    );
};

export default FeedSidebar;
