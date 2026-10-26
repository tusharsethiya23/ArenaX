// Navbar.jsx
// Sticky top bar, 80px tall, with no background of its own: only the logo,
// the links pill and the right-hand buttons are drawn (each is its own glass piece).
// It hides while scrolling down and reappears on any scroll up (useHideOnScroll).
//   LEFT:   logo (black square with lime X + "ARENA X")
//   CENTER: the 4 primary links inside a glass pill; the active one is
//           tinted in its own colour (desktop only; mobile uses MobileTabBar)
//   RIGHT:  notification bell + messages (chat) button + profile pill
//           (or Log in / Join when logged out)
// Everything else (bookings, plan, settings, logout...) lives in UserMenu.

import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NAV_LINKS from './navLinks';
import Logo from './Logo';
import NotificationBell from './NotificationBell';
import MessagesButton from './MessagesButton';
import UserMenu from './UserMenu';
import { toneFor } from '../utils/tones';
import useHideOnScroll from '../hooks/useHideOnScroll';
import { canAccess } from '../utils/access';

const Navbar = () => {
    const { user } = useAuth();
    // Slides up out of view while scrolling down, back in on any scroll up
    const hidden = useHideOnScroll();

    return (
        <nav className={`sticky top-0 z-40 h-20 transition-transform duration-300 motion-reduce:transition-none ${hidden ? '-translate-y-full' : ''}`}>
            {/* 2 columns on mobile (logo | right), 3 on desktop so the links sit truly centered */}
            <div className="mx-auto grid h-full max-w-[1440px] grid-cols-[1fr_auto] items-center gap-2 px-4 sm:gap-4 sm:px-6 md:grid-cols-[1fr_auto_1fr] lg:px-10">

                {/* ---------- LEFT: logo ---------- */}
                <div className="nav-glass justify-self-start rounded-2xl p-1 pr-4 max-[379px]:pr-1 md:pr-1 xl:pr-4">
                    <Logo />
                </div>

                {/* ---------- CENTER: primary links (desktop) ---------- */}
                {/* Grid: the four links get equal-width columns (as wide as the longest
                    label) with the Post button in its own column, so it sits exactly
                    in the middle */}
                {user && (
                    <div className="nav-glass hidden grid-cols-[1fr_1fr_auto_1fr_1fr] items-center gap-1 rounded-full p-1 md:grid">
                        {NAV_LINKS.map(({ to, label, end, icon: Icon, accent }) => (
                            accent ? (
                                // "Post" in the middle: round icon-only button that grows and glows on hover
                                <NavLink
                                    key={to}
                                    to={to}
                                    aria-label="New post"
                                    title="New post"
                                    className={({ isActive }) =>
                                        `mx-1.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-all duration-200 hover:scale-110 active:scale-95 ${
                                            isActive
                                                ? 'bg-ink text-on-ink'
                                                : 'bg-white text-on-ink shadow-[0_4px_16px_rgba(255,122,47,0.35)] hover:shadow-[0_6px_22px_rgba(255,122,47,0.55)]'
                                        }`
                                    }
                                >
                                    <Icon size={22} strokeWidth={2.75} />
                                </NavLink>
                            ) : (
                                <NavLink
                                    key={to}
                                    to={to}
                                    end={end}
                                    aria-label={label}
                                    title={label}
                                    className={({ isActive }) =>
                                        `flex h-11 items-center justify-center whitespace-nowrap rounded-full px-4 text-sm font-medium transition-colors lg:px-3 xl:px-5 xl:text-[15px] ${
                                            isActive ? `${toneFor(to).soft} ${toneFor(to).text}` : 'text-muted hover:text-ink'
                                        }`
                                    }
                                >
                                    {/* Tablet: icon only (the label is on hover); laptops and up: the label */}
                                    <Icon size={19} strokeWidth={1.9} className="lg:hidden" />
                                    <span className="hidden lg:inline">{label}</span>
                                </NavLink>
                            )
                        ))}
                    </div>
                )}

                {/* ---------- RIGHT ---------- */}
                <div className={`flex items-center gap-2 justify-self-end sm:gap-3 ${user ? '' : 'md:col-start-3'}`}>
                    {user ? (
                        <>
                            <NotificationBell />
                            {canAccess(user, 'directMessages') && <MessagesButton />}
                            <UserMenu />
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="btn px-3 text-muted hover:text-ink sm:px-5">
                                Log in
                            </Link>
                            <Link to="/register" className="btn btn-dark px-4 sm:px-5">
                                Join
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
