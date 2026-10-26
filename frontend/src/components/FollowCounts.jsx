// FollowCounts.jsx
// "12 followers · 3 following" — each number opens the matching list popup.

import { useState } from 'react';
import FollowListModal from './FollowListModal';

const FollowCounts = ({ userId, followers, following, className = '' }) => {
    const [openList, setOpenList] = useState(null); // 'followers' | 'following' | null

    const item = (type, count, label, dot) => (
        <button onClick={() => setOpenList(type)} className="flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink">
            <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
            <span className="font-bold text-ink">{count}</span> {label}
        </button>
    );

    return (
        <>
            <div className={`flex items-center gap-4 ${className}`}>
                {item('followers', followers, followers === 1 ? 'follower' : 'followers', 'bg-accent')}
                {item('following', following, 'following', 'bg-accent')}
            </div>
            {openList && <FollowListModal userId={userId} type={openList} onClose={() => setOpenList(null)} />}
        </>
    );
};

export default FollowCounts;
