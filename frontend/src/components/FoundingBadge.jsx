// FoundingBadge.jsx
// Small "Founding member" badge for everyone who joined during the launch
// period (user.foundingMember). `compact` shows just the icon (post headers on
// phones), with the full text as a tooltip and for screen readers.

import { Sparkles } from 'lucide-react';

const FoundingBadge = ({ compact = false, className = '' }) => (
    <span
        title="Founding member: joined ArenaX at launch"
        aria-label="Founding member"
        className={`inline-flex shrink-0 items-center gap-1 rounded-full bg-highlight/15 font-semibold text-highlight ${compact ? 'h-5 w-5 justify-center' : 'px-2 py-0.5 text-[10px] uppercase tracking-wider'} ${className}`}
    >
        <Sparkles size={compact ? 11 : 10} strokeWidth={2.4} />
        {!compact && 'Founding member'}
    </span>
);

export default FoundingBadge;
