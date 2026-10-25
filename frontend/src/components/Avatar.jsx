// Avatar.jsx
// Round profile picture. Falls back to the person's initials when they
// haven't uploaded a photo: on lime by default, or (with `pastel`) on a soft
// colour picked from their name, so the same person always gets the same colour.

// "Virat Kohli" -> "VK", "Madonna" -> "M"
const getInitials = (name = '') =>
    name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || '?';

// [background, text] pairs for pastel avatars
const PASTELS = [
    ['bg-data-blue/20', 'text-data-blue'], // blue
    ['bg-accent/20', 'text-accent'], // peach
    ['bg-data-mint/20', 'text-data-mint'], // mint
    ['bg-mauve/35', 'text-ink'], // lavender
    ['bg-data-pink/20', 'text-data-pink'], // butter
];

const pastelFor = (name = '') => {
    let hash = 0;
    for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
    return PASTELS[hash % PASTELS.length];
};

const Avatar = ({ name, photo, pastel = false, className = 'h-10 w-10 text-sm' }) => {
    if (photo) {
        return <img src={photo} alt={name} className={`${className} shrink-0 rounded-full object-cover`} />;
    }
    const [bg, text] = pastel ? pastelFor(name) : ['bg-accent', 'text-on-ink'];
    return (
        <span className={`${className} flex shrink-0 items-center justify-center rounded-full font-bold ${bg} ${text}`}>
            {getInitials(name)}
        </span>
    );
};

export default Avatar;
