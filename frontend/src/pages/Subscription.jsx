// Subscription.jsx
// The user's own plan (Coach Pro / Learner Premium): perks, status, and
// subscribe / cancel.

import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';

const Subscription = () => {
    const { user } = useAuth();
    const [subscription, setSubscription] = useState(null);
    const [loading, setLoading] = useState(true);

    const plan = user.role === 'coach' ? 'coach_pro' : 'learner_premium';
    const planLabel = user.role === 'coach' ? 'Coach Pro' : 'Learner Premium';
    const planPerks =
        user.role === 'coach'
            ? ['Higher visibility in search results', 'Lower platform commission', 'Analytics dashboard access']
            : ['More sessions per month', 'Priority booking with top coaches', 'Early access to new content'];

    const fetchStatus = async () => {
        setLoading(true);
        const res = await API.get('/subscriptions/my-subscription');
        setSubscription(res.data);
        setLoading(false);
    };

    useEffect(() => {
        fetchStatus();
    }, []);

    const handleSubscribe = async () => {
        try {
            await API.post('/subscriptions', { plan });
            fetchStatus();
        } catch (err) {
            alert(err.response?.data?.message || 'Something went wrong');
        }
    };

    const handleCancel = async () => {
        try {
            await API.put('/subscriptions/cancel');
            fetchStatus();
        } catch (err) {
            alert(err.response?.data?.message || 'Something went wrong');
        }
    };

    return (
        <div className="page max-w-xl">
            <PageHeader title="Plan and billing" subtitle="Your ArenaX membership" />

            {loading ? (
                <p className="empty-state">Loading...</p>
            ) : (
                // Black plan card, echoing the Discover hero
                <div className="overflow-hidden rounded-[32px] bg-panel p-6 text-white sm:p-8">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="text-sm text-white/60">Your plan</p>
                            <h2 className="mt-1 text-4xl font-black tracking-tighter">{planLabel}</h2>
                        </div>
                        {subscription?.active && <span className="badge bg-white text-on-ink">Active</span>}
                    </div>

                    <ul className="mt-8 space-y-3">
                        {planPerks.map((perk) => (
                            <li key={perk} className="flex items-center gap-3 text-sm sm:text-base">
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-on-ink">
                                    <Check size={14} strokeWidth={3} />
                                </span>
                                {perk}
                            </li>
                        ))}
                    </ul>

                    {subscription?.active ? (
                        <div className="mt-8">
                            <p className="mb-4 rounded-2xl bg-white/10 px-4 py-3 text-sm">
                                Active until{' '}
                                <span className="font-semibold text-highlight">
                                    {new Date(subscription.subscription.endDate).toLocaleDateString()}
                                </span>
                            </p>
                            <button onClick={handleCancel} className="btn w-full bg-white/10 py-3 text-white hover:bg-white/15">
                                Cancel subscription
                            </button>
                        </div>
                    ) : (
                        <button onClick={handleSubscribe} className="btn btn-lime mt-8 w-full py-3.5 text-base">
                            Subscribe now
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default Subscription;
