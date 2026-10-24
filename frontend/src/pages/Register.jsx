// Register.jsx
// Create a learner or coach account: pick the role first, then sign up with
// Google (one click) or with name, email and password.

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/AuthLayout';
import GoogleSignInButton from '../components/GoogleSignInButton';
import GoogleRolePicker from '../components/GoogleRolePicker';
import OrDivider from '../components/OrDivider';
import useGoogleAuth from '../hooks/useGoogleAuth';

const GOOGLE_ENABLED = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

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

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const res = await API.post('/auth/register', formData);
            login(res.data);
            navigate('/');
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

            {google.needsRole ? (
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
                            <label className="label" htmlFor="reg-email">Email</label>
                            <input id="reg-email" type="email" name="email" value={formData.email} onChange={handleChange} required className="input" />
                        </div>

                        <div>
                            <label className="label" htmlFor="reg-password">Password</label>
                            <input id="reg-password" type="password" name="password" value={formData.password} onChange={handleChange} required className="input" />
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
