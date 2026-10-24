// Login.jsx
// "Continue with Google" or email/password login. Brand-new Google users are
// asked whether they're a learner or a coach before their account is made;
// accounts whose Gmail isn't verified yet are asked for the emailed code.

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

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const google = useGoogleAuth({ onError: setError });
  const [verifying, setVerifying] = useState(null); // { email, note } while waiting for the emailed code

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await API.post('/auth/login', formData);
      login(res.data);
      navigate('/');
    } catch (err) {
      const data = err.response?.data;
      // Email not verified yet: we've emailed a code, ask for it
      if (data?.code === 'EMAIL_NOT_VERIFIED') setVerifying({ email: data.email, note: data.message.includes('(') ? data.message : '' });
      else setError(data?.message || 'Something went wrong');
    }
  };

  const finishVerified = (userData) => {
    login(userData);
    navigate('/');
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to your ArenaX account"
      footer={
        <>
          <p>
            New to ArenaX?{' '}
            <Link to="/register" className="font-semibold text-ink hover:underline">Create an account</Link>
          </p>
          <p>
            Are you a brand?{' '}
            <Link to="/brand/login" className="font-semibold text-ink hover:underline">Log in here</Link>
          </p>
        </>
      }
    >
      {error && <div className="alert-error mb-4">{error}</div>}

      {verifying ? (
        <VerifyEmailStep email={verifying.email} note={verifying.note} onVerified={finishVerified} onBack={() => setVerifying(null)} />
      ) : google.needsRole ? (
        <GoogleRolePicker onChoose={google.chooseRole} onCancel={google.cancelRole} busy={google.busy} />
      ) : (
        <>
          {GOOGLE_ENABLED && (
            <>
              <GoogleSignInButton onCredential={(credential) => google.signIn(credential)} />
              <OrDivider />
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label" htmlFor="login-email">Email</label>
              <input id="login-email" type="email" name="email" value={formData.email} onChange={handleChange} autoComplete="email" required className="input" />
            </div>

            <div>
              <label className="label" htmlFor="login-password">Password</label>
              <PasswordInput id="login-password" name="password" value={formData.password} onChange={handleChange} autoComplete="current-password" required />
            </div>

            <button type="submit" className="btn btn-dark mt-2 w-full py-3.5">
              Log in
            </button>
          </form>
        </>
      )}
    </AuthLayout>
  );
};

export default Login;
