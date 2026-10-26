// invite.js
// Invite links look like /register?ref=AB12CD34. The code is remembered in
// this browser, so it still counts if the person moves between pages or signs
// up with Google, and is sent with the sign-up (the inviter earns Arena Points
// once the new account is verified). Cleared after logging in.

const KEY = 'arenax:inviteCode';
const VALID = /^[A-Za-z0-9]{8}$/;

// Saves ?ref=... from the current address, if there is one
export const rememberInvite = (searchParams) => {
    const code = searchParams.get('ref');
    if (code && VALID.test(code)) {
        try { localStorage.setItem(KEY, code.toUpperCase()); } catch { /* storage blocked: no invite */ }
    }
};

export const savedInvite = () => {
    try {
        const code = localStorage.getItem(KEY);
        return code && VALID.test(code) ? code : undefined;
    } catch {
        return undefined;
    }
};

export const clearInvite = () => {
    try { localStorage.removeItem(KEY); } catch { /* nothing saved */ }
};
