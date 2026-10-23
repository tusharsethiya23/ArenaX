// UserMenu.jsx
// Avatar pill (initials or photo + chevron) that opens the account dropdown.
// Closes on outside click, Escape, or after choosing an item.

import { useState, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    ChevronDown, CalendarDays, BarChart3, CreditCard, Settings,
    Handshake, ShieldCheck, LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import useDismiss from '../hooks/useDismiss';
import useSubscription from '../hooks/useSubscription';

// "Virat Kohli" -> "VK", "Madonna" -> "M"
const getInitials = (name = '') =>
    name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || '?';

export const NavAvatar = ({ user, size = 'h-8 w-8 text-xs' }) =>
    user.profilePhoto ? (
        <img src={user.profilePhoto} alt={user.name} className={`${size} shrink-0 rounded-full object-cover`} />
    ) : (
        <span className={`${size} flex shrink-0 items-center justify-center rounded-full bg-[#E11D1D] font-bold text-white`}>
            {getInitials(user.name)}
        </span>
    );

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

    // Menu items. Role-specific pages (stats, deals, admin) only show for that role,
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
            {/* Trigger: avatar + chevron in a thin red pill */}
            <button
                onClick={() => setOpen(!open)}
                aria-label="Account menu"
                aria-haspopup="menu"
                aria-expanded={open}
                className="flex items-center gap-1.5 rounded-full border border-[#E11D1D]/50 p-1 pr-2.5 transition-colors hover:border-[#E11D1D]"
            >
                <NavAvatar user={user} />
                <ChevronDown size={14} className={`text-white/70 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div
                    role="menu"
                    className="absolute right-0 top-full z-50 mt-3 w-64 overflow-hidden rounded-xl border border-white/10 bg-[#0D1220] shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                >
                    {/* Header: avatar, name, profile link, PRO badge */}
                    <div className="flex items-center gap-3 border-b border-white/10 p-4">
                        <NavAvatar user={user} size="h-10 w-10 text-sm" />
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-white">{user.name}</p>
                            <Link to="/profile" onClick={close} className="text-xs text-white/50 transition-colors hover:text-white">
                                View profile
                            </Link>
                        </div>
                        {isPro && (
                            <span className="shrink-0 rounded border border-[#E11D1D]/60 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-[#FF4D4D]">
                                PRO
                            </span>
                        )}
                    </div>

                    {/* Links */}
                    <div className="py-1.5">
                        {items.map(({ to, label, icon: Icon }) => (
                            <Link
                                key={to}
                                to={to}
                                role="menuitem"
                                onClick={close}
                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/80 transition-colors hover:bg-white/[0.04] hover:text-white"
                            >
                                <Icon size={16} strokeWidth={1.8} className="text-white/50" />
                                {label}
                            </Link>
                        ))}
                    </div>

                    {/* Log out, separated by a divider */}
                    <div className="border-t border-white/10 py-1.5">
                        <button
                            onClick={handleLogout}
                            role="menuitem"
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-[#FF4D4D] transition-colors hover:bg-[#E11D1D]/10"
                        >
                            <LogOut size={16} strokeWidth={1.8} />
                            Log out
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserMenu;
