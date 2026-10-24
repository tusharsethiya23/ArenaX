// useFollow.js
// One user's follower/following counts and where the logged-in user stands
// with them: following, requested (they're private and haven't accepted yet),
// or neither. `toggle` follows / sends a request, or unfollows / cancels it.
// The button flips instantly and is corrected from the server's answer
// (or rolled back if the request fails).

import { useState, useEffect, useCallback } from 'react';
import API from '../api/axios';

const useFollow = (userId) => {
    const [stats, setStats] = useState({ followers: 0, following: 0, isFollowing: false, requested: false, isPrivate: false });
    const [loaded, setLoaded] = useState(false);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (!userId) return;
        let cancelled = false;
        const load = () => API.get(`/follows/${userId}/stats`)
            .then((res) => !cancelled && setStats(res.data))
            .catch(() => { /* counts just stay at 0 */ })
            .finally(() => !cancelled && setLoaded(true));
        load();
        // Accepting/declining a follow request (see useFollowRequests) changes counts
        window.addEventListener('arenax:follow-request-handled', load);
        return () => {
            cancelled = true;
            window.removeEventListener('arenax:follow-request-handled', load);
        };
    }, [userId]);

    const toggle = useCallback(async () => {
        if (busy) return;
        const previous = stats;
        const removing = stats.isFollowing || stats.requested;

        // Optimistic: private accounts get a request, public ones a follow
        setStats({
            ...stats,
            isFollowing: !removing && !stats.isPrivate,
            requested: !removing && stats.isPrivate,
            followers: stats.followers + (removing ? (stats.isFollowing ? -1 : 0) : (stats.isPrivate ? 0 : 1)),
        });
        setBusy(true);
        try {
            const res = removing ? await API.delete(`/follows/${userId}`) : await API.post(`/follows/${userId}`);
            setStats((s) => ({ ...s, isFollowing: res.data.isFollowing, requested: res.data.requested, followers: res.data.followers }));
        } catch (err) {
            setStats(previous);
            alert(err.response?.data?.message || 'Something went wrong');
        }
        setBusy(false);
    }, [busy, stats, userId]);

    return { ...stats, loaded, busy, toggle };
};

export default useFollow;
