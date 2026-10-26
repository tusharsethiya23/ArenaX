// GoogleSignInButton.jsx
// Google's official "Continue with Google" button (Google Identity Services).
// Google's script is loaded the first time the button is shown. When someone
// picks their account, `onCredential` gets an ID token to send to
// POST /api/auth/google. Renders nothing if VITE_GOOGLE_CLIENT_ID isn't set.
// Styled as Google's dark pill ("filled_black") to match the theme, as wide as
// the form (Google allows 200-400px) and re-drawn when the form resizes.

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
        let observer = null;
        loadGoogleScript()
            .then(() => {
                if (cancelled || !boxRef.current) return;
                window.google.accounts.id.initialize({
                    client_id: CLIENT_ID,
                    callback: (response) => callbackRef.current(response.credential),
                    ux_mode: 'popup',
                });
                // Re-draw at the form's width (Google allows 200-400px); skip tiny changes
                let drawnWidth = 0;
                const draw = () => {
                    const box = boxRef.current;
                    if (!box) return;
                    const width = Math.round(Math.min(400, Math.max(200, box.offsetWidth)));
                    if (Math.abs(width - drawnWidth) < 8) return;
                    drawnWidth = width;
                    box.replaceChildren();
                    window.google.accounts.id.renderButton(box, {
                        type: 'standard',
                        theme: 'filled_black',
                        size: 'large',
                        shape: 'pill',
                        text,
                        logo_alignment: 'center',
                        width,
                    });
                };
                draw();
                observer = new ResizeObserver(draw);
                observer.observe(boxRef.current);
            })
            .catch(() => !cancelled && setFailed(true));
        return () => { cancelled = true; observer?.disconnect(); };
    }, [text]);

    if (!CLIENT_ID) return null;
    if (failed) return <p className="text-center text-sm text-muted">Google sign-in couldn't load. Check your connection and refresh.</p>;
    // colorScheme light: the page is dark (color-scheme: dark), which would make the
    // browser paint a white box behind Google's light iframe; this keeps it transparent.
    return <div ref={boxRef} style={{ colorScheme: 'light' }} className="flex min-h-[44px] w-full justify-center overflow-hidden" />;
};

export default GoogleSignInButton;
