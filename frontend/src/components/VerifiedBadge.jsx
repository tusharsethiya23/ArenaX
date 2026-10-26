// VerifiedBadge.jsx
// Rosette with a tick next to verified people. Coaches earn it automatically
// (10+ completed sessions, average rating 4.5 or above); athletes get it with
// a verified portfolio achievement. The server decides (`verified`).

import { BadgeCheck } from 'lucide-react';

const VerifiedBadge = ({ size = 18 }) => (
    <span title="Verified. Coaches: 10+ completed sessions rated 4.5★ or higher. Athletes: a verified achievement." className="inline-flex shrink-0">
        <BadgeCheck size={size} className="fill-highlight text-on-ink" aria-label="Verified" />
    </span>
);

export default VerifiedBadge;
