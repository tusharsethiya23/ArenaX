// dna.js
// The six Athlete DNA skills (keep in sync with Backend/utils/dna.util.js).

export const DNA_SKILLS = [
    { key: 'technique', label: 'Technique' },
    { key: 'gameSense', label: 'Game sense' },
    { key: 'fitness', label: 'Fitness' },
    { key: 'speed', label: 'Speed & agility' },
    { key: 'mental', label: 'Mental strength' },
    { key: 'discipline', label: 'Discipline' },
];
export const DNA_SKILL_LABEL = Object.fromEntries(DNA_SKILLS.map((s) => [s.key, s.label]));
export const MAX_COACH_FOCUS = 3;
