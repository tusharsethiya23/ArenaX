// MobileTabBar.jsx
// Bottom tab bar shown below the md breakpoint, replacing the navbar's center
// links. Same 4 destinations as desktop (from navLinks.js). The active tab's
// icon sits in a black pill with a lime icon.

import { NavLink } from 'react-router-dom';
import NAV_LINKS from './navLinks';

const MobileTabBar = () => (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden">
        <div className="grid h-16 grid-cols-4">
            {NAV_LINKS.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                    key={to}
                    to={to}
                    end={end}
                    className={({ isActive }) =>
                        `flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors ${
                            isActive ? 'text-ink' : 'text-muted'
                        }`
                    }
                >
                    {({ isActive }) => (
                        <>
                            <span className={`flex h-7 w-12 items-center justify-center rounded-full transition-colors ${isActive ? 'bg-ink text-lime' : ''}`}>
                                <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
                            </span>
                            <span className="whitespace-nowrap">{label}</span>
                        </>
                    )}
                </NavLink>
            ))}
        </div>
    </nav>
);

export default MobileTabBar;
