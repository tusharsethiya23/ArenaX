// navLinks.js
// The primary destinations, shared by the top navbar (desktop) and the
// bottom tab bar (mobile) so both always stay in sync.
// `accent` marks the "Post" action in the middle, which is drawn as a lime
// button instead of a plain link.

import { Newspaper, Compass, Plus, Trophy, ShoppingBag } from 'lucide-react';

const NAV_LINKS = [
    { to: '/', label: 'Feed', icon: Newspaper, end: true }, // `end`: "/" is only active on the exact path
    { to: '/discover', label: 'Discover', icon: Compass },
    { to: '/new-post', label: 'Post', icon: Plus, accent: true },
    { to: '/tournaments', label: 'Tournaments', icon: Trophy },
    { to: '/marketplace', label: 'Marketplace', icon: ShoppingBag },
];

export default NAV_LINKS;
