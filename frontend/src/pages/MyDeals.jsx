
// MyDeals.jsx
// Lets a coach see brand deal offers sent to them and accept or decline each.
// Responsive: each card stacks vertically on mobile, becomes a row on larger screens.

import { useState, useEffect } from 'react';
import API from '../api/axios';

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

  // Colour-coded status badge
  const statusColor = {
    pending: 'text-stone border-stone/30',
    accepted: 'text-teal border-teal/30',
    declined: 'text-signal border-signal/30',
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-10">
      <div className="mb-8 border-l-4 border-signal pl-4">
        <h1 className="font-display text-2xl sm:text-3xl text-ink">BRAND DEALS</h1>
        <p className="text-stone text-xs sm:text-sm mt-1">Sponsorship offers sent to you</p>
      </div>

      {deals.length === 0 ? (
        <p className="text-sm text-stone">No deal offers yet.</p>
      ) : (
        <div className="space-y-3">
          {deals.map((d) => (
            <div
              key={d._id}
              className="border border-ink/10 bg-white p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
            >
              <div className="min-w-0">
                <p className="font-medium text-ink text-sm sm:text-base">{d.brand?.companyName}</p>
                <p className="text-xs sm:text-sm text-stone">
                  ₹{d.offerAmount}
                  {d.message ? ` · ${d.message}` : ''}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <span className={`text-xs font-semibold border px-2 py-1 ${statusColor[d.status]}`}>
                  {d.status.toUpperCase()}
                </span>

                {d.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleUpdate(d._id, 'accepted')}
                      className="text-xs sm:text-sm bg-teal text-white px-3 py-1.5 hover:bg-teal/90"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleUpdate(d._id, 'declined')}
                      className="text-xs sm:text-sm border border-ink/15 text-ink/70 px-3 py-1.5 hover:border-signal hover:text-signal"
                    >
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