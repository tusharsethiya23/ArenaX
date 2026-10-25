// useMyBookings.js
// The logged-in user's bookings. Coaches get the requests they received;
// everyone else gets the bookings they made. Shared: the Feed, the bell,
// the upcoming-session card and the Calendar use one request between them,
// and reload() from any of them refreshes all.

import { useAuth } from '../context/AuthContext';
import useSharedResource from './useSharedResource';

const useMyBookings = () => {
    const { user } = useAuth();
    const url = user?._id ? (user.role === 'coach' ? '/bookings/my-requests' : '/bookings/my-bookings') : null;
    const { data, loaded, reload } = useSharedResource(url, { initial: [], maxAge: 5000 });
    return { bookings: data, loaded, reload };
};

export default useMyBookings;
