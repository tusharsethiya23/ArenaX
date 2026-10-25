// Navbar.jsx
// Sticky top bar, 80px tall, sitting on the grey canvas.
//   LEFT:   logo (black square with lime X + "ARENA X")
//   CENTER: the 4 primary links inside a white pill; the active one is a
//           black pill (desktop only; mobile uses MobileTabBar instead)
//   RIGHT:  notification bell + profile pill (or Log in / Join when logged out)
// Everything else (bookings, plan, settings, logout...) lives in UserMenu.

import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NAV_LINKS from './navLinks';
import Logo from './Logo';
import NotificationBell from './NotificationBell';
import UserMenu from './UserMenu';

const Navbar = () => {
    const { user } = useAuth();

    return (
        <nav className="sticky top-0 z-40 h-20 bg-smoke-side/85 backdrop-blur-md">
            {/* 2 columns on mobile (logo | right), 3 on desktop so the links sit truly centered */}
            <div className="mx-auto grid h-full max-w-[1440px] grid-cols-[1fr_auto] items-center gap-2 px-4 sm:gap-4 sm:px-6 md:grid-cols-[1fr_auto_1fr] lg:px-10">

                {/* ---------- LEFT: logo ---------- */}
                <div className="justify-self-start">
                    <Logo />
                </div>

                {/* ---------- CENTER: primary links (desktop) ---------- */}
                {user && (
                    <div className="hidden items-center gap-1 rounded-full bg-surface p-1 md:flex">
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
                                    className={({ isActive }) =>
                                        `whitespace-nowrap rounded-full px-4 py-2.5 text-[15px] font-medium transition-colors lg:px-6 ${
                                            isActive ? 'bg-ink text-on-ink' : 'text-muted hover:text-ink'
                                        }`
                                    }
                                >
                                    {label}
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
