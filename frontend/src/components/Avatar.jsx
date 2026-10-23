// Avatar.jsx
// Round profile picture. Falls back to the person's initials on lime when
// they haven't uploaded a photo. Used everywhere a person is shown.

// "Virat Kohli" -> "VK", "Madonna" -> "M"
const getInitials = (name = '') =>
    name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || '?';

const Avatar = ({ name, photo, className = 'h-10 w-10 text-sm' }) =>
    photo ? (
        <img src={photo} alt={name} className={`${className} shrink-0 rounded-full object-cover`} />
    ) : (
        <span className={`${className} flex shrink-0 items-center justify-center rounded-full bg-lime font-bold text-ink`}>
            {getInitials(name)}
        </span>
    );

export default Avatar;
