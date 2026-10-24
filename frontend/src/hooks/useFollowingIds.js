// useFollowingIds.js
// Who the logged-in user follows and who they've sent follow requests to
// (private accounts), shared by every Follow button on a page.
//   followState(id) -> 'following' | 'requested' | 'none'
//   toggleFollow(id) -> follow / send request, or unfollow / cancel request
// Updates instantly and is corrected from the server's answer (or rolled back).

import { useState, useEffect, useCallback } from 'react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

const useFollowingIds = () => {
    const { user } = useAuth();
    const [states, setStates] = useState(() => new Map()); // id -> 'following' | 'requested'

    useEffect(() => {
        if (!user?._id) return;
        let cancelled = false;
        API.get('/follows/me/outgoing')
            .then((res) => {
                if (cancelled) return;
                const map = new Map();
                res.data.following.forEach((id) => map.set(id, 'following'));
                res.data.requested.forEach((id) => map.set(id, 'requested'));
                setStates(map);
            })
            .catch(() => {});
        return () => { cancelled = true; };
    }, [user?._id]);

    const followState = useCallback((id) => states.get(id) || 'none', [states]);

    const set = (id, state) => setStates((prev) => {
        const next = new Map(prev);
        if (state === 'none') next.delete(id); else next.set(id, state);
        return next;
    });

    const toggleFollow = useCallback(async (id) => {
        const before = states.get(id) || 'none';
        // Following or requested -> remove; otherwise follow (server decides follow vs request)
        set(id, before === 'none' ? 'following' : 'none');
        try {
            const res = before === 'none' ? await API.post(`/follows/${id}`) : await API.delete(`/follows/${id}`);
            set(id, res.data.isFollowing ? 'following' : res.data.requested ? 'requested' : 'none');
        } catch (err) {
            set(id, before);
            alert(err.response?.data?.message || 'Something went wrong');
        }
    }, [states]);

    return { followState, toggleFollow };
};

export default useFollowingIds;
