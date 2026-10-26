// Logo.jsx
// ArenaX wordmark: yellow square with a black "X", then "ARENA X" in the
// condensed display font with a yellow X.

import { Link } from 'react-router-dom';

const Logo = ({ to = '/' }) => (
    <Link to={to} className="flex shrink-0 items-center gap-3" aria-label="ArenaX home">
        <span className="font-display flex h-10 w-10 items-center justify-center rounded-xl bg-brand pt-0.5 text-[26px] text-on-ink">
            X
        </span>
        {/* Wordmark is hidden on small phones (room for the bell, messages and profile)
            and on tablet / small laptop widths, where the navbar links need the room */}
        <span className="font-display whitespace-nowrap pt-1 text-[28px] text-ink max-[379px]:hidden sm:text-[30px] md:hidden xl:inline">
            ARENA <span className="text-brand">X</span>
        </span>
    </Link>
);

export default Logo;
