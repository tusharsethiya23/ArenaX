// sports.js
// Sport names and their emoji, used on chips and card tags.

const SPORT_EMOJI = {
    cricket: '🏏',
    football: '⚽',
    soccer: '⚽',
    tennis: '🎾',
    badminton: '🏸',
    basketball: '🏀',
    volleyball: '🏐',
    hockey: '🏑',
    'table tennis': '🏓',
    swimming: '🏊',
    athletics: '🏃',
    running: '🏃',
    boxing: '🥊',
    chess: '♟️',
    golf: '⛳',
    kabaddi: '🤼',
    wrestling: '🤼',
    cycling: '🚴',
    yoga: '🧘',
};

// "cricket " -> "Cricket", so chips don't duplicate on case/spacing
export const normalizeSport = (s = '') => {
    const t = String(s).trim();
    return t ? t.charAt(0).toUpperCase() + t.slice(1).toLowerCase() : '';
};

export const sportEmoji = (sport = '') => SPORT_EMOJI[String(sport).trim().toLowerCase()] || '🏅';
