// Logo.jsx
// ArenaX wordmark: black rounded square with a lime "X", then "ARENA X".

import { Link } from 'react-router-dom';

const Logo = ({ to = '/' }) => (
    <Link to={to} className="flex shrink-0 items-center gap-3" aria-label="ArenaX home">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime text-xl font-black text-on-ink">
            X
        </span>
        {/* Wordmark is hidden on tablet widths, where the navbar links need the room */}
        <span className="whitespace-nowrap text-xl font-extrabold tracking-tight text-ink sm:text-2xl md:hidden lg:inline">
            ARENA X
        </span>
    </Link>
);

export default Logo;
