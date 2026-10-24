// BrandDashboard.jsx
// Lets a logged-in brand search talent by sport/location and send deal
// offers. Responsive: filters stack on mobile and sit in a row on larger
// screens; talent cards are one column on mobile, more on wider screens.

import { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Search, MapPin } from 'lucide-react';
import API from '../api/axios';
import { useBrandAuth } from '../context/BrandAuthContext';
import Avatar from '../components/Avatar';
import PageHeader from '../components/PageHeader';

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
    <div className="page">
      <PageHeader
        title="Brand dashboard"
        subtitle={brand.companyName}
        action={<button onClick={handleLogout} className="btn btn-soft bg-surface">Log out</button>}
      />

      {/* Search filters: same white search pill as Discover */}
      <form
        onSubmit={(e) => { e.preventDefault(); searchTalent(); }}
        className="mb-8 flex max-w-3xl flex-col gap-1 rounded-3xl bg-surface p-1.5 sm:flex-row sm:items-center sm:rounded-full"
      >
        <label className="flex min-w-0 flex-1 items-center gap-2 px-4 py-2.5">
          <Search size={18} className="shrink-0 text-muted" />
          <input
            placeholder="Sport"
            value={filters.sport}
            onChange={(e) => setFilters({ ...filters, sport: e.target.value })}
            className="w-full min-w-0 bg-transparent outline-none placeholder:text-muted"
          />
        </label>
        <span className="mx-4 h-px bg-line sm:mx-0 sm:h-8 sm:w-px" />
        <label className="flex min-w-0 flex-1 items-center gap-2 px-4 py-2.5">
          <MapPin size={18} className="shrink-0 text-muted" />
          <input
            placeholder="Location"
            value={filters.location}
            onChange={(e) => setFilters({ ...filters, location: e.target.value })}
            className="w-full min-w-0 bg-transparent outline-none placeholder:text-muted"
          />
        </label>
        <button type="submit" className="btn btn-lime px-8 py-3">Search</button>
      </form>

      {talent.length === 0 ? (
        <p className="empty-state">No talent found. Try a different search.</p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {talent.map((t) => (
            <div key={t._id} className="flex flex-col rounded-[28px] bg-surface p-5">
              <div className="flex items-center gap-3">
                <Avatar name={t.name} photo={t.profilePhoto} className="h-14 w-14 text-base" />
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-lg font-bold tracking-tight">{t.name}</h3>
                  <p className="truncate text-sm text-muted">{t.location}</p>
                </div>
                {t.sport && <span className="badge shrink-0 bg-lime text-ink">{t.sport}</span>}
              </div>
              {/* Athletes appear here once their Athlete DNA readiness reaches 70% */}
              {t.role === 'learner' && t.readiness != null && (
                <p className="mt-3"><span className="badge bg-ink text-lime">Athlete · {t.readiness}% ready</span></p>
              )}
              {t.bio && <p className="mt-4 text-sm text-ink/80">{t.bio}</p>}
              <div className="mt-auto pt-5">
                <button onClick={() => setDealTarget(t._id)} className="btn btn-dark">
                  Send deal offer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Deal offer modal */}
      {dealTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4 backdrop-blur-sm">
          <div className="card w-full max-w-sm">
            <h2 className="mb-4 text-xl font-extrabold tracking-tight">Send deal offer</h2>
            <form onSubmit={handleSendDeal} className="space-y-3">
              <input
                type="number"
                placeholder="Offer amount (₹)"
                value={dealForm.offerAmount}
                onChange={(e) => setDealForm({ ...dealForm, offerAmount: e.target.value })}
                required
                className="input"
              />
              <textarea
                placeholder="Message to the athlete"
                value={dealForm.message}
                onChange={(e) => setDealForm({ ...dealForm, message: e.target.value })}
                rows={3}
                className="input resize-none"
              />
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setDealTarget(null)} className="btn btn-soft flex-1">
                  Cancel
                </button>
                <button type="submit" className="btn btn-dark flex-1">
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
