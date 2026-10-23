// useMyBookings.js
// Fetches the logged-in user's bookings. Coaches get the requests they
// received; everyone else gets the bookings they made (same endpoints the
// Bookings page uses). Used by the notification bell and the Feed's
// "Upcoming session" card.

import { useState, useEffect, useCallback } from 'react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

const useMyBookings = () => {
    const { user } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [loaded, setLoaded] = useState(false);
    const [version, setVersion] = useState(0); // bump to refetch (e.g. after booking)

    useEffect(() => {
        if (!user) return;
        let cancelled = false;
        const endpoint = user.role === 'coach' ? '/bookings/my-requests' : '/bookings/my-bookings';

        API.get(endpoint)
            .then((res) => !cancelled && setBookings(res.data))
            .catch(() => !cancelled && setBookings([]))
            .finally(() => !cancelled && setLoaded(true));

        return () => { cancelled = true; };
    }, [user, version]);

    const reload = useCallback(() => setVersion((v) => v + 1), []);

    return { bookings, loaded, reload };
};

export default useMyBookings;
