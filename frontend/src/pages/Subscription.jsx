import { useState, useEffect } from 'react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

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

    if (loading) return <p className="text-stone text-center mt-10">Loading...</p>;

    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-[#05070D]">

            {/* Red glow */}
            <div className="pointer-events-none absolute left-1/2 top-10 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-red-600/10 blur-[120px] sm:top-20 sm:h-[500px] sm:w-[500px] sm:blur-[150px]" />

            {/* Background grid */}
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-[8%] top-0 h-full border-l border-white/[0.035] sm:left-[15%]" />
                <div className="absolute left-1/2 top-0 h-full border-l border-red-500/[0.04]" />
                <div className="absolute right-[8%] top-0 h-full border-l border-white/[0.035] sm:right-[15%]" />

                <div className="absolute left-0 top-[25%] w-full border-t border-white/[0.025]" />
                <div className="absolute left-0 top-[75%] w-full border-t border-white/[0.025]" />
            </div>

            <div className="relative mx-auto w-full max-w-md px-4 py-8 sm:px-6 sm:py-12">

                {/* Header */}
                <div className="mb-6 border-l-4 border-[#E21B23] pl-4 sm:mb-8 sm:pl-5">

                    <p className="mb-2 text-[8px] font-bold uppercase tracking-[0.3em] text-[#FF2A2A] sm:text-[9px] sm:tracking-[0.4em]">
                        ARENAX / MEMBERSHIP
                    </p>

                    <h1 className="text-3xl font-black uppercase tracking-tight text-white sm:text-4xl">
                        {planLabel.toUpperCase()}
                    </h1>

                </div>

                {/* Subscription card */}
                <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[#071426]/70 p-4 backdrop-blur-md sm:p-6">

                    {/* Red accent */}
                    <div className="absolute left-0 top-0 h-full w-1 bg-[#E21B23]" />

                    {/* Perks heading */}
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4 sm:mb-5">

                        <h2 className="text-xs font-black uppercase tracking-[0.15em] text-white sm:text-sm sm:tracking-[0.2em]">
                            Plan Benefits
                        </h2>

                        <span className="text-[8px] uppercase tracking-[0.2em] text-white/20 sm:text-[9px] sm:tracking-[0.25em]">
                            ACCESS / 01
                        </span>

                    </div>

                    {/* Perks */}
                    <ul className="mb-6 space-y-3 sm:mb-7">

                        {planPerks.map((perk, i) => (
                            <li
                                key={i}
                                className="flex gap-3 text-xs leading-5 text-white/65 sm:text-sm"
                            >
                                <span className="shrink-0 font-bold text-[#FF2A2A]">
                                    ✓
                                </span>

                                <span className="break-words">
                                    {perk}
                                </span>
                            </li>
                        ))}

                    </ul>

                    {/* Active subscription */}
                    {subscription?.active ? (
                        <>

                            <div className="mb-5 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-3 sm:px-4 sm:py-4">

                                <p className="mb-1 text-[8px] font-bold uppercase tracking-[0.2em] text-[#8B95A5] sm:text-[9px] sm:tracking-[0.25em]">
                                    Subscription Status
                                </p>

                                <p className="text-xs font-medium leading-5 text-[#FF2A2A] sm:text-sm">
                                    Active until{" "}
                                    {new Date(
                                        subscription.subscription.endDate
                                    ).toLocaleDateString()}
                                </p>

                            </div>

                            <button
                                onClick={handleCancel}
                                className="w-full rounded-lg border border-white/15 bg-white/[0.02] py-3 text-[10px] font-bold uppercase tracking-[0.15em] text-white/60 transition-all duration-300 hover:border-[#E21B23] hover:text-[#FF2A2A] active:scale-[0.98] sm:text-xs sm:tracking-[0.18em]"
                            >
                                Cancel Subscription
                            </button>

                        </>
                    ) : (

                        <button
                            onClick={handleSubscribe}
                            className="w-full rounded-lg bg-[#E21B23] py-3 text-[10px] font-black uppercase tracking-[0.18em] text-white transition-all duration-300 hover:bg-[#FF2A2A] hover:shadow-[0_0_30px_rgba(226,27,35,0.3)] active:scale-[0.98] sm:py-3.5 sm:text-xs sm:tracking-[0.2em]"
                        >
                            Subscribe Now
                        </button>

                    )}

                </div>

                {/* Footer */}
                <div className="mt-6 flex flex-col gap-2 border-t border-white/10 pt-4 text-[7px] uppercase tracking-[0.25em] text-white/20 sm:mt-8 sm:flex-row sm:items-center sm:justify-between sm:text-[8px] sm:tracking-[0.3em]">
                    <span>ARENAX</span>
                    <span>MEMBERSHIP / 01</span>
                </div>

            </div>
        </div>
    );
};

export default Subscription;