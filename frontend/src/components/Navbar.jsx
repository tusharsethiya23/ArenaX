// Navbar.jsx
// Top bar, 80px tall and sticky (it hides while scrolling down and comes back
// on any scroll up, see useHideOnScroll).
//   Logged in, desktop (lg+): wide search (Ctrl K) on the left; bell, messages
//     and a yellow "+" create button on the right. The logo, navigation and
//     user card live in the left sidebar (AppSidebar).
//   Logged in, phones/tablets: logo, then bell, messages and the avatar menu
//     (navigation is in the bottom tab bar).
//   Logged out: logo, Log in / Join.

import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';
import NotificationBell from './NotificationBell';
import MessagesButton from './MessagesButton';
import UserMenu from './UserMenu';
import useHideOnScroll from '../hooks/useHideOnScroll';
import { canAccess } from '../utils/access';

// Searches coaches by sport or city on Discover. Ctrl K (or ⌘K) focuses it.
const TopSearch = () => {
    const navigate = useNavigate();
    const [q, setQ] = useState('');
    const inputRef = useRef(null);

    useEffect(() => {
        const onKey = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                inputRef.current?.focus();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    const submit = (e) => {
        e.preventDefault();
        const query = q.trim();
        navigate(query ? `/discover?q=${encodeURIComponent(query)}` : '/discover');
        inputRef.current?.blur();
    };

    return (
        <form onSubmit={submit} role="search" className="flex h-11 w-full max-w-xl items-center gap-3 rounded-full bg-surface px-4 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)] focus-within:shadow-[inset_0_0_0_1px_rgb(255_194_26/0.6)]">
            <Search size={17} className="shrink-0 text-muted" />
            <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search coaches by sport or city"
                aria-label="Search coaches by sport or city"
                className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted"
            />
            <kbd className="hidden shrink-0 rounded-md border border-line bg-canvas px-1.5 py-0.5 font-sans text-[11px] font-medium text-muted xl:block">Ctrl K</kbd>
        </form>
    );
};

const Navbar = () => {
    const { user } = useAuth();
    // Slides up out of view while scrolling down, back in on any scroll up
    const hidden = useHideOnScroll();

    return (
        <nav className={`sticky top-0 z-40 h-20 bg-smoke-page transition-transform duration-300 motion-reduce:transition-none ${hidden ? '-translate-y-full' : ''} ${user ? 'lg:border-b lg:border-line' : ''}`}>
            <div className="mx-auto flex h-full max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">

                {/* ---------- LEFT: logo (phones/tablets, or logged out) / search (desktop) ---------- */}
                <div className={user ? 'lg:hidden' : ''}>
                    <Logo />
                </div>
                {user && (
                    <div className="hidden min-w-0 flex-1 lg:block">
                        <TopSearch />
                    </div>
                )}

                {/* ---------- RIGHT ---------- */}
                <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                    {user ? (
                        <>
                            <NotificationBell />
                            {canAccess(user, 'directMessages') && <MessagesButton />}
                            <Link to="/new-post" aria-label="Create a post" title="Create a post" className="hidden h-11 w-11 items-center justify-center rounded-xl bg-brand text-on-ink transition-transform hover:brightness-110 active:scale-95 lg:flex">
                                <Plus size={22} strokeWidth={2.75} />
                            </Link>
                            <div className="lg:hidden"><UserMenu /></div>
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
