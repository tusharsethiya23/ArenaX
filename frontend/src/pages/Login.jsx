// Login.jsx
// Standard email/password login.

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/AuthLayout';

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

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Email</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} required className="input" />
        </div>

        <div>
          <label className="label">Password</label>
          <input type="password" name="password" value={formData.password} onChange={handleChange} required className="input" />
        </div>

        <button type="submit" className="btn btn-dark mt-2 w-full py-3.5">
          Log in
        </button>
      </form>
    </AuthLayout>
  );
};

export default Login;
