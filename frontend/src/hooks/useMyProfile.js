// useMyProfile.js
// The logged-in user's full profile from the backend. The user saved at login
// only has name/email/role, so pages that show or edit sport, location,
// availability etc. need this. Falls back to the saved user while loading.
// Shared, so several components on a page use one request.

import { useAuth } from '../context/AuthContext';
import useSharedResource from './useSharedResource';

const useMyProfile = () => {
    const { user } = useAuth();
    const { data } = useSharedResource(user?._id ? `/users/${user._id}` : null, { initial: null, maxAge: 5000 });
    return { profile: data ? { ...user, ...data } : user, loaded: Boolean(data) };
};

export default useMyProfile;
