// useFollow.js
// Follower/following counts for a user, whether the logged-in user follows
// them, and a toggle to follow/unfollow. The button flips instantly and is
// corrected from the server's answer (or rolled back if the request fails).

import { useState, useEffect, useCallback } from 'react';
import API from '../api/axios';

const useFollow = (userId) => {
    const [stats, setStats] = useState({ followers: 0, following: 0, isFollowing: false });
    const [loaded, setLoaded] = useState(false);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (!userId) return;
        let cancelled = false;
        API.get(`/follows/${userId}/stats`)
            .then((res) => !cancelled && setStats(res.data))
            .catch(() => { /* counts just stay at 0 */ })
            .finally(() => !cancelled && setLoaded(true));
        return () => { cancelled = true; };
    }, [userId]);

    const toggle = useCallback(async () => {
        if (busy) return;
        const previous = stats;
        const nextFollowing = !stats.isFollowing;

        // Optimistic update
        setStats({ ...stats, isFollowing: nextFollowing, followers: stats.followers + (nextFollowing ? 1 : -1) });
        setBusy(true);
        try {
            const res = nextFollowing
                ? await API.post(`/follows/${userId}`)
                : await API.delete(`/follows/${userId}`);
            setStats((s) => ({ ...s, isFollowing: res.data.isFollowing, followers: res.data.followers }));
        } catch (err) {
            setStats(previous);
            alert(err.response?.data?.message || 'Something went wrong');
        }
        setBusy(false);
    }, [busy, stats, userId]);

    return { ...stats, loaded, busy, toggle };
};

export default useFollow;
