// MobileTabBar.jsx
// Bottom tab bar shown below the md breakpoint, replacing the navbar's center
// links. Same destinations as desktop (from navLinks.js). The active tab's
// icon is yellow; the "Post" action in the middle is a raised round
// yellow button.

import { NavLink } from 'react-router-dom';
import NAV_LINKS from './navLinks';

const MobileTabBar = () => (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-smoke-side/95 pb-[env(safe-area-inset-bottom)] md:hidden">
        <div className="grid h-16 grid-cols-5">
            {NAV_LINKS.map(({ to, label, icon: Icon, end, accent }) =>
                accent ? (
                    <NavLink key={to} to={to} aria-label="New post" className="group flex items-start justify-center">
                        <span className="-mt-5 flex h-14 w-14 items-center justify-center rounded-full bg-brand text-on-ink ring-4 ring-smoke-side transition-all duration-200 group-active:scale-90">
                            <Icon size={26} strokeWidth={2.75} />
                        </span>
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
                                <span className={`flex h-7 w-11 items-center justify-center rounded-full transition-colors ${isActive ? 'text-brand' : ''}`}>
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
