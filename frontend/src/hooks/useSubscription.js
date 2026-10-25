// useSubscription.js
// Whether the logged-in user has an active plan (Coach Pro / Learner Premium).
// Used for the "PRO" badge in the avatar menu and the promo card on Discover
// (shared, so they use one request).

import { useAuth } from '../context/AuthContext';
import useSharedResource from './useSharedResource';

const useSubscription = () => {
    const { user } = useAuth();
    const { data } = useSharedResource(user?._id ? '/subscriptions/my-subscription' : null, { initial: null, maxAge: 5000 });
    return Boolean(data?.active);
};

export default useSubscription;
