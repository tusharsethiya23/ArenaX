// GoogleSignInButton.jsx
// Google's official "Continue with Google" button (Google Identity Services).
// Google's script is loaded the first time the button is shown. When someone
// picks their account, `onCredential` gets an ID token to send to
// POST /api/auth/google. Renders nothing if VITE_GOOGLE_CLIENT_ID isn't set.

import { useEffect, useRef, useState } from 'react';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const SCRIPT_URL = 'https://accounts.google.com/gsi/client';

let scriptPromise = null;
const loadGoogleScript = () => {
    if (window.google?.accounts?.id) return Promise.resolve();
    scriptPromise ||= new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = SCRIPT_URL;
        script.async = true;
        script.onload = resolve;
        script.onerror = () => { scriptPromise = null; reject(new Error('Could not load Google sign-in')); };
        document.head.appendChild(script);
    });
    return scriptPromise;
};

// text: 'continue_with' | 'signup_with' | 'signin_with'
const GoogleSignInButton = ({ onCredential, text = 'continue_with' }) => {
    const boxRef = useRef(null);
    const callbackRef = useRef(onCredential);
    const [failed, setFailed] = useState(false);

    // Always call the latest handler (the role on the Register page can change)
    useEffect(() => { callbackRef.current = onCredential; }, [onCredential]);

    useEffect(() => {
        if (!CLIENT_ID) return;
        let cancelled = false;
        loadGoogleScript()
            .then(() => {
                if (cancelled || !boxRef.current) return;
                window.google.accounts.id.initialize({
                    client_id: CLIENT_ID,
                    callback: (response) => callbackRef.current(response.credential),
                    ux_mode: 'popup',
                });
                window.google.accounts.id.renderButton(boxRef.current, {
                    type: 'standard',
                    theme: 'outline',
                    size: 'large',
                    shape: 'pill',
                    text,
                    logo_alignment: 'center',
                    width: Math.min(400, Math.max(200, boxRef.current.offsetWidth)),
                });
            })
            .catch(() => !cancelled && setFailed(true));
        return () => { cancelled = true; };
    }, [text]);

    if (!CLIENT_ID) return null;
    if (failed) return <p className="text-center text-sm text-muted">Google sign-in couldn't load. Check your connection and refresh.</p>;
    return <div ref={boxRef} className="flex min-h-[44px] w-full justify-center" />;
};

export default GoogleSignInButton;
