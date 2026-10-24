// useFollowRequests.js
// Follow requests waiting for the logged-in user to accept (they only get
// these when their account is private), with accept / decline actions that
// remove the request from the list straight away.
// Several places show requests at once (the bell and the Feed card), so when
// one handles a request it tells the others through a window event, and
// `reload()` refetches (the bell calls it each time it opens).

import { useState, useEffect, useCallback } from 'react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

const HANDLED_EVENT = 'arenax:follow-request-handled';

const useFollowRequests = () => {
    const { user } = useAuth();
    const [requests, setRequests] = useState([]);
    const [busyId, setBusyId] = useState(null);

    const reload = useCallback(() => {
        API.get('/follows/requests').then((res) => setRequests(res.data)).catch(() => {});
    }, []);

    useEffect(() => {
        if (!user?._id) return;
        let cancelled = false;
        API.get('/follows/requests')
            .then((res) => !cancelled && setRequests(res.data))
            .catch(() => {});
        return () => { cancelled = true; };
    }, [user?._id]);

    // Drop requests handled by another component on the page
    useEffect(() => {
        const onHandled = (e) => setRequests((prev) => prev.filter((r) => r.user._id !== e.detail));
        window.addEventListener(HANDLED_EVENT, onHandled);
        return () => window.removeEventListener(HANDLED_EVENT, onHandled);
    }, []);

    const respond = useCallback(async (followerId, accept) => {
        setBusyId(followerId);
        const handled = () => window.dispatchEvent(new CustomEvent(HANDLED_EVENT, { detail: followerId }));
        try {
            await (accept
                ? API.post(`/follows/requests/${followerId}/accept`)
                : API.delete(`/follows/requests/${followerId}`));
            handled();
        } catch (err) {
            // 404 = already handled elsewhere (e.g. in another tab): just drop it
            if (err.response?.status === 404) handled();
            else alert(err.response?.data?.message || 'Something went wrong');
        }
        setBusyId(null);
    }, []);

    return {
        requests,
        busyId,
        reload,
        accept: (id) => respond(id, true),
        decline: (id) => respond(id, false),
    };
};

export default useFollowRequests;
