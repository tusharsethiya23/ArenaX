// Analytics.jsx
// Coach performance dashboard — shows booking stats plus trust/performance
// metrics (rating, endorsements, achievements) aggregated from the backend.

import { useState, useEffect } from 'react';
import API from '../api/axios';

const Analytics = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    API.get('/analytics/my-analytics').then((res) => setData(res.data));
  }, []);

  if (!data) return <p className="text-stone text-center mt-10">Loading...</p>;

  const activityStats = [
    { label: 'Profile views', value: data.totalViews },
    { label: 'Total bookings', value: data.totalBookings },
    { label: 'Confirmed bookings', value: data.confirmedBookings },
    { label: 'Completed sessions', value: data.completedBookings },
  ];

  const performanceStats = [
    { label: 'Average rating', value: data.averageRating ? `${data.averageRating} ★` : '—' },
    { label: 'Total reviews', value: data.totalReviews },
    { label: 'Endorsements', value: data.endorsementCount },
    { label: 'Achievements', value: `${data.verifiedAchievementCount}/${data.achievementCount} verified` },
    { label: 'Completion rate', value: data.completionRate !== null ? `${data.completionRate}%` : '—' },
  ];

  const earningsStats = [
    { label: 'Brand deals closed', value: data.totalBrandDeals },
    { label: 'Brand deal earnings', value: `₹${data.totalBrandEarnings.toFixed(0)}` },
  ];

  const renderGrid = (stats) => (
    <div className="grid sm:grid-cols-3 gap-4">
      {stats.map((s) => (
        <div key={s.label} className="border border-ink/10 bg-white p-5">
          <p className="font-display text-2xl text-ink">{s.value}</p>
          <p className="text-xs text-stone mt-1">{s.label}</p>
        </div>
      ))}
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-8 border-l-4 border-signal pl-4">
        <h1 className="font-display text-3xl text-ink">YOUR ANALYTICS</h1>
      </div>

      <h2 className="font-display text-sm text-stone mb-3 uppercase tracking-wide">Activity</h2>
      {renderGrid(activityStats)}

      <h2 className="font-display text-sm text-stone mb-3 mt-8 uppercase tracking-wide">Performance &amp; Trust</h2>
      {renderGrid(performanceStats)}

      <h2 className="font-display text-sm text-stone mb-3 mt-8 uppercase tracking-wide">Earnings</h2>
      {renderGrid(earningsStats)}
    </div>
  );
};

export default Analytics;