// format.js
// Small display helpers shared across components.

// 2400 -> "2.4k", 950 -> "950"
export const compact = (n = 0) =>
    n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k` : String(n);

// "just now", "5m ago", "3h ago", "2d ago", then a date for anything older than a week
export const timeAgo = (dateString) => {
    const seconds = Math.floor((Date.now() - new Date(dateString)) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateString).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
};

// "Virat Kohli" -> "Virat"
export const firstName = (name = '') => name.trim().split(/\s+/)[0] || name;
