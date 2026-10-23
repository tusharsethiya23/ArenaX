// StatsPanel.jsx
// Coach performance stats (formerly the /analytics page, now the "Stats" tab
// on /profile). Shows booking stats plus trust/performance metrics (rating,
// endorsements, achievements) and earnings, aggregated by the backend.

import { useState, useEffect } from 'react';
import API from '../api/axios';

const StatsPanel = () => {
    const [data, setData] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        API.get('/analytics/my-analytics')
            .then((res) => setData(res.data))
            .catch((err) => setError(err.response?.data?.message || 'Could not load your stats'));
    }, []);

    if (error) return <p className="py-10 text-center text-sm text-[#FF2A2A]">{error}</p>;
    if (!data) return <p className="py-10 text-center text-[10px] uppercase tracking-[0.3em] text-[#8B95A5]">Loading stats...</p>;

    const sections = [
        {
            title: 'Activity',
            stats: [
                { label: 'Profile views', value: data.totalViews },
                { label: 'Total bookings', value: data.totalBookings },
                { label: 'Confirmed bookings', value: data.confirmedBookings },
                { label: 'Completed sessions', value: data.completedBookings },
            ],
        },
        {
            title: 'Performance & Trust',
            stats: [
                { label: 'Average rating', value: data.averageRating ? `${data.averageRating} ★` : '—' },
                { label: 'Total reviews', value: data.totalReviews },
                { label: 'Endorsements', value: data.endorsementCount },
                { label: 'Achievements', value: `${data.verifiedAchievementCount}/${data.achievementCount} verified` },
                { label: 'Completion rate', value: data.completionRate !== null ? `${data.completionRate}%` : '—' },
            ],
        },
        {
            title: 'Earnings',
            stats: [
                { label: 'Brand deals closed', value: data.totalBrandDeals },
                { label: 'Brand deal earnings', value: `₹${data.totalBrandEarnings.toFixed(0)}` },
            ],
        },
    ];

    return (
        <div className="space-y-8">
            {sections.map((section) => (
                <section key={section.title}>
                    <h2 className="mb-3 text-[9px] font-bold uppercase tracking-[0.3em] text-[#8B95A5] sm:text-[10px]">
                        {section.title}
                    </h2>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
                        {section.stats.map((s) => (
                            <div key={s.label} className="rounded-xl border border-white/10 bg-[#071426]/70 p-4 sm:p-5">
                                <p className="break-words text-xl font-black text-white sm:text-2xl">{s.value}</p>
                                <p className="mt-1 text-xs text-white/45">{s.label}</p>
                            </div>
                        ))}
                    </div>
                </section>
            ))}
        </div>
    );
};

export default StatsPanel;
