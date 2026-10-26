// Avatar.jsx
// Round profile picture. Falls back to the person's initials when they
// haven't uploaded a photo: on yellow by default, or (with `pastel`) on a grey or
// yellow tint picked from their name, so the same person always gets the same colour.

// "Virat Kohli" -> "VK", "Madonna" -> "M"
const getInitials = (name = '') =>
    name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || '?';

// [background, text] pairs for pastel avatars
const PASTELS = [
    ['bg-raised', 'text-ink'], // grey
    ['bg-accent/20', 'text-accent'], // yellow
    ['bg-white/15', 'text-ink'], // light grey
    ['bg-raised', 'text-accent'], // grey + yellow
    ['bg-accent/10', 'text-ink'], // soft yellow
];

const pastelFor = (name = '') => {
    let hash = 0;
    for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
    return PASTELS[hash % PASTELS.length];
};

const Avatar = ({ name, photo, pastel = false, className = 'h-10 w-10 text-sm' }) => {
    if (photo) {
        return <img src={photo} alt={name} className={`${className} photo shrink-0 rounded-full`} />;
    }
    const [bg, text] = pastel ? pastelFor(name) : ['bg-accent', 'text-on-ink'];
    return (
        <span className={`${className} flex shrink-0 items-center justify-center rounded-full font-bold ${bg} ${text}`}>
            {getInitials(name)}
        </span>
    );
};

export default Avatar;
