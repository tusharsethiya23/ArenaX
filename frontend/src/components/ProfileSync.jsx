// ProfileSync.jsx
// Keeps the user saved at login (navbar avatar, post composer, comments...)
// in step with the profile on the server. Without it, a photo or name
// changed on another device, or before this fix, would show differently in
// the navbar than in the feed sidebar. Renders nothing.

import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import useMyProfile from '../hooks/useMyProfile';

// plan: what the app shows (utils/access.js); foundingMember / verified: badges
const SYNCED = ['name', 'profilePhoto', 'role', 'plan', 'foundingMember', 'verified'];

const ProfileSync = () => {
    const { user, updateUser } = useAuth();
    const { profile, loaded } = useMyProfile();

    useEffect(() => {
        if (!loaded || !user) return;
        const changed = Object.fromEntries(SYNCED.filter((k) => profile[k] !== undefined && profile[k] !== user[k]).map((k) => [k, profile[k]]));
        if (Object.keys(changed).length) updateUser(changed);
    }, [loaded, profile, user, updateUser]);

    return null;
};

export default ProfileSync;
