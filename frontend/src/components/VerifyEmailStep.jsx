// VerifyEmailStep.jsx
// "Check your Gmail": enter the 6-digit code we emailed to finish signing up
// or logging in. Resending is allowed once a minute.

import { useState, useEffect } from 'react';
import { MailCheck } from 'lucide-react';
import API from '../api/axios';

const RESEND_SECONDS = 60;

const VerifyEmailStep = ({ email, note, onVerified, onBack }) => {
    const [code, setCode] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [info, setInfo] = useState(note || '');
    const [wait, setWait] = useState(RESEND_SECONDS);

    useEffect(() => {
        if (wait <= 0) return undefined;
        const t = setTimeout(() => setWait(wait - 1), 1000);
        return () => clearTimeout(t);
    }, [wait]);

    const submit = async (e) => {
        e.preventDefault();
        setBusy(true);
        setError('');
        try {
            const res = await API.post('/auth/verify-email', { email, code });
            onVerified(res.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Could not check the code');
            setBusy(false);
        }
    };

    const resend = async () => {
        setError('');
        setInfo('');
        try {
            const res = await API.post('/auth/resend-code', { email });
            setInfo(res.data.message);
            setWait(RESEND_SECONDS);
        } catch (err) {
            setError(err.response?.data?.message || 'Could not send a new code');
        }
    };

    return (
        <form onSubmit={submit}>
            <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-lime"><MailCheck size={22} /></span>
            <p className="text-lg font-bold">Check your Gmail</p>
            <p className="mb-4 text-sm text-muted">
                We sent a 6-digit code to <b className="break-all text-ink">{email}</b>. It expires in 10 minutes.
                Check Spam if you don't see it.
            </p>

            {error && <div className="alert-error mb-3">{error}</div>}
            {info && !error && <div className="alert-success mb-3" role="status">{info}</div>}

            <label className="label" htmlFor="verify-code">Verification code</label>
            <input
                id="verify-code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="123456"
                autoFocus
                required
                className="input text-center text-2xl font-bold tracking-[0.5em]"
            />
            <button type="submit" disabled={busy || code.length !== 6} className="btn btn-dark mt-4 w-full py-3.5">
                {busy ? 'Checking...' : 'Verify and continue'}
            </button>

            <div className="mt-4 flex items-center justify-between text-sm">
                <button type="button" onClick={onBack} className="text-muted hover:text-ink">Back</button>
                <button type="button" onClick={resend} disabled={wait > 0} className="font-semibold text-ink disabled:font-normal disabled:text-muted">
                    {wait > 0 ? `Resend code in ${wait}s` : 'Resend code'}
                </button>
            </div>
        </form>
    );
};

export default VerifyEmailStep;
