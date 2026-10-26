// useSharedResource.js
// One copy of a piece of server data (e.g. "my bookings") shared by every
// component that shows it. The first component to ask fetches it; the
// others get the same request and the same result instead of fetching again.
// Data younger than `maxAge` is reused when another component mounts; a
// reload() from any component refetches and updates all of them.
//
//   const { data, loaded, reload, setData } = useSharedResource('/bookings/my-bookings', { initial: [] });
//
// `url` doubles as the cache key. Pass null to skip (e.g. not logged in).

import { useEffect, useCallback, useSyncExternalStore } from 'react';
import API from '../api/axios';

const store = new Map(); // url -> { state: { data, loaded }, promise, fetchedAt, listeners }

const entryFor = (url, initial) => {
    if (!store.has(url)) store.set(url, { state: { data: initial, loaded: false }, promise: null, fetchedAt: 0, listeners: new Set() });
    return store.get(url);
};

const publish = (entry, state) => {
    entry.state = state;
    entry.listeners.forEach((l) => l());
};

const load = (url, entry) => {
    entry.promise ||= API.get(url)
        .then((res) => publish(entry, { data: res.data, loaded: true }))
        .catch(() => publish(entry, { ...entry.state, loaded: true }))
        .finally(() => { entry.fetchedAt = Date.now(); entry.promise = null; });
    return entry.promise;
};

// Forget everything (e.g. on logout), so the next user starts fresh
export const clearSharedResources = () => store.clear();

// Mark one shared URL stale and refetch it if it's on screen (e.g. when a
// Socket.io event says it changed)
export const refreshSharedResource = (url) => {
    const entry = store.get(url);
    if (!entry) return;
    entry.fetchedAt = 0;
    if (entry.listeners.size) load(url, entry);
};

// After a successful change on the server, refresh the shared data it can
// affect (anywhere on screen, without each page having to remember to).
// Keys: the start of the changed API path; values: which shared URLs to refresh.
const AFFECTS = [
    [/^\/(bookings|reviews)\b/, /^\/bookings\//],
    [/^\/users\/profile\b/, /^\/users\/[0-9a-f]{24}$/],
    [/^\/waitlist\b/, /^\/waitlist\/me$/],
    [/^\/follows\b/, /^\/follows\/requests$/],
    [/^\/dm\b/, /^\/dm$/],
    // Actions that earn (or take back) Arena Points
    [/^\/(posts|bookings|reviews|dna)\b/, /^\/points\/me$/],
];

API.interceptors.response.use((res) => {
    const method = (res.config.method || 'get').toLowerCase();
    if (method !== 'get') {
        const path = String(res.config.url || '').replace(/^https?:\/\/[^/]+/, '').replace(/^\/api/, '');
        for (const [changed, refresh] of AFFECTS) {
            if (!changed.test(path)) continue;
            for (const [url, entry] of store) {
                if (!refresh.test(url)) continue;
                entry.fetchedAt = 0; // stale for the next component that mounts
                if (entry.listeners.size) load(url, entry); // and refresh what's on screen now
            }
        }
    }
    return res;
});

const EMPTY = { data: undefined, loaded: false };

const useSharedResource = (url, { initial, maxAge = 30000 } = {}) => {
    const entry = url ? entryFor(url, initial) : null;

    const state = useSyncExternalStore(
        useCallback((onChange) => {
            if (!entry) return () => {};
            entry.listeners.add(onChange);
            return () => entry.listeners.delete(onChange);
        }, [entry]),
        () => (entry ? entry.state : EMPTY),
    );

    useEffect(() => {
        if (entry && Date.now() - entry.fetchedAt > maxAge) load(url, entry);
    }, [url, entry, maxAge]);

    const reload = useCallback(() => (entry ? load(url, entry) : Promise.resolve()), [url, entry]);

    // Change the shared copy locally (e.g. drop a handled request) without refetching
    const setData = useCallback((update) => {
        if (entry) publish(entry, { ...entry.state, data: typeof update === 'function' ? update(entry.state.data) : update });
    }, [entry]);

    return { data: state.data ?? initial, loaded: state.loaded, reload, setData };
};

export default useSharedResource;
