// Navbar.jsx
// Sticky top bar, 72px tall, translucent with blur.
//   LEFT:   ARENAX logo (red X)
//   CENTER: 4 primary links (desktop only; mobile uses MobileTabBar instead)
//   RIGHT:  notification bell + avatar menu (or Log in / Join when logged out)
// Everything else (bookings, plan, settings, logout...) lives in UserMenu.

import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NAV_LINKS from './navLinks';
import NotificationBell from './NotificationBell';
import UserMenu from './UserMenu';

const Navbar = () => {
    const { user } = useAuth();

    return (
        <nav className="sticky top-0 z-40 h-[72px] border-b border-white/[0.08] bg-[#07090F]/85 backdrop-blur-md">
            {/* 2 columns on mobile (logo | right), 3 on desktop so the links sit truly centered */}
            <div className="mx-auto grid h-full max-w-[1440px] grid-cols-[1fr_auto] items-center gap-6 px-4 sm:px-6 md:grid-cols-[1fr_auto_1fr] lg:px-10">

                {/* ---------- LEFT: logo ---------- */}
                <Link
                    to="/"
                    className="justify-self-start whitespace-nowrap text-lg font-black tracking-[0.25em] text-white sm:text-xl"
                >
                    ARENA<span className="text-[#E11D1D]">X</span>
                </Link>

                {/* ---------- CENTER: primary links (desktop) ---------- */}
                {user && (
                    <div className="hidden h-full items-stretch gap-8 md:flex lg:gap-10">
                        {NAV_LINKS.map(({ to, label, end }) => (
                            <NavLink
                                key={to}
                                to={to}
                                end={end}
                                className={({ isActive }) =>
                                    `relative flex items-center whitespace-nowrap text-sm uppercase tracking-wider transition-colors ${
                                        isActive ? 'text-white' : 'text-gray-400 hover:text-white'
                                    }`
                                }
                            >
                                {({ isActive }) => (
                                    <>
                                        {label}
                                        {/* Active indicator: 2px red bar on the navbar's bottom edge */}
                                        {isActive && <span className="absolute inset-x-0 -bottom-px h-0.5 bg-[#E11D1D]" />}
                                    </>
                                )}
                            </NavLink>
                        ))}
                    </div>
                )}

                {/* ---------- RIGHT ---------- */}
                <div className={`flex items-center gap-3 justify-self-end ${user ? '' : 'md:col-start-3'}`}>
                    {user ? (
                        <>
                            <NotificationBell />
                            <UserMenu />
                        </>
                    ) : (
                        <>
                            <Link
                                to="/login"
                                className="whitespace-nowrap text-xs uppercase tracking-wider text-gray-400 transition-colors hover:text-white"
                            >
                                Log in
                            </Link>
                            <Link
                                to="/register"
                                className="whitespace-nowrap rounded-full bg-[#E11D1D] px-5 py-2 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#FF2A2A]"
                            >
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
