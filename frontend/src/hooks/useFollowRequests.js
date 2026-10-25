// useFollowRequests.js
// Follow requests waiting for the logged-in user to accept (they only get
// these when their account is private), with accept / decline actions that
// remove the request from the list straight away.
// Shared: the bell and the Feed card use one request and one list, so a
// request handled in one disappears from both. `reload()` refetches (the
// bell calls it each time it opens).

import { useState, useCallback } from 'react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import useSharedResource from './useSharedResource';
import { toastError } from '../utils/dialogs';

const useFollowRequests = () => {
    const { user } = useAuth();
    const { data: requests, reload, setData } = useSharedResource(user?._id ? '/follows/requests' : null, { initial: [], maxAge: 5000 });
    const [busyId, setBusyId] = useState(null);

    const respond = useCallback(async (followerId, accept) => {
        setBusyId(followerId);
        const handled = () => {
            setData((prev) => (prev || []).filter((r) => r.user._id !== followerId));
            // Follower counts (useFollow) refresh on this
            window.dispatchEvent(new CustomEvent('arenax:follow-request-handled', { detail: followerId }));
        };
        try {
            await (accept
                ? API.post(`/follows/requests/${followerId}/accept`)
                : API.delete(`/follows/requests/${followerId}`));
            handled();
        } catch (err) {
            // 404 = already handled elsewhere (e.g. in another tab): just drop it
            if (err.response?.status === 404) handled();
            else toastError(err);
        }
        setBusyId(null);
    }, [setData]);

    return {
        requests,
        busyId,
        reload,
        accept: (id) => respond(id, true),
        decline: (id) => respond(id, false),
    };
};

export default useFollowRequests;
