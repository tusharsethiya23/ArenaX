// VerificationStatus.jsx
// The status pill on an achievement: verified (by whom), waiting (with whom),
// declined (with the coach's note), or not verified. Icon + words, never colour alone.

import { BadgeCheck, Hourglass, XCircle, Circle } from 'lucide-react';

const VerificationStatus = ({ achievement: a }) => {
    if (a.status === 'verified') {
        return (
            <span className="badge gap-1 bg-data-mint/15 text-data-mint">
                <BadgeCheck size={13} /> Verified by {a.verifiedBy?.name || 'ArenaX team'}
            </span>
        );
    }
    if (a.status === 'pending') {
        return (
            <span className="badge gap-1 bg-accent/15 text-accent">
                <Hourglass size={13} /> Waiting for {a.requestedFrom?.name || 'ArenaX team'}
            </span>
        );
    }
    if (a.status === 'rejected') {
        return (
            <span className="badge gap-1 bg-danger/10 text-danger" title={a.reviewNote}>
                <XCircle size={13} /> Declined
            </span>
        );
    }
    return (
        <span className="badge gap-1 bg-canvas text-muted">
            <Circle size={11} /> Not verified
        </span>
    );
};

export default VerificationStatus;
