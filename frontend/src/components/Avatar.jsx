// Avatar.jsx
// Round profile picture. Falls back to the person's initials when they
// haven't uploaded a photo: on lime by default, or (with `pastel`) on a soft
// colour picked from their name, so the same person always gets the same colour.

// "Virat Kohli" -> "VK", "Madonna" -> "M"
const getInitials = (name = '') =>
    name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || '?';

// [background, text] pairs for pastel avatars
const PASTELS = [
    ['bg-[#DCE7F7]', 'text-[#2B4C8C]'], // blue
    ['bg-[#FBE3D6]', 'text-[#A3431F]'], // peach
    ['bg-[#DCEFE6]', 'text-[#22684A]'], // mint
    ['bg-[#E7E1F7]', 'text-[#5B3FA0]'], // lavender
    ['bg-[#FBF0D2]', 'text-[#8A5B00]'], // butter
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
    const [bg, text] = pastel ? pastelFor(name) : ['bg-lime', 'text-ink'];
    return (
        <span className={`${className} flex shrink-0 items-center justify-center rounded-full font-bold ${bg} ${text}`}>
            {getInitials(name)}
        </span>
    );
};

export default Avatar;
