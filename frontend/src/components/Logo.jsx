// Logo.jsx
// ArenaX logo: the "AX" monogram (the A's right leg is also one stroke of the
// X, and the A's crossbar stops on the X) and the "ARENAX" wordmark in the
// condensed display font. White on a transparent background.

import { Link } from 'react-router-dom';

// The monogram on its own (also used for the browser-tab icon, public/favicon.svg)
export const LogoMark = ({ className = 'h-8 w-11' }) => (
    <svg viewBox="-1 -4 48 37" className={className} fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true">
        <path d="M3 30 L15 2 L39 30" />
        <path d="M41 2 L21 30" />
        <path d="M8 20.5 L27.5 20.5" />
    </svg>
);

const Logo = ({ to = '/' }) => (
    <Link to={to} className="flex shrink-0 items-center gap-2.5 text-white" aria-label="ArenaX home">
        <LogoMark />
        {/* Wordmark is hidden on small phones (room for the bell, messages and profile)
            and on tablet / small laptop widths, where the navbar links need the room */}
        <span className="font-display whitespace-nowrap pt-1 text-[28px] max-[379px]:hidden sm:text-[30px] md:hidden xl:inline">
            ARENAX
        </span>
    </Link>
);

export default Logo;
