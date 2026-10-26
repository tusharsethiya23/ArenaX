// Avatar.jsx
// Round profile picture. Falls back to the person's initials when they
// haven't uploaded a photo, or when their photo fails to load (deleted or
// broken link): on light grey by default, or (with `pastel`) on a shade of
// grey picked from their name, so the same person always gets the same colour.

import { useState } from 'react';

// "Virat Kohli" -> "VK", "Madonna" -> "M"
const getInitials = (name = '') =>
    name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || '?';

// [background, text] pairs for pastel avatars
const PASTELS = [
    ['bg-raised', 'text-ink'], // grey
    ['bg-white/15', 'text-ink'], // light grey
    ['bg-white/10', 'text-ink/80'], // mid grey
    ['bg-canvas', 'text-ink'], // dark grey
    ['bg-white/20', 'text-ink'], // lighter grey
];

const pastelFor = (name = '') => {
    let hash = 0;
    for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
    return PASTELS[hash % PASTELS.length];
};

const Avatar = ({ name, photo, pastel = false, className = 'h-10 w-10 text-sm' }) => {
    // The photo URL that failed to load; a new photo gets tried again
    const [failedPhoto, setFailedPhoto] = useState(null);

    if (photo && photo !== failedPhoto) {
        return (
            <img
                src={photo}
                alt={name}
                onError={() => setFailedPhoto(photo)}
                className={`${className} shrink-0 rounded-full object-cover`}
            />
        );
    }
    const [bg, text] = pastel ? pastelFor(name) : ['bg-white/15', 'text-ink'];
    return (
        <span className={`${className} flex shrink-0 items-center justify-center rounded-full font-bold ${bg} ${text}`}>
            {getInitials(name)}
        </span>
    );
};

export default Avatar;
