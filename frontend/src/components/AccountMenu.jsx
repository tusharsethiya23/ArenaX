// AccountMenu.jsx
// The account dropdown's contents: your Arena Points and streak, links, and
// log out. Used by the avatar menu in the top bar (phones and tablets) and by
// the ⋮ menu on the sidebar's user card (desktop). `inSidebar` leaves out the
// header and the pages the sidebar already lists.

import { Link, useNavigate } from 'react-router-dom';
import {
    CalendarDays, BarChart3, Sparkles, Settings, UserRound,
    Handshake, ShieldCheck, LogOut, Bookmark, Dna, Users, MessageCircle, Zap, Flame,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import usePoints from '../hooks/usePoints';
import useInbox from '../hooks/useInbox';
import Avatar from './Avatar';
import { canAccess } from '../utils/access';

const AccountMenu = ({ onClose, inSidebar = false, className = '' }) => {
    const { user, logout } = useAuth();
    const { unreadChats: unreadMessages } = useInbox(); // people with unread messages
    const { points, streak } = usePoints();
    const navigate = useNavigate();

    const handleLogout = () => {
        onClose();
        logout();
        navigate('/login');
    };

    // Role-specific pages (stats, deals, admin) only show for that role,
    // matching which routes exist for them in App.jsx.
    const items = [
        inSidebar && { to: '/profile', label: 'My profile', icon: UserRound },
        !inSidebar && user.role === 'learner' && canAccess(user, 'athleteDna') && { to: '/dna', label: 'My DNA', icon: Dna },
        !inSidebar && user.role === 'coach' && { to: '/my-athletes', label: 'My athletes', icon: Users },
        !inSidebar && canAccess(user, 'directMessages') && { to: '/messages', label: 'Messages', icon: MessageCircle, badge: unreadMessages },
        !inSidebar && { to: '/calendar', label: 'Calendar', icon: CalendarDays },
        !inSidebar && user.role === 'coach' && canAccess(user, 'coachStats') && { to: '/profile?tab=stats', label: 'My stats', icon: BarChart3 },
        { to: '/saved', label: 'Saved posts', icon: Bookmark },
        { to: '/pro', label: 'ArenaX Pro', icon: Sparkles, tag: 'Soon' },
        user.role === 'coach' && { to: '/deals', label: 'Brand deals', icon: Handshake },
        user.role === 'admin' && { to: '/admin', label: 'Admin', icon: ShieldCheck },
        { to: '/settings', label: 'Settings', icon: Settings },
    ].filter(Boolean);

    return (
        <div role="menu" className={`z-50 w-64 overflow-hidden rounded-2xl border border-line bg-popover shadow-[0_20px_50px_rgba(0,0,0,0.5)] ${className}`}>
            {/* Header: avatar, name, profile link */}
            {!inSidebar && (
                <div className="flex items-center gap-3 border-b border-line p-4">
                    <Avatar name={user.name} photo={user.profilePhoto} className="h-11 w-11 text-sm" />
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{user.name}</p>
                        <Link to="/profile" onClick={onClose} className="text-xs text-muted transition-colors hover:text-ink">
                            View profile
                        </Link>
                    </div>
                </div>
            )}

            {/* Arena Points and daily streak (details on the profile page) */}
            <Link to="/profile" onClick={onClose} role="menuitem" className="mx-2 mt-2 flex items-center justify-between gap-3 rounded-xl bg-canvas px-3 py-2.5 transition-colors hover:bg-raised">
                <span className="flex items-center gap-2">
                    <Zap size={16} className="fill-brand text-brand" />
                    <span className="font-display pt-0.5 text-xl text-brand">{points.toLocaleString()}</span>
                    <span className="text-xs text-muted">Arena Points</span>
                </span>
                <span className="flex items-center gap-1 text-xs font-semibold text-ink" title="Days in a row you've opened ArenaX">
                    <Flame size={14} className="text-brand" /> {streak.count}
                </span>
            </Link>

            {/* Links */}
            <div className="p-2">
                {items.map(({ to, label, icon: Icon, badge, tag }) => (
                    <Link
                        key={to}
                        to={to}
                        role="menuitem"
                        onClick={onClose}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-canvas"
                    >
                        <Icon size={17} strokeWidth={1.8} className="text-muted" />
                        <span className="flex-1">{label}</span>
                        {badge > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-like px-1.5 text-[11px] font-bold text-white">{badge > 99 ? '99+' : badge}</span>}
                        {tag && <span className="badge bg-brand/15 px-2 py-0.5 text-[10px] uppercase tracking-wider text-brand">{tag}</span>}
                    </Link>
                ))}
            </div>

            {/* Log out, separated by a divider */}
            <div className="border-t border-line p-2">
                <button
                    onClick={handleLogout}
                    role="menuitem"
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-danger transition-colors hover:bg-danger/10"
                >
                    <LogOut size={17} strokeWidth={1.8} />
                    Log out
                </button>
            </div>
        </div>
    );
};

export default AccountMenu;
