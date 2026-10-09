// Login.jsx
// Standard email/password login.

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await API.post('/auth/login', formData);
      login(res.data);
      navigate('/discover');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 border-l-4 border-signal pl-4">
          <h1 className="font-display text-3xl text-ink">WELCOME BACK</h1>
          <p className="text-stone mt-1 text-sm">Log in to your ArenaX account</p>
        </div>

        {error && (
          <div className="mb-4 border border-signal/30 bg-signal/5 text-signal px-4 py-2 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full border border-ink/15 bg-white px-3 py-2.5 text-ink focus:outline-none focus:border-signal transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone mb-1">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full border border-ink/15 bg-white px-3 py-2.5 text-ink focus:outline-none focus:border-signal transition-colors"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-signal text-white font-semibold py-3 mt-2 hover:bg-signal/90 transition-colors"
          >
            Log in
          </button>
        </form>

        <Link to="/brand/login" className="block text-xs text-stone mt-3 hover:underline">
          Are you a brand? Log in here
        </Link>

        <p className="text-sm text-stone mt-6">
          New to ArenaX?{' '}
          <Link to="/register" className="text-teal font-medium hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;