// MyDeals.jsx
// Lets a coach or athlete see brand deal offers sent to them and accept or
// decline each. Athletes only show up in brand search once their Athlete DNA
// career readiness reaches 70%, so their empty state says so.
// Responsive: each card stacks vertically on mobile, becomes a row on larger screens.

import { useState, useEffect } from 'react';
import API from '../api/axios';
import PageHeader from '../components/PageHeader';
import { toastError } from '../utils/dialogs';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

// Colour-coded status badge
const statusColor = {
  pending: 'bg-canvas text-muted',
  accepted: 'bg-data-mint/15 text-data-mint',
  declined: 'bg-danger/10 text-danger',
};

const MyDeals = () => {
  const { user } = useAuth();
  const [deals, setDeals] = useState([]);

  const fetchDeals = async () => {
    try {
      const res = await API.get('/deals/my-deals');
      setDeals(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDeals();
  }, []);

  const handleUpdate = async (id, status) => {
    try {
      await API.put(`/deals/${id}`, { status });
      fetchDeals();
    } catch (err) {
      toastError(err);
    }
  };

  return (
    <div className="page max-w-4xl">
      <PageHeader title="Brand deals" subtitle="Sponsorship offers sent to you" />

      {deals.length === 0 ? (
        <p className="empty-state">
          No deal offers yet.
          {user.role === 'learner' && (
            <>
              {' '}Brands can find you once your career readiness reaches 70% on{' '}
              <Link to="/dna" className="font-semibold text-ink underline underline-offset-2">My DNA</Link>.
            </>
          )}
        </p>
      ) : (
        <div className="space-y-3">
          {deals.map((d) => (
            <div
              key={d._id}
              className="flex flex-col gap-4 rounded-2xl bg-surface p-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="font-semibold">{d.brand?.companyName}</p>
                <p className="mt-0.5 text-sm text-muted">
                  {d.message}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className={`badge capitalize ${statusColor[d.status]}`}>{d.status}</span>

                {d.status === 'pending' && (
                  <>
                    <button onClick={() => handleUpdate(d._id, 'accepted')} className="btn btn-lime">
                      Accept
                    </button>
                    <button onClick={() => handleUpdate(d._id, 'declined')} className="btn btn-soft">
                      Decline
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyDeals;
