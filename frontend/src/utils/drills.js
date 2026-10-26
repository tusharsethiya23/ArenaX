// drills.js
// Colours and labels for the drill levels (Athlete DNA). Which levels are
// unlocked is decided by the server (Backend/utils/dna.util.js).

export const LEVEL_STYLE = {
    beginner: { label: 'Beginner', chip: 'bg-ok/15 text-ok', bar: 'bg-ok' },
    intermediate: { label: 'Intermediate', chip: 'bg-warn/15 text-warn', bar: 'bg-warn' },
    advanced: { label: 'Advanced', chip: 'bg-accent/15 text-accent', bar: 'bg-accent' },
};
