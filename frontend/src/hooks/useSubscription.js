// useSubscription.js
// Whether the logged-in user has an active plan (Coach Pro / Learner Premium).
// Used for the "PRO" badge in the avatar menu and the Subscribe button on profiles.

import { useState, useEffect } from 'react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

const useSubscription = () => {
    const { user } = useAuth();
    const [isActive, setIsActive] = useState(false);

    useEffect(() => {
        if (!user) return;
        let cancelled = false;
        API.get('/subscriptions/my-subscription')
            .then((res) => !cancelled && setIsActive(Boolean(res.data.active)))
            .catch(() => !cancelled && setIsActive(false));
        return () => { cancelled = true; };
    }, [user]);

    return isActive;
};

export default useSubscription;
