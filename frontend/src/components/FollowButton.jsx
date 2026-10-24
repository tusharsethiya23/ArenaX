// FollowButton.jsx
// Black "Follow" button; once following it becomes a grey "Following" pill
// that turns into a red "Unfollow" on hover, so unfollowing is never a surprise.
// For private accounts it shows "Requested" until they accept; tapping it
// cancels the request.
// Right after clicking Follow the mouse is still on the button, so the
// hover-to-Unfollow look only switches on once the mouse has left it.

import { useState } from 'react';
import { UserPlus, UserCheck, UserMinus, Clock } from 'lucide-react';

const FollowButton = ({ isFollowing, requested, onClick, disabled, className = '' }) => {
    const [justFollowed, setJustFollowed] = useState(false);

    if (requested) {
        return (
            <button onClick={onClick} disabled={disabled} aria-label="Cancel follow request" title="Waiting for them to accept. Tap to cancel." className={`btn btn-soft min-w-[132px] ${className}`}>
                <Clock size={16} /> Requested
            </button>
        );
    }

    if (!isFollowing) {
        return (
            <button
                onClick={() => { setJustFollowed(true); onClick(); }}
                disabled={disabled}
                className={`btn btn-dark min-w-[132px] ${className}`}
            >
                <UserPlus size={16} /> Follow
            </button>
        );
    }

    // `group` (and so the hover styles) is only active once the mouse has left after following
    const hoverable = !justFollowed;
    return (
        <button
            onClick={onClick}
            onMouseLeave={() => setJustFollowed(false)}
            disabled={disabled}
            aria-label="Unfollow"
            className={`btn btn-soft min-w-[132px] ${hoverable ? 'group hover:bg-danger/10 hover:text-danger' : ''} ${className}`}
        >
            <span className="flex items-center gap-2 group-hover:hidden"><UserCheck size={16} /> Following</span>
            <span className="hidden items-center gap-2 group-hover:flex"><UserMinus size={16} /> Unfollow</span>
        </button>
    );
};

export default FollowButton;
