// achievements.js
// Portfolio categories and levels (keep in sync with Backend/models/achievement.model.js).

import { Trophy, Users, Award, Timer, Medal } from 'lucide-react';

export const CATEGORIES = [
    { key: 'competition', label: 'Competition result', icon: Trophy, tone: 'text-accent' },
    { key: 'selection', label: 'Team / squad selection', icon: Users, tone: 'text-accent' },
    { key: 'certification', label: 'Certification', icon: Award, tone: 'text-accent' },
    { key: 'record', label: 'Personal or club record', icon: Timer, tone: 'text-accent' },
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
