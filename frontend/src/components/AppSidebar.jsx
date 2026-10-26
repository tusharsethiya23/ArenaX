// AppSidebar.jsx
// Left sidebar on desktop (lg+), 230px, fixed to the full height:
//   - ArenaX logo
//   - navigation: Home, Discover, Tournaments, Marketplace, Messages (red dot
//     when unread), then by role: My DNA (athletes) or My Athletes (coaches),
//     Calendar, My Stats (coaches). The active page is a dark row with a
//     yellow bar on the left.
//   - "Discipline builds freedom" poster with an "Invite friends" button that
//     copies your invite link
//   - your user card at the bottom (avatar, name, role, ⋮ account menu)
// Phones and tablets use the top bar + bottom tab bar instead.

import { useCallback, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    Home, Compass, Trophy, ShoppingBag, MessageCircle, Users, Dna, CalendarDays, BarChart3,
    ArrowRight, MoreVertical,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import useInbox from '../hooks/useInbox';
import usePoints from '../hooks/usePoints';
import useDismiss from '../hooks/useDismiss';
import Logo from './Logo';
import Avatar from './Avatar';
import AccountMenu from './AccountMenu';
import { canAccess } from '../utils/access';
import { toast } from '../utils/dialogs';

const ROLE_LABEL = { learner: 'Athlete', coach: 'Coach', admin: 'Admin' };

// Is this link the current page? ("/profile?tab=stats" needs the query too)
const isCurrent = (to, { pathname, search }) => {
    const [path, query] = to.split('?');
    if (path === '/') return pathname === '/';
    if (query) return pathname === path && search === `?${query}`;
    return pathname === path || pathname.startsWith(`${path}/`);
};

const AppSidebar = () => {
    const { user } = useAuth();
    const location = useLocation();
    const { unreadChats } = useInbox();
    const { inviteCode } = usePoints();
    const [menuOpen, setMenuOpen] = useState(false);
    const cardRef = useRef(null);
    const closeMenu = useCallback(() => setMenuOpen(false), []);
    useDismiss(cardRef, menuOpen, closeMenu);

    const items = [
        { to: '/', label: 'Home', icon: Home },
        { to: '/discover', label: 'Discover', icon: Compass },
        { to: '/tournaments', label: 'Tournaments', icon: Trophy },
        { to: '/marketplace', label: 'Marketplace', icon: ShoppingBag },
        canAccess(user, 'directMessages') && { to: '/messages', label: 'Messages', icon: MessageCircle, dot: unreadChats > 0 },
        user.role === 'learner' && canAccess(user, 'athleteDna') && { to: '/dna', label: 'My DNA', icon: Dna },
        user.role === 'coach' && { to: '/my-athletes', label: 'My Athletes', icon: Users },
        { to: '/calendar', label: 'Calendar', icon: CalendarDays },
        user.role === 'coach' && canAccess(user, 'coachStats') && { to: '/profile?tab=stats', label: 'My Stats', icon: BarChart3 },
    ].filter(Boolean);

    const invite = async () => {
        if (!inviteCode) return;
        try {
            await navigator.clipboard.writeText(`${window.location.origin}/register?ref=${inviteCode}`);
            toast('Invite link copied. Friends who join earn you 100 Arena Points.', 'success');
        } catch {
            toast('Could not copy. Find your invite link on your profile.', 'error');
        }
    };

    return (
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-[230px] flex-col border-r border-line bg-smoke-page lg:flex">
            {/* ---------- Logo ---------- */}
            <div className="flex h-20 shrink-0 items-center px-5">
                <Logo />
            </div>

            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {/* ---------- Navigation ---------- */}
                <nav aria-label="Main" className="space-y-1">
                    {items.map(({ to, label, icon: Icon, dot }) => {
                        const active = isCurrent(to, location);
                        return (
                            <Link
                                key={to}
                                to={to}
                                aria-current={active ? 'page' : undefined}
                                className={`relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
                                    active
                                        ? 'bg-canvas text-ink before:absolute before:inset-y-2 before:left-0 before:w-1 before:rounded-r before:bg-brand'
                                        : 'text-muted hover:bg-canvas hover:text-ink'
                                }`}
                            >
                                <Icon size={18} strokeWidth={1.8} className={active ? 'text-brand' : ''} />
                                <span className="flex-1">{label}</span>
                                {dot && <span className="h-2 w-2 rounded-full bg-like" aria-label="Unread messages" />}
                            </Link>
                        );
                    })}
                </nav>

                {/* ---------- Poster ---------- */}
                <div className="relative mt-6 overflow-hidden rounded-2xl border border-line">
                    <img src="/images/poster-discipline.jpg" alt="" className="photo absolute inset-0 h-full w-full" />
                    <div className="absolute inset-0 bg-black/55" />
                    <div className="relative flex min-h-[220px] flex-col justify-between p-4">
                        <p className="font-display text-[34px] leading-[0.9] text-white">
                            Discipline<br />builds<br /><span className="text-brand">freedom</span>
                        </p>
                        <button onClick={invite} className="btn btn-dark mt-4 self-start px-4 py-2 text-xs">
                            Invite friends <ArrowRight size={14} />
                        </button>
                    </div>
                </div>
            </div>

            {/* ---------- User card ---------- */}
            <div ref={cardRef} className="relative shrink-0 border-t border-line p-3">
                {menuOpen && <AccountMenu inSidebar onClose={closeMenu} className="absolute bottom-full left-3 mb-2" />}
                <div className="flex items-center gap-3 rounded-xl px-2 py-1.5">
                    <Link to="/profile" className="flex min-w-0 flex-1 items-center gap-3">
                        <Avatar name={user.name} photo={user.profilePhoto} className="h-10 w-10 text-xs" />
                        <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold">{user.name}</span>
                            <span className="block text-xs text-muted">{ROLE_LABEL[user.role] || user.role}</span>
                        </span>
                    </Link>
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        aria-label="Account menu"
                        aria-haspopup="menu"
                        aria-expanded={menuOpen}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-canvas hover:text-ink"
                    >
                        <MoreVertical size={18} />
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default AppSidebar;
