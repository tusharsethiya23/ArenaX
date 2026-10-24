// Register.jsx
// Create a learner or coach account: pick the role first, then sign up with
// Google (one click) or with name, Gmail address and password. Email sign-ups
// then enter the 6-digit code we email, proving the Gmail is real.

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/AuthLayout';
import GoogleSignInButton from '../components/GoogleSignInButton';
import GoogleRolePicker from '../components/GoogleRolePicker';
import OrDivider from '../components/OrDivider';
import PasswordInput from '../components/PasswordInput';
import VerifyEmailStep from '../components/VerifyEmailStep';
import useGoogleAuth from '../hooks/useGoogleAuth';

const GOOGLE_ENABLED = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);
const MIN_PASSWORD = 8;
// Same rule as the backend (Backend/utils/email.util.js)
const GMAIL_RE = /^[a-z0-9](?:[a-z0-9.]{4,28})[a-z0-9](?:\+[a-z0-9._-]{1,30})?@(?:gmail|googlemail)\.com$/;

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'learner',
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
                    <div className="mb-5">
                        <p className="label">Joining as</p>
                        {/* Role picker styled as two chips; used by both Google and the form */}
                        <div className="grid grid-cols-2 gap-2 rounded-full bg-canvas p-1.5" role="radiogroup" aria-label="Joining as">
                            {['learner', 'coach'].map((r) => (
                                <label
                                    key={r}
                                    className={`cursor-pointer rounded-full py-2.5 text-center text-sm font-semibold transition-colors ${
                                        formData.role === r ? 'bg-ink text-white' : 'text-muted hover:text-ink'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="role"
                                        value={r}
                                        checked={formData.role === r}
                                        onChange={handleChange}
                                        className="sr-only"
                                    />
                                    {r === 'learner' ? 'Learner' : 'Coach'}
                                </label>
                            ))}
                        </div>
                    </div>

                    {GOOGLE_ENABLED && (
                        <>
                            <GoogleSignInButton text="signup_with" onCredential={(credential) => google.signIn(credential, formData.role)} />
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
