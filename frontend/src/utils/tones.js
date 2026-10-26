// tones.js
// The small set of accent colours used for icons, dots and selected states,
// so that not everything is white. Each destination keeps the same colour
// everywhere (navbar, tab bar, sidebar, avatar menu).
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
export const STAT_TONES = ['blue', 'pink', 'mint', 'accent'];

// Colour per destination (keys are the link targets)
const ROUTE_TONES = {
    '/': 'accent',
    '/discover': 'blue',
    '/tournaments': 'highlight',
    '/marketplace': 'mint',
    '/dna': 'highlight',
    '/my-athletes': 'pink',
    '/calendar': 'blue',
    '/messages': 'blue',
    '/profile?tab=stats': 'mint',
    '/saved': 'pink',
    '/pro': 'highlight',
    '/deals': 'mint',
    '/admin': 'accent',
    '/settings': 'neutral',
};

export const toneFor = (to) => TONES[ROUTE_TONES[to] || 'neutral'];
