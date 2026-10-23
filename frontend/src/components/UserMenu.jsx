// UserMenu.jsx
// White profile pill (avatar, short name, "Pro member"/role, chevron) that
// opens the account dropdown. Closes on outside click, Escape, or after
// choosing an item.

import { useState, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    ChevronDown, CalendarDays, BarChart3, CreditCard, Settings,
    Handshake, ShieldCheck, LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import useDismiss from '../hooks/useDismiss';
import useSubscription from '../hooks/useSubscription';
import Avatar from './Avatar';

// "Virat Kohli" -> "Virat K."
const shortName = (name = '') => {
    const [first, ...rest] = name.trim().split(/\s+/);
    return rest.length ? `${first} ${rest[rest.length - 1][0]}.` : first;
};

const UserMenu = () => {
    const { user, logout } = useAuth();
    const isPro = useSubscription();
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
        { to: '/bookings', label: 'My bookings', icon: CalendarDays },
        user.role === 'coach' && { to: '/profile?tab=stats', label: 'My stats', icon: BarChart3 },
        { to: '/subscription', label: 'Plan and billing', icon: CreditCard },
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
                className="flex items-center gap-2.5 rounded-full bg-surface py-1.5 pl-1.5 pr-3 transition-shadow hover:shadow-sm"
            >
                <Avatar name={user.name} photo={user.profilePhoto} className="h-9 w-9 text-xs" />
                <span className="hidden text-left leading-tight sm:block md:hidden lg:block">
                    <span className="block max-w-[120px] truncate text-sm font-semibold">{shortName(user.name)}</span>
                    <span className="block text-xs text-muted">{isPro ? 'Pro member' : user.role.charAt(0).toUpperCase() + user.role.slice(1)}</span>
                </span>
                <ChevronDown size={16} className={`text-ink transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div
                    role="menu"
                    className="absolute right-0 top-full z-50 mt-3 w-64 overflow-hidden rounded-3xl border border-line bg-surface shadow-[0_20px_50px_rgba(0,0,0,0.12)]"
                >
                    {/* Header: avatar, name, profile link, PRO badge */}
                    <div className="flex items-center gap-3 border-b border-line p-4">
                        <Avatar name={user.name} photo={user.profilePhoto} className="h-11 w-11 text-sm" />
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">{user.name}</p>
                            <Link to="/profile" onClick={close} className="text-xs text-muted transition-colors hover:text-ink">
                                View profile
                            </Link>
                        </div>
                        {isPro && <span className="badge bg-lime text-ink">PRO</span>}
                    </div>

                    {/* Links */}
                    <div className="p-2">
                        {items.map(({ to, label, icon: Icon }) => (
                            <Link
                                key={to}
                                to={to}
                                role="menuitem"
                                onClick={close}
                                className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-canvas"
                            >
                                <Icon size={17} strokeWidth={1.8} className="text-muted" />
                                {label}
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
