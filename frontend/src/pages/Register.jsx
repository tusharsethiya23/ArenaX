// Register.jsx
// Create a learner or coach account: pick the role first, then sign up with
// Google (one click) or with name, Gmail address and password. Email sign-ups
// then enter the 6-digit code we email, proving the Gmail is real.

import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/AuthLayout';
import GoogleSignInButton from '../components/GoogleSignInButton';
import GoogleRolePicker from '../components/GoogleRolePicker';
import OrDivider from '../components/OrDivider';
import PasswordInput from '../components/PasswordInput';
import VerifyEmailStep from '../components/VerifyEmailStep';
import JoinAsPicker from '../components/JoinAsPicker';
import useGoogleAuth from '../hooks/useGoogleAuth';

const GOOGLE_ENABLED = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);
const MIN_PASSWORD = 8;
// Same rule as the backend (Backend/utils/email.util.js)
const GMAIL_RE = /^[a-z0-9](?:[a-z0-9.]{4,28})[a-z0-9](?:\+[a-z0-9._-]{1,30})?@(?:gmail|googlemail)\.com$/;

const Register = () => {
    const [searchParams] = useSearchParams();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: searchParams.get('role') === 'coach' ? 'coach' : 'learner',
    });
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();
    const google = useGoogleAuth({ onError: setError });
    const [verifying, setVerifying] = useState(null); // { email, note } after sign-up

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const email = formData.email.trim().toLowerCase();
        if (!GMAIL_RE.test(email) || email.includes('..')) {
            setError('Please use a valid Gmail address (like yourname@gmail.com)');
            return;
        }
        if (formData.password.length < MIN_PASSWORD) {
            setError(`Password must be at least ${MIN_PASSWORD} characters`);
            return;
        }
        try {
            const res = await API.post('/auth/register', { ...formData, email });
            // Account made but not usable yet: ask for the emailed code
            setVerifying({ email: res.data.email, note: res.data.codeSent ? '' : res.data.message });
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong');
        }
    };

    return (
        <AuthLayout
            title="Join ArenaX"
            subtitle="Find your coach. Track your game."
            footer={
                <p>
                    Already have an account?{' '}
                    <Link to="/login" className="font-semibold text-ink hover:underline">Log in</Link>
                </p>
            }
        >
            {error && <div className="alert-error mb-4">{error}</div>}

            {verifying ? (
                <VerifyEmailStep
                    email={verifying.email}
                    note={verifying.note}
                    onVerified={(userData) => { login(userData); navigate('/'); }}
                    onBack={() => setVerifying(null)}
                />
            ) : google.needsRole ? (
                <GoogleRolePicker onChoose={google.chooseRole} onCancel={google.cancelRole} busy={google.busy} />
            ) : (
                <>
                    {/* Learner / coach sign up here (used by Google and the form); Brand switches to the brand sign-up */}
                    <div className="mb-5">
                        <JoinAsPicker value={formData.role} onChange={(role) => setFormData({ ...formData, role })} />
                    </div>

                    {GOOGLE_ENABLED && (
                        <>
                            <GoogleSignInButton onCredential={(credential) => google.signIn(credential, formData.role)} />
                            <OrDivider />
                        </>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="label" htmlFor="reg-name">Full name</label>
                            <input id="reg-name" type="text" name="name" value={formData.name} onChange={handleChange} required className="input" />
                        </div>

                        <div>
                            <label className="label" htmlFor="reg-email">Gmail address</label>
                            <input id="reg-email" type="email" name="email" value={formData.email} onChange={handleChange} placeholder="yourname@gmail.com" autoComplete="email" required className="input" />
                            <p className="mt-1 text-xs text-muted">We'll email you a code to confirm it's yours.</p>
                        </div>

                        <div>
                            <label className="label" htmlFor="reg-password">Password</label>
                            <PasswordInput id="reg-password" name="password" value={formData.password} onChange={handleChange} minLength={MIN_PASSWORD} autoComplete="new-password" required />
                            <p className="mt-1 text-xs text-muted">At least {MIN_PASSWORD} characters.</p>
                        </div>

                        <button type="submit" className="btn btn-dark mt-2 w-full py-3.5">
                            Create {formData.role === 'coach' ? 'coach' : 'learner'} account
                        </button>
                    </form>
                </>
            )}
        </AuthLayout>
    );
};

export default Register;
