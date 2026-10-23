// useFollowingIds.js
// The set of user ids the logged-in user follows, plus a toggle that
// follows/unfollows (optimistically, rolled back on error). Lets many Follow
// buttons on one page (posts, suggestions) share one source of truth.

import { useState, useEffect, useCallback } from 'react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

const useFollowingIds = () => {
    const { user } = useAuth();
    const [ids, setIds] = useState(() => new Set());

    useEffect(() => {
        if (!user?._id) return;
        let cancelled = false;
        API.get(`/follows/${user._id}/following`)
            .then((res) => !cancelled && setIds(new Set(res.data.map((f) => f.user._id))))
            .catch(() => {});
        return () => { cancelled = true; };
    }, [user?._id]);

    const toggle = useCallback(async (userId) => {
        const wasFollowing = ids.has(userId);
        const apply = (follow) => setIds((prev) => {
            const next = new Set(prev);
            if (follow) next.add(userId); else next.delete(userId);
            return next;
        });
        apply(!wasFollowing);
        try {
            await (wasFollowing ? API.delete(`/follows/${userId}`) : API.post(`/follows/${userId}`));
        } catch (err) {
            apply(wasFollowing);
            alert(err.response?.data?.message || 'Something went wrong');
        }
    }, [ids]);

    return { followingIds: ids, toggleFollow: toggle };
};

export default useFollowingIds;
