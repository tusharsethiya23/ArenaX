// MobileTabBar.jsx
// Bottom tab bar shown below the md breakpoint, replacing the navbar's center
// links. Same 4 destinations as desktop (from navLinks.js), each with an icon.

import { NavLink } from 'react-router-dom';
import NAV_LINKS from './navLinks';

const MobileTabBar = () => (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.08] bg-[#07090F]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden">
        <div className="grid h-16 grid-cols-4">
            {NAV_LINKS.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                    key={to}
                    to={to}
                    end={end}
                    className={({ isActive }) =>
                        `relative flex flex-col items-center justify-center gap-1 text-[10px] uppercase tracking-wider transition-colors ${
                            isActive ? 'text-white' : 'text-gray-500'
                        }`
                    }
                >
                    {({ isActive }) => (
                        <>
                            {/* Active indicator on the top edge, mirroring the desktop underline */}
                            {isActive && <span className="absolute inset-x-6 top-0 h-0.5 bg-[#E11D1D]" />}
                            <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} className={isActive ? 'text-[#E11D1D]' : ''} />
                            <span className="whitespace-nowrap">{label}</span>
                        </>
                    )}
                </NavLink>
            ))}
        </div>
    </nav>
);

export default MobileTabBar;
