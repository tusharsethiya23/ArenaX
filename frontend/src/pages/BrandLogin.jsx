// BrandLogin.jsx
// Combined login + register page for Brand accounts. Brands have their own
// endpoints (/brands/login and /brands/register), separate from regular users.

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api/axios';
import { useBrandAuth } from '../context/BrandAuthContext';
import AuthLayout from '../components/AuthLayout';
import PasswordInput from '../components/PasswordInput';

const BrandLogin = () => {
  const [isRegistering, setIsRegistering] = useState(false);
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
            <button
              type="button"
              onClick={() => setIsRegistering(!isRegistering)}
              className="font-semibold text-ink hover:underline"
            >
              {isRegistering ? 'Log in' : 'Register here'}
            </button>
          </p>
          <p>
            Not a brand?{' '}
            <Link to="/login" className="font-semibold text-ink hover:underline">Go to regular login</Link>
          </p>
        </>
      }
    >
      {error && <div className="alert-error mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        {isRegistering && (
          <div>
            <label className="label">Company name</label>
            <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} required className="input" />
          </div>
        )}

        <div>
          <label className="label">Email</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} required className="input" />
        </div>

        <div>
          <label className="label">Password</label>
          <PasswordInput name="password" value={formData.password} onChange={handleChange} aria-label="Password" autoComplete="current-password" required />
        </div>

        {isRegistering && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Industry</label>
              <input type="text" name="industry" value={formData.industry} onChange={handleChange} className="input" />
            </div>
            <div>
              <label className="label">Website</label>
              <input type="text" name="website" value={formData.website} onChange={handleChange} className="input" />
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
