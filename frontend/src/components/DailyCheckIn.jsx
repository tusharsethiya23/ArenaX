// DailyCheckIn.jsx
// When the app opens (and when the tab comes back after midnight), tells the
// server the user is here today: the first visit of a day continues the
// streak and earns the daily Arena Points, shown in a toast. Renders nothing.

import { useEffect } from 'react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { refreshSharedResource } from '../hooks/useSharedResource';
import { toast } from '../utils/dialogs';

const DailyCheckIn = () => {
    const { user } = useAuth();

    useEffect(() => {
        let lastDay = '';
        const checkIn = () => {
            const today = new Date().toDateString();
            if (today === lastDay) return;
            lastDay = today;
            API.post('/points/checkin')
                .then(({ data }) => {
                    if (data.awarded > 0) {
                        const days = data.streak.count;
                        toast(`+${data.awarded} Arena Points · ${days > 1 ? `${days}-day streak 🔥` : 'streak started 🔥'}`, 'success');
                    }
                    refreshSharedResource('/points/me');
                })
                .catch(() => { lastDay = ''; /* try again next time */ });
        };
        checkIn();
        const onVisible = () => document.visibilityState === 'visible' && checkIn();
        document.addEventListener('visibilitychange', onVisible);
        return () => document.removeEventListener('visibilitychange', onVisible);
    }, [user._id]);

    return null;
};

export default DailyCheckIn;
