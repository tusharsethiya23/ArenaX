// BrandDashboard.jsx
// Lets a logged-in brand search talent by sport/location and send deal
// offers. Responsive: filters stack on mobile and sit in a row on larger
// screens; talent cards are one column on mobile, two on tablet and up.

import { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { useBrandAuth } from '../context/BrandAuthContext';

const BrandDashboard = () => {
  const { brand, brandLogout } = useBrandAuth();
  const navigate = useNavigate();

  const [filters, setFilters] = useState({ sport: '', location: '' });
  const [talent, setTalent] = useState([]);
  const [dealTarget, setDealTarget] = useState(null); // id of the talent being offered a deal
  const [dealForm, setDealForm] = useState({ offerAmount: '', message: '' });

  const searchTalent = async () => {
    const params = {};
    if (filters.sport) params.sport = filters.sport;
    if (filters.location) params.location = filters.location;
    try {
      const res = await API.get('/brands/search-talent', { params });
      setTalent(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (brand) searchTalent();
  }, []);

  // Guard: only a logged-in brand may see this page
  if (!brand) return <Navigate to="/brand/login" />;

  const handleLogout = () => {
    brandLogout();
    navigate('/brand/login');
  };

  const handleSendDeal = async (e) => {
    e.preventDefault();
    try {
      await API.post('/deals', {
        talentId: dealTarget,
        offerAmount: Number(dealForm.offerAmount),
        message: dealForm.message,
      });
      alert('Deal offer sent!');
      setDealTarget(null);
      setDealForm({ offerAmount: '', message: '' });
    } catch (err) {
      alert(err.response?.data?.message || 'Something went wrong');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8 border-l-4 border-teal pl-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl text-ink">BRAND DASHBOARD</h1>
          <p className="text-stone text-xs sm:text-sm mt-1">{brand.companyName}</p>
        </div>
        <button
          onClick={handleLogout}
          className="border border-ink/15 px-4 py-2 text-xs sm:text-sm text-ink/70 hover:border-signal hover:text-signal w-full sm:w-auto"
        >
          Log out
        </button>
      </div>

      {/* Search filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <input
          placeholder="Sport"
          value={filters.sport}
          onChange={(e) => setFilters({ ...filters, sport: e.target.value })}
          className="border border-ink/15 px-3 py-2.5 text-sm flex-1 focus:outline-none focus:border-teal"
        />
        <input
          placeholder="Location"
          value={filters.location}
          onChange={(e) => setFilters({ ...filters, location: e.target.value })}
          className="border border-ink/15 px-3 py-2.5 text-sm flex-1 focus:outline-none focus:border-teal"
        />
        <button
          onClick={searchTalent}
          className="bg-ink text-white px-6 py-2.5 text-sm font-semibold hover:bg-ink/90 w-full sm:w-auto"
        >
          Search
        </button>
      </div>

      {talent.length === 0 ? (
        <p className="text-sm text-stone">No talent found. Try a different search.</p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {talent.map((t) => (
            <div key={t._id} className="border border-ink/10 bg-white p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <img
                  src={t.profilePhoto || 'https://placehold.co/48x48?text=?'}
                  alt={t.name}
                  className="w-12 h-12 object-cover border border-ink/10 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-display text-base sm:text-lg text-ink truncate">{t.name}</h3>
                    <span className="text-xs text-teal font-semibold whitespace-nowrap">{t.sport}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-stone">{t.location}</p>
                </div>
              </div>
              {t.bio && <p className="text-xs sm:text-sm text-ink/70 mt-3">{t.bio}</p>}
              <button
                onClick={() => setDealTarget(t._id)}
                className="mt-3 w-full sm:w-auto border border-teal text-teal px-4 py-1.5 text-xs sm:text-sm font-semibold hover:bg-teal hover:text-white transition-colors"
              >
                Send deal offer
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Deal offer modal */}
      {dealTarget && (
        <div className="fixed inset-0 bg-ink/40 flex items-center justify-center px-4 z-50">
          <div className="bg-paper border border-ink/10 max-w-sm w-full p-5 sm:p-6">
            <h2 className="font-display text-lg sm:text-xl text-ink mb-4">SEND DEAL OFFER</h2>
            <form onSubmit={handleSendDeal} className="space-y-3">
              <input
                type="number"
                placeholder="Offer amount (₹)"
                value={dealForm.offerAmount}
                onChange={(e) => setDealForm({ ...dealForm, offerAmount: e.target.value })}
                required
                className="w-full border border-ink/15 px-3 py-2 text-sm focus:outline-none focus:border-teal"
              />
              <textarea
                placeholder="Message to the athlete"
                value={dealForm.message}
                onChange={(e) => setDealForm({ ...dealForm, message: e.target.value })}
                className="w-full border border-ink/15 px-3 py-2 text-sm focus:outline-none focus:border-teal"
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setDealTarget(null)}
                  className="flex-1 border border-ink/15 text-ink/70 py-2 text-sm hover:border-signal hover:text-signal"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-teal text-white py-2 text-sm font-semibold hover:bg-teal/90"
                >
                  Send
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrandDashboard;