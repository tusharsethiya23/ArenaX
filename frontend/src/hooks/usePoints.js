// usePoints.js
// The logged-in user's Arena Points: total, daily streak, invite code, how to
// earn and recent awards. Shared, and refreshed automatically after actions
// that earn points (see AFFECTS in useSharedResource.js) and after check-in.

import { useAuth } from '../context/AuthContext';
import useSharedResource from './useSharedResource';

const EMPTY = { points: 0, streak: { count: 0, best: 0, activeToday: false }, inviteCode: '', earn: [], history: [] };

const usePoints = () => {
    const { user } = useAuth();
    const { data, loaded, reload } = useSharedResource(user?._id ? '/points/me' : null, { initial: EMPTY, maxAge: 15000 });
    return { ...EMPTY, ...data, loaded, reload };
};

export default usePoints;
