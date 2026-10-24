// MatchBadge.jsx
// "86% match" pill for a coach's fit with the logged-in athlete. Strong
// matches (75%+) are lime; the number is always written out.

const MatchBadge = ({ score, className = '' }) => (
    <span
        className={`badge shrink-0 ${score >= 75 ? 'bg-lime text-ink' : 'bg-canvas text-ink'} ${className}`}
        title="How well this coach fits your DNA gaps, level, city and schedule"
    >
        {score}% match
    </span>
);

export default MatchBadge;
