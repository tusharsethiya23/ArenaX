// useMyProfile.js
// The logged-in user's full profile from the backend. The user saved at login
// only has name/email/role, so pages that show or edit sport, location,
// availability etc. need this. Falls back to the saved user while loading.

import { useState, useEffect } from 'react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

const useMyProfile = () => {
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);

    useEffect(() => {
        if (!user?._id) return;
        let cancelled = false;
        API.get(`/users/${user._id}`)
            .then((res) => !cancelled && setProfile(res.data))
            .catch(() => { /* keep using the saved user */ });
        return () => { cancelled = true; };
    }, [user]);

    return { profile: profile ? { ...user, ...profile } : user, loaded: Boolean(profile) };
};

export default useMyProfile;
