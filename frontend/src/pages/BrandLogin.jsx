// BrandLogin.jsx
// Login (/brand/login) and sign-up (/brand/register) for Brand accounts.
// Brands have their own endpoints (/brands/login and /brands/register),
// separate from regular users. Sign-up shows the same "Joining as" choice as
// /register, so people can switch to learner or coach.

import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import API from '../api/axios';
import { useBrandAuth } from '../context/BrandAuthContext';
import AuthLayout from '../components/AuthLayout';
import PasswordInput from '../components/PasswordInput';
import JoinAsPicker from '../components/JoinAsPicker';

const BrandLogin = () => {
  const isRegistering = useLocation().pathname === '/brand/register';
  const [formData, setFormData] = useState({
    companyName: '',
    email: '',
    password: '',
    industry: '',
    website: '',
  });
  const [error, setError] = useState('');
  const { brandLogin } = useBrandAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      // Same form, two different endpoints depending on the mode
      const endpoint = isRegistering ? '/brands/register' : '/brands/login';
      const res = await API.post(endpoint, formData);
      brandLogin(res.data);
      navigate('/brand/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    }
  };

  return (
    <AuthLayout
      title={isRegistering ? 'Register your brand' : 'Brand login'}
      subtitle="Discover and sponsor verified athletic talent"
      footer={
        <>
          <p>
            {isRegistering ? 'Already have a brand account?' : 'New brand?'}{' '}
            <Link to={isRegistering ? '/brand/login' : '/brand/register'} className="font-semibold text-ink hover:underline">
              {isRegistering ? 'Log in' : 'Register here'}
            </Link>
          </p>
          {!isRegistering && (
            <p>
              Not a brand?{' '}
              <Link to="/login" className="font-semibold text-ink hover:underline">Go to regular login</Link>
            </p>
          )}
        </>
      }
    >
      {error && <div className="alert-error mb-4">{error}</div>}

      {isRegistering && <div className="mb-5"><JoinAsPicker value="brand" /></div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        {isRegistering && (
          <div>
            <label className="label" htmlFor="brand-company">Company name</label>
            <input id="brand-company" type="text" name="companyName" value={formData.companyName} onChange={handleChange} required className="input" />
          </div>
        )}

        <div>
          <label className="label" htmlFor="brand-email">{isRegistering ? 'Work email' : 'Email'}</label>
          <input id="brand-email" type="email" name="email" value={formData.email} onChange={handleChange} autoComplete="email" required className="input" />
        </div>

        <div>
          <label className="label" htmlFor="brand-password">Password</label>
          <PasswordInput id="brand-password" name="password" value={formData.password} onChange={handleChange} autoComplete={isRegistering ? 'new-password' : 'current-password'} required />
        </div>

        {isRegistering && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="brand-industry">Industry</label>
              <input id="brand-industry" type="text" name="industry" value={formData.industry} onChange={handleChange} className="input" />
            </div>
            <div>
              <label className="label" htmlFor="brand-website">Website</label>
              <input id="brand-website" type="text" name="website" value={formData.website} onChange={handleChange} className="input" />
            </div>
          </div>
        )}

        <button type="submit" className="btn btn-dark mt-2 w-full py-3.5">
          {isRegistering ? 'Create brand account' : 'Log in'}
        </button>
      </form>
    </AuthLayout>
  );
};

export default BrandLogin;
