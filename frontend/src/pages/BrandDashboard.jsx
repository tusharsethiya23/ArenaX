// BrandDashboard.jsx
// Two tabs for a logged-in brand:
//   Find talent  - search coaches and brand-ready athletes by sport/location
//                  and send deal offers
//   Sent offers  - every offer the brand has sent, with its status
//                  (pending / accepted / declined)
// Responsive: filters stack on mobile and sit in a row on larger screens;
// talent cards are one column on mobile, more on wider screens.

import { useState, useEffect } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Search, MapPin, MessageCircle } from 'lucide-react';
import Modal from '../components/Modal';
import API from '../api/axios';
import { useBrandAuth } from '../context/BrandAuthContext';
import Avatar from '../components/Avatar';
import PageHeader from '../components/PageHeader';
import { toastError, toast } from '../utils/dialogs';

const TABS = [
  { id: 'find', label: 'Find talent' },
  { id: 'sent', label: 'Sent offers' },
];

// Status badge colours by meaning: pending amber, accepted green, declined red
const STATUS = {
  pending: { label: 'Pending', className: 'bg-warn/15 text-warn' },
  accepted: { label: 'Accepted', className: 'bg-ok/15 text-ok' },
  declined: { label: 'Declined', className: 'bg-danger/10 text-danger' },
};

const fmtDate = (d) => new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

const BrandDashboard = () => {
  const { brand, brandLogout } = useBrandAuth();
  const navigate = useNavigate();

  const [filters, setFilters] = useState({ sport: '', location: '' });
  const [talent, setTalent] = useState([]);
  const [dealTarget, setDealTarget] = useState(null); // id of the talent being offered a deal
  const [dealForm, setDealForm] = useState({ message: '' });
  const [tab, setTab] = useState('find');
  const [sent, setSent] = useState(null); // null while loading

  const loadSent = () => API.get('/deals/sent').then((res) => setSent(res.data)).catch(() => setSent([]));
  useEffect(() => {
    if (brand) loadSent();
  }, [brand]);

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
        message: dealForm.message,
      });
      toast('Deal offer sent!', 'success');
      setDealTarget(null);
      setDealForm({ message: '' });
      loadSent();
    } catch (err) {
      toastError(err);
    }
  };

  return (
    <div className="page">
      <PageHeader
        title="Brand dashboard"
        subtitle={brand.companyName}
        action={<button onClick={handleLogout} className="btn btn-soft bg-surface">Log out</button>}
      />

      <div className="mb-6 flex gap-5 border-b border-line" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`tab ${tab === t.id ? 'tab-active' : ''}`}
          >
            {t.label}
            {t.id === 'sent' && sent?.length > 0 && <span className="ml-1.5 text-muted">{sent.length}</span>}
          </button>
        ))}
      </div>

      {tab === 'find' && (<>
      {/* Search filters: same white search pill as Discover */}
      <form
        onSubmit={(e) => { e.preventDefault(); searchTalent(); }}
        className="mb-8 flex max-w-3xl flex-col gap-1 rounded-3xl bg-surface p-1.5 sm:flex-row sm:items-center sm:rounded-full"
      >
        <label className="flex min-w-0 flex-1 items-center gap-2 px-4 py-2.5">
          <Search size={18} className="shrink-0 text-accent" />
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
            <div key={t._id} className="flex flex-col rounded-2xl bg-surface p-5">
              <div className="flex items-center gap-3">
                <Avatar name={t.name} photo={t.profilePhoto} className="h-14 w-14 text-base" />
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-lg font-bold tracking-tight">{t.name}</h3>
                  <p className="truncate text-sm text-muted">{t.location}</p>
                </div>
                {t.sport && <span className="badge shrink-0 bg-white text-on-ink">{t.sport}</span>}
              </div>
              {/* Athletes appear here once their Athlete DNA readiness reaches 70% */}
              {t.role === 'learner' && t.readiness != null && (
                <p className="mt-3"><span className="badge bg-white text-on-ink">Athlete · {t.readiness}% ready</span></p>
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
      </>)}

      {/* Sent offers: newest first */}
      {tab === 'sent' && (
        sent === null ? (
          <p className="empty-state">Loading…</p>
        ) : sent.length === 0 ? (
          <p className="empty-state">No offers sent yet. Find a coach or athlete and send your first offer.</p>
        ) : (
          <ul className="space-y-3">
            {sent.map((d) => {
              const status = STATUS[d.status] || STATUS.pending;
              const person = d.talent;
              return (
                <li key={d._id} className="flex flex-col gap-3 rounded-2xl bg-surface p-5 sm:flex-row sm:items-start">
                  <Avatar name={person?.name || '?'} photo={person?.profilePhoto} className="h-12 w-12 text-sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold">{person?.name || 'Deleted account'}</h3>
                      <span className={`badge ${status.className}`}>{status.label}</span>
                    </div>
                    <p className="text-sm text-muted">
                      {[person?.role === 'learner' ? 'Athlete' : person?.role === 'coach' ? 'Coach' : null, person?.sport, person?.location].filter(Boolean).join(' · ')}
                    </p>
                    <p className="mt-2 whitespace-pre-line text-sm text-ink/80">{d.message}</p>
                  </div>
                  <div className="flex shrink-0 flex-row items-center gap-3 sm:flex-col sm:items-end">
                    <p className="text-xs text-muted">Sent {fmtDate(d.createdAt)}</p>
                    {d.status === 'accepted' && (
                      <Link to={`/deals/${d._id}/chat`} className="btn btn-soft px-4 py-2">
                        <MessageCircle size={16} /> Chat
                      </Link>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )
      )}

      {/* Deal offer modal */}
      {dealTarget && (
        <Modal title="Send deal offer" description={`To ${talent.find((t) => t._id === dealTarget)?.name || 'this athlete'}`} onClose={() => setDealTarget(null)}>
            <form onSubmit={handleSendDeal} className="space-y-3">
              <textarea
                data-autofocus
                required
                placeholder="Describe your offer: what you'd like them to do, and what they get"
                value={dealForm.message}
                onChange={(e) => setDealForm({ ...dealForm, message: e.target.value })}
                rows={4}
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
        </Modal>
      )}
    </div>
  );
};

export default BrandDashboard;
