// navLinks.js
// The 4 primary destinations, shared by the top navbar (desktop) and the
// bottom tab bar (mobile) so both always stay in sync.

import { Newspaper, Compass, Trophy, ShoppingBag } from 'lucide-react';

const NAV_LINKS = [
    { to: '/', label: 'Feed', icon: Newspaper, end: true }, // `end`: "/" is only active on the exact path
    { to: '/discover', label: 'Discover', icon: Compass },
    { to: '/tournaments', label: 'Tournaments', icon: Trophy },
    { to: '/marketplace', label: 'Marketplace', icon: ShoppingBag },
];

export default NAV_LINKS;
