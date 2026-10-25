// MobileTabBar.jsx
// Bottom tab bar shown below the md breakpoint, replacing the navbar's center
// links. Same destinations as desktop (from navLinks.js). The active tab's
// icon sits in a pill tinted with that tab's colour (utils/tones.js); the
// "Post" action in the middle is a raised round white button.

import { NavLink } from 'react-router-dom';
import NAV_LINKS from './navLinks';
import { toneFor } from '../utils/tones';

const MobileTabBar = () => (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-smoke-side/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden">
        <div className="grid h-16 grid-cols-5">
            {NAV_LINKS.map(({ to, label, icon: Icon, end, accent }) =>
                accent ? (
                    <NavLink key={to} to={to} aria-label="New post" className="group flex items-start justify-center">
                        {({ isActive }) => (
                            <span
                                className={`-mt-5 flex h-14 w-14 items-center justify-center rounded-full ring-4 ring-surface transition-all duration-200 group-active:scale-90 ${
                                    isActive ? 'bg-ink text-on-ink' : 'bg-white text-on-ink shadow-[0_6px_18px_rgba(255,122,47,0.4)]'
                                }`}
                            >
                                <Icon size={26} strokeWidth={2.75} />
                            </span>
                        )}
                    </NavLink>
                ) : (
                    <NavLink
                        key={to}
                        to={to}
                        end={end}
                        className={({ isActive }) =>
                            `flex min-w-0 flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors ${
                                isActive ? 'text-ink' : 'text-muted'
                            }`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <span className={`flex h-7 w-11 items-center justify-center rounded-full transition-colors ${isActive ? `${toneFor(to).soft} ${toneFor(to).text}` : ''}`}>
                                    <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
                                </span>
                                <span className="max-w-full truncate">{label}</span>
                            </>
                        )}
                    </NavLink>
                )
            )}
        </div>
    </nav>
);

export default MobileTabBar;
