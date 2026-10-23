// FeedSidebar.jsx
// Left column of the Feed (large screens):
//   1. Profile summary: avatar, name, "<sport> coach · <city>", and
//      followers / following / sessions counts
//   2. Menu: Home feed, My bookings (with a badge for bookings waiting on a
//      reply), My stats (coaches), Saved posts, Settings

import { Link, NavLink } from 'react-router-dom';
import { Home, CalendarDays, BarChart3, Bookmark, Settings } from 'lucide-react';
import Avatar from './Avatar';
import VerifiedBadge from './VerifiedBadge';
import useFollow from '../hooks/useFollow';
import { compact } from '../utils/format';

const roleTitle = (profile) => {
    const role = profile.role === 'learner' ? 'athlete' : profile.role;
    const what = profile.sport ? `${profile.sport} ${role}` : role;
    return [what.charAt(0).toUpperCase() + what.slice(1), profile.location].filter(Boolean).join(' · ');
};

const FeedSidebar = ({ profile, bookings }) => {
    const follow = useFollow(profile._id);
    // Sessions that actually happen or will: confirmed + completed
    const sessions = bookings.filter((b) => b.status === 'confirmed' || b.status === 'completed').length;
    const pending = bookings.filter((b) => b.status === 'pending').length;

    const stats = [
        { label: 'Followers', value: follow.followers },
        { label: 'Following', value: follow.following },
        { label: 'Sessions', value: sessions },
    ];

    const items = [
        { to: '/', label: 'Home feed', icon: Home, end: true },
        { to: '/bookings', label: 'My bookings', icon: CalendarDays, badge: pending },
        profile.role === 'coach' && { to: '/profile?tab=stats', label: 'My stats', icon: BarChart3 },
        { to: '/saved', label: 'Saved posts', icon: Bookmark },
        { to: '/settings', label: 'Settings', icon: Settings },
    ].filter(Boolean);

    return (
        <aside className="space-y-5">
            {/* ---------- Profile summary ---------- */}
            <section className="card text-center">
                <Link to="/profile" className="mx-auto block w-fit rounded-full ring-2 ring-ink ring-offset-4 ring-offset-surface">
                    <Avatar name={profile.name} photo={profile.profilePhoto} className="h-20 w-20 text-2xl" />
                </Link>
                <div className="mt-4 flex items-center justify-center gap-1.5">
                    <Link to="/profile" className="truncate text-lg font-bold hover:underline">{profile.name}</Link>
                    {profile.verified && <VerifiedBadge size={17} />}
                </div>
                <p className="truncate text-sm text-muted">{roleTitle(profile)}</p>

                <div className="mt-5 grid grid-cols-3 border-t border-line pt-4">
                    {stats.map((s) => (
                        <div key={s.label}>
                            <p className="text-lg font-extrabold">{compact(s.value)}</p>
                            <p className="text-xs text-muted">{s.label}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ---------- Menu ---------- */}
            <nav className="card p-2.5">
                {items.map(({ to, label, icon: Icon, badge, end }) => (
                    <NavLink
                        key={to}
                        to={to}
                        end={end}
                        className={({ isActive }) =>
                            `flex items-center gap-3 rounded-2xl px-4 py-3 text-[15px] font-medium transition-colors ${isActive ? 'bg-canvas' : 'hover:bg-canvas'}`
                        }
                    >
                        <Icon size={18} strokeWidth={1.8} />
                        <span className="flex-1">{label}</span>
                        {badge > 0 && <span className="badge bg-lime px-2 py-0.5 text-ink">{badge}</span>}
                    </NavLink>
                ))}
            </nav>
        </aside>
    );
};

export default FeedSidebar;
