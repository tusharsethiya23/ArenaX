// achievements.js
// Portfolio categories and levels (keep in sync with Backend/models/achievement.model.js).

import { Trophy, Users, Award, Timer, Medal } from 'lucide-react';

export const CATEGORIES = [
    { key: 'competition', label: 'Competition result', icon: Trophy, tone: 'text-highlight' },
    { key: 'selection', label: 'Team / squad selection', icon: Users, tone: 'text-data-blue' },
    { key: 'certification', label: 'Certification', icon: Award, tone: 'text-data-mint' },
    { key: 'record', label: 'Personal or club record', icon: Timer, tone: 'text-data-pink' },
    { key: 'award', label: 'Award', icon: Medal, tone: 'text-accent' },
];
export const CATEGORY_BY_KEY = Object.fromEntries(CATEGORIES.map((c) => [c.key, c]));
export const LEVELS = ['school', 'club', 'district', 'state', 'national', 'international'];

// "Competition result · State · Feb 2026"
export const achievementMeta = (a) => [
    (CATEGORY_BY_KEY[a.category] || CATEGORIES[0]).label,
    a.level && a.level[0].toUpperCase() + a.level.slice(1),
    new Date(a.date).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }),
].filter(Boolean).join(' · ');
