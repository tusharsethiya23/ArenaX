// VerifiedBadge.jsx
// Black rosette with a lime tick, shown next to coaches who have at least
// one verified achievement.

import { BadgeCheck } from 'lucide-react';

const VerifiedBadge = ({ size = 18 }) => (
    <span title="Verified coach: has a verified achievement" className="inline-flex shrink-0">
        <BadgeCheck size={size} className="fill-lime text-on-ink" aria-label="Verified" />
    </span>
);

export default VerifiedBadge;
