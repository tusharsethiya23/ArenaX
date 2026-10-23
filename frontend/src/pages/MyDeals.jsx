// MyDeals.jsx
// Lets a coach see brand deal offers sent to them and accept or decline each.
// Responsive: each card stacks vertically on mobile, becomes a row on larger screens.

import { useState, useEffect } from 'react';
import API from '../api/axios';
import PageHeader from '../components/PageHeader';

// Colour-coded status badge
const statusColor = {
  pending: 'bg-canvas text-muted',
  accepted: 'bg-lime text-ink',
  declined: 'bg-danger/10 text-danger',
};

const MyDeals = () => {
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
      alert(err.response?.data?.message || 'Something went wrong');
    }
  };

  return (
    <div className="page max-w-4xl">
      <PageHeader title="Brand deals" subtitle="Sponsorship offers sent to you" />

      {deals.length === 0 ? (
        <p className="empty-state">No deal offers yet.</p>
      ) : (
        <div className="space-y-3">
          {deals.map((d) => (
            <div
              key={d._id}
              className="flex flex-col gap-4 rounded-[28px] bg-surface p-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="font-semibold">{d.brand?.companyName}</p>
                <p className="mt-0.5 text-sm text-muted">
                  <span className="text-lg font-extrabold text-ink">₹{d.offerAmount}</span>
                  {d.message ? ` · ${d.message}` : ''}
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
