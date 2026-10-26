// tones.js
// The small set of colours for stat dots, icon tiles and tinted states.
// Navigation is neutral (grey icons, yellow active state), so it doesn't use these.
//   text: icon / selected text colour
//   soft: tinted glass background for the selected state
//   dot:  small solid dot (stat labels, legends)
// Full class names are written out so Tailwind can find them.

export const TONES = {
    accent: { text: 'text-accent', soft: 'bg-accent/15', dot: 'bg-accent' },
    blue: { text: 'text-data-blue', soft: 'bg-data-blue/15', dot: 'bg-data-blue' },
    pink: { text: 'text-data-pink', soft: 'bg-data-pink/15', dot: 'bg-data-pink' },
    mint: { text: 'text-data-mint', soft: 'bg-data-mint/15', dot: 'bg-data-mint' },
    highlight: { text: 'text-highlight', soft: 'bg-highlight/15', dot: 'bg-highlight' },
    neutral: { text: 'text-ink/65', soft: 'bg-white/[0.08]', dot: 'bg-ink/65' },
};

// Fixed order for lists of stats, so the same position always gets the same colour
export const STAT_TONES = ['accent', 'accent', 'accent', 'accent'];
