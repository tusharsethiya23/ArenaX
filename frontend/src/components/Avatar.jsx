// Avatar.jsx
// Round profile picture. Falls back to the person's initials when they
// haven't uploaded a photo: on lime by default, or (with `pastel`) on a soft
// colour picked from their name, so the same person always gets the same colour.

// "Virat Kohli" -> "VK", "Madonna" -> "M"
const getInitials = (name = '') =>
    name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || '?';

// [background, text] pairs for pastel avatars
const PASTELS = [
    ['bg-sky-400/20', 'text-sky-200'], // blue
    ['bg-orange-400/20', 'text-orange-200'], // peach
    ['bg-emerald-400/20', 'text-emerald-200'], // mint
    ['bg-violet-400/20', 'text-violet-200'], // lavender
    ['bg-amber-400/20', 'text-amber-200'], // butter
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
    const [bg, text] = pastel ? pastelFor(name) : ['bg-lime', 'text-on-ink'];
    return (
        <span className={`${className} flex shrink-0 items-center justify-center rounded-full font-bold ${bg} ${text}`}>
            {getInitials(name)}
        </span>
    );
};

export default Avatar;
