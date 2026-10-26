// UserMenu.jsx
// Profile pill (avatar, short name, role, chevron) that opens the account
// dropdown: your Arena Points and streak, links, and log out. Closes on
// outside click, Escape, or after choosing an item.

import { useState, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    ChevronDown, CalendarDays, BarChart3, Sparkles, Settings,
    Handshake, ShieldCheck, LogOut, Bookmark, Dna, Users, MessageCircle, Zap, Flame,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import useDismiss from '../hooks/useDismiss';
import usePoints from '../hooks/usePoints';
import Avatar from './Avatar';
import useInbox from '../hooks/useInbox';
import { canAccess } from '../utils/access';

// "Virat Kohli" -> "Virat K."
const shortName = (name = '') => {
    const [first, ...rest] = name.trim().split(/\s+/);
    return rest.length ? `${first} ${rest[rest.length - 1][0]}.` : first;
};

const UserMenu = () => {
    const { user, logout } = useAuth();
    const { unreadChats: unreadMessages } = useInbox(); // people with unread messages
    const { points, streak } = usePoints();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const wrapperRef = useRef(null);

    const close = useCallback(() => setOpen(false), []);
    useDismiss(wrapperRef, open, close);

    const handleLogout = () => {
        close();
        logout();
        navigate('/login');
    };

    // Role-specific pages (stats, deals, admin) only show for that role,
    // matching which routes exist for them in App.jsx.
    const items = [
        user.role === 'learner' && canAccess(user, 'athleteDna') && { to: '/dna', label: 'My DNA', icon: Dna },
        user.role === 'coach' && { to: '/my-athletes', label: 'My athletes', icon: Users },
        canAccess(user, 'directMessages') && { to: '/messages', label: 'Messages', icon: MessageCircle, badge: unreadMessages },
        { to: '/calendar', label: 'Calendar', icon: CalendarDays },
        user.role === 'coach' && canAccess(user, 'coachStats') && { to: '/profile?tab=stats', label: 'My stats', icon: BarChart3 },
        { to: '/saved', label: 'Saved posts', icon: Bookmark },
        { to: '/pro', label: 'ArenaX Pro', icon: Sparkles, tag: 'Soon' },
        user.role === 'coach' && { to: '/deals', label: 'Brand deals', icon: Handshake },
        user.role === 'admin' && { to: '/admin', label: 'Admin', icon: ShieldCheck },
        { to: '/settings', label: 'Settings', icon: Settings },
    ].filter(Boolean);

    return (
        <div ref={wrapperRef} className="relative">
            {/* Trigger */}
            <button
                onClick={() => setOpen(!open)}
                aria-label="Account menu"
                aria-haspopup="menu"
                aria-expanded={open}
                className="nav-glass flex items-center gap-2.5 rounded-full py-1.5 pl-1.5 pr-3 transition-shadow hover:shadow-sm"
            >
                <Avatar name={user.name} photo={user.profilePhoto} className="h-9 w-9 text-xs" />
                <span className="hidden text-left leading-tight sm:block md:hidden xl:block">
                    <span className="block max-w-[120px] truncate text-sm font-semibold">{shortName(user.name)}</span>
                    <span className="block text-xs text-muted">{user.role === 'learner' ? 'Athlete' : user.role.charAt(0).toUpperCase() + user.role.slice(1)}</span>
                </span>
                <ChevronDown size={16} className={`text-ink transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div
                    role="menu"
                    className="absolute right-0 top-full z-50 mt-3 w-64 overflow-hidden rounded-3xl border border-line bg-popover shadow-[0_20px_50px_rgba(0,0,0,0.12)]"
                >
                    {/* Header: avatar, name, profile link */}
                    <div className="flex items-center gap-3 border-b border-line p-4">
                        <Avatar name={user.name} photo={user.profilePhoto} className="h-11 w-11 text-sm" />
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">{user.name}</p>
                            <Link to="/profile" onClick={close} className="text-xs text-muted transition-colors hover:text-ink">
                                View profile
                            </Link>
                        </div>
                    </div>

                    {/* Arena Points and daily streak (details on the profile page) */}
                    <Link to="/profile" onClick={close} role="menuitem" className="mx-2 mt-2 flex items-center justify-between gap-3 rounded-2xl bg-canvas px-3 py-2.5 transition-colors hover:bg-white/[0.12]">
                        <span className="flex items-center gap-2">
                            <Zap size={16} className="fill-highlight text-highlight" />
                            <span className="text-sm font-bold text-highlight">{points.toLocaleString()}</span>
                            <span className="text-xs text-muted">Arena Points</span>
                        </span>
                        <span className="flex items-center gap-1 text-xs font-semibold text-accent" title="Days in a row you've opened ArenaX">
                            <Flame size={14} /> {streak.count}
                        </span>
                    </Link>

                    {/* Links */}
                    <div className="p-2">
                        {items.map(({ to, label, icon: Icon, badge, tag }) => (
                            <Link
                                key={to}
                                to={to}
                                role="menuitem"
                                onClick={close}
                                className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-canvas"
                            >
                                <Icon size={17} strokeWidth={1.8} className="text-muted" />
                                <span className="flex-1">{label}</span>
                                {badge > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-like px-1.5 text-[11px] font-bold text-white">{badge > 99 ? '99+' : badge}</span>}
                                {tag && <span className="badge bg-highlight/15 px-2 py-0.5 text-[10px] uppercase tracking-wider text-highlight">{tag}</span>}
                            </Link>
                        ))}
                    </div>

                    {/* Log out, separated by a divider */}
                    <div className="border-t border-line p-2">
                        <button
                            onClick={handleLogout}
                            role="menuitem"
                            className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-danger transition-colors hover:bg-danger/10"
                        >
                            <LogOut size={17} strokeWidth={1.8} />
                            Log out
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserMenu;
