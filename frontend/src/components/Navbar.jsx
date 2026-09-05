import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="border-b border-white/10 bg-[#05070D]">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 sm:py-5">

                {/* Logo */}
                <Link
                    to="/discover"
                    className="shrink-0 text-lg font-black uppercase tracking-[0.15em] text-white transition-colors hover:text-[#FF2A2A] sm:text-xl sm:tracking-[0.2em]"
                >
                    ARENAX
                </Link>

                {user ? (
                    <>
                        {/* Desktop Menu */}
                        <div className="hidden items-center gap-6 text-xs uppercase tracking-[0.15em] md:flex lg:gap-7">

                            <Link
                                to="/discover"
                                className="text-white/50 transition-colors hover:text-[#FF2A2A]"
                            >
                                Discover
                            </Link>

                            <Link
                                to="/bookings"
                                className="text-white/50 transition-colors hover:text-[#FF2A2A]"
                            >
                                Bookings
                            </Link>

                            <Link
                                to="/marketplace"
                                className="text-white/50 transition-colors hover:text-[#FF2A2A]"
                            >
                                Market Place
                            </Link>

                            <Link
                                to="/subscription"
                                className="text-white/50 transition-colors hover:text-signal"
                            >
                                Subscription
                            </Link>

                            {user.role === "coach" && (
                                <Link
                                    to="/analytics"
                                    className="text-white/50 transition-colors hover:text-signal"
                                >
                                    Analytics
                                </Link>
                            )}

                            <Link
                                to="/profile"
                                className="text-white/50 transition-colors hover:text-[#FF2A2A]"
                            >
                                Profile
                            </Link>

                            <span className="h-4 w-px bg-white/15" />

                            <span className="max-w-[120px] truncate text-white/70 normal-case tracking-normal">
                                {user.name}
                            </span>

                            <button
                                onClick={handleLogout}
                                className="shrink-0 border border-red-500/50 px-4 py-2 text-[10px] uppercase tracking-[0.15em] text-white transition-all duration-300 hover:border-[#FF2A2A] hover:bg-[#E21B23] active:scale-95"
                            >
                                Log out
                            </button>

                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="border border-white/15 px-3 py-2 text-xl text-white transition-colors hover:border-[#FF2A2A] hover:text-[#FF2A2A] md:hidden"
                        >
                            {isMenuOpen ? "✕" : "☰"}
                        </button>

                    </>
                ) : (
                    <div className="flex items-center gap-4 text-[10px] uppercase tracking-[0.12em] sm:gap-6 sm:text-xs sm:tracking-[0.15em]">

                        <Link
                            to="/login"
                            className="text-white/50 transition-colors hover:text-white"
                        >
                            Log in
                        </Link>

                        <Link
                            to="/register"
                            className="bg-[#E21B23] px-4 py-2 font-bold text-white transition-all duration-300 hover:bg-[#FF2A2A] hover:shadow-[0_0_25px_rgba(226,27,35,0.35)] active:scale-95 sm:px-5 sm:py-2.5"
                        >
                            Join
                        </Link>

                    </div>
                )}

            </div>

            {/* Mobile Dropdown */}
            {user && isMenuOpen && (
                <div className="border-t border-white/10 bg-[#071426] px-4 py-4 md:hidden">
                    <div className="flex flex-col gap-4 text-xs uppercase tracking-[0.15em]">

                        <Link
                            to="/discover"
                            onClick={() => setIsMenuOpen(false)}
                            className="text-white/60 transition-colors hover:text-[#FF2A2A]"
                        >
                            Discover
                        </Link>

                        <Link
                            to="/bookings"
                            onClick={() => setIsMenuOpen(false)}
                            className="text-white/60 transition-colors hover:text-[#FF2A2A]"
                        >
                            Bookings
                        </Link>

                        <Link
                            to="/marketplace"
                            onClick={() => setIsMenuOpen(false)}
                            className="text-white/60 transition-colors hover:text-[#FF2A2A]"
                        >
                            Market Place
                        </Link>

                        <Link
                            to="/subscription"
                            onClick={() => setIsMenuOpen(false)}
                            className="text-white/60 transition-colors hover:text-[#FF2A2A]"
                        >
                            Subscription
                        </Link>

                        {user.role === "coach" && (
                            <Link
                                to="/analytics"
                                onClick={() => setIsMenuOpen(false)}
                                className="text-white/60 transition-colors hover:text-[#FF2A2A]"
                            >
                                Analytics
                            </Link>
                        )}

                        <Link
                            to="/profile"
                            onClick={() => setIsMenuOpen(false)}
                            className="text-white/60 transition-colors hover:text-[#FF2A2A]"
                        >
                            Profile
                        </Link>

                        <div className="border-t border-white/10 pt-4">
                            <p className="mb-3 text-white/50 normal-case tracking-normal">
                                {user.name}
                            </p>

                            <button
                                onClick={handleLogout}
                                className="w-full border border-red-500/50 px-4 py-2 text-left text-[10px] uppercase tracking-[0.15em] text-white transition-all duration-300 hover:border-[#FF2A2A] hover:bg-[#E21B23]"
                            >
                                Log out
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;