// useGoogleAuth.js
// Sends the credential from "Continue with Google" to the backend and logs
// the user in. Brand-new Google users must choose learner or coach first: the
// backend answers ROLE_REQUIRED, `needsRole` becomes true, and the page asks;
// `chooseRole` then sends the same credential again with the role.

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

const useGoogleAuth = ({ onError }) => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [pendingCredential, setPendingCredential] = useState(null);
    const [busy, setBusy] = useState(false);

    const signIn = async (credential, role) => {
        setBusy(true);
        onError('');
        try {
            const res = await API.post('/auth/google', { credential, ...(role && { role }) });
            login(res.data);
            navigate('/');
        } catch (err) {
            if (err.response?.data?.code === 'ROLE_REQUIRED') {
                setPendingCredential(credential);
            } else {
                setPendingCredential(null);
                onError(err.response?.data?.message || 'Google sign-in failed. Please try again.');
            }
        }
        setBusy(false);
    };

    return {
        signIn,
        busy,
        needsRole: Boolean(pendingCredential),
        chooseRole: (role) => signIn(pendingCredential, role),
        cancelRole: () => setPendingCredential(null),
    };
};

export default useGoogleAuth;
