// Login.jsx
// "Continue with Google" or email/password login. Brand-new Google users are
// asked whether they're a learner or a coach before their account is made.

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

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
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
      const res = await API.post('/auth/login', formData);
      login(res.data);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    }
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

      {google.needsRole ? (
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
              <input id="login-email" type="email" name="email" value={formData.email} onChange={handleChange} required className="input" />
            </div>

            <div>
              <label className="label" htmlFor="login-password">Password</label>
              <input id="login-password" type="password" name="password" value={formData.password} onChange={handleChange} required className="input" />
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
