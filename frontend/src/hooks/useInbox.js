// useInbox.js
// The logged-in user's direct-message conversations (newest first), each with
// the other person, the latest message and how many are unread. Shared, and
// refreshed by RealtimeConnection whenever a message arrives.

import useSharedResource from './useSharedResource';

const useInbox = () => {
    const { data, loaded, reload } = useSharedResource('/dm', { initial: [], maxAge: 15000 });
    const unread = data.reduce((sum, c) => sum + c.unread, 0);
    return { conversations: data, unread, loaded, reload };
};

export default useInbox;
