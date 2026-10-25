// StatsPanel.jsx
// Coach performance stats (formerly the /analytics page, now the "Stats" tab
// on /profile). Shows booking stats plus trust/performance metrics (rating,
// endorsements, achievements) and earnings, aggregated by the backend.
// The first tile of each section is highlighted in lime, like the mockup.

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

    if (error) return <p className="alert-error">{error}</p>;
    if (!data) return <p className="empty-state">Loading stats...</p>;

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
            title: 'Performance & trust',
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
        <div className="space-y-6">
            {sections.map((section) => (
                <section key={section.title} className="card">
                    <h2 className="mb-4 text-lg font-bold tracking-tight">{section.title}</h2>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                        {section.stats.map((s, i) => (
                            <div key={s.label} className={`rounded-3xl p-4 sm:p-5 ${i === 0 ? 'bg-white text-on-ink' : 'bg-canvas'}`}>
                                <p className="break-words text-2xl font-extrabold tracking-tight sm:text-3xl">{s.value}</p>
                                <p className={`mt-1 text-xs ${i === 0 ? 'text-on-ink/70' : 'text-muted'}`}>{s.label}</p>
                            </div>
                        ))}
                    </div>
                </section>
            ))}
        </div>
    );
};

export default StatsPanel;
