// BrandLogin.jsx
// Combined login + register page for Brand accounts. Brands have their own
// endpoints (/brands/login and /brands/register), separate from regular users.
// Responsive: single column, full-width inputs, comfortable on small screens.

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api/axios';
import { useBrandAuth } from '../context/BrandAuthContext';

const inputClass =
  'w-full border border-ink/15 bg-white px-3 py-2.5 text-sm sm:text-base text-ink focus:outline-none focus:border-teal';

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
    <div className="min-h-screen flex items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 sm:mb-8 border-l-4 border-teal pl-4">
          <h1 className="font-display text-2xl sm:text-3xl text-ink">
            {isRegistering ? 'REGISTER YOUR BRAND' : 'BRAND LOGIN'}
          </h1>
          <p className="text-stone mt-1 text-xs sm:text-sm">
            Discover and sponsor verified athletic talent
          </p>
        </div>

        {error && (
          <div className="mb-4 border border-signal/30 bg-signal/5 text-signal px-4 py-2 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegistering && (
            <div>
              <label className="block text-xs font-semibold text-stone mb-1">Company name</label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                required
                className={inputClass}
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-stone mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className={inputClass}
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
              className={inputClass}
            />
          </div>

          {isRegistering && (
            <>
              <div>
                <label className="block text-xs font-semibold text-stone mb-1">Industry</label>
                <input
                  type="text"
                  name="industry"
                  value={formData.industry}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone mb-1">Website</label>
                <input
                  type="text"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
            </>
          )}

          <button
            type="submit"
            className="w-full bg-teal text-white font-semibold py-3 mt-2 hover:bg-teal/90 transition-colors"
          >
            {isRegistering ? 'Create brand account' : 'Log in'}
          </button>
        </form>

        <p className="text-xs sm:text-sm text-stone mt-6">
          {isRegistering ? 'Already have a brand account?' : 'New brand?'}{' '}
          <button
            type="button"
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-signal font-medium hover:underline"
          >
            {isRegistering ? 'Log in' : 'Register here'}
          </button>
        </p>

        <Link to="/login" className="block text-xs text-stone mt-4 hover:underline">
          ← Not a brand? Go to regular login
        </Link>
      </div>
    </div>
  );
};

export default BrandLogin;