import { useState, useEffect } from 'react';
import API from '../api/axios';

const Analytics = () => {
    const [data, setData] = useState(null);

    useEffect(() => {
        API.get('/analytics/my-analytics').then((res) => setData(res.data));
    }, []);

    if (!data) return <p className="text-stone text-center mt-10">Loading...</p>;

    const stats = [
        { label: 'Profile views', value: data.totalViews },
        { label: 'Total bookings', value: data.totalBookings },
        { label: 'Confirmed bookings', value: data.confirmedBookings },
        { label: 'Completed sessions', value: data.completedBookings },
        { label: 'Brand deals closed', value: data.totalBrandDeals },
        { label: 'Brand deal earnings', value: `₹${data.totalBrandEarnings.toFixed(0)}` },
    ];

    return (
        <div className="relative min-h-screen overflow-hidden bg-[#05070D]">

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

            <div className="relative mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">

                {/* Header */}
                <div className="mb-8 border-l-4 border-[#E21B23] pl-4 sm:mb-10 sm:pl-5">

                    <p className="mb-2 text-[8px] font-bold uppercase tracking-[0.3em] text-[#FF2A2A] sm:text-[9px] sm:tracking-[0.4em]">
                        ARENAX / PERFORMANCE
                    </p>

                    <h1 className="text-3xl font-black uppercase tracking-tight text-white sm:text-4xl">
                        YOUR ANALYTICS
                    </h1>

                    <p className="mt-2 text-xs leading-5 text-[#8B95A5] sm:text-sm">
                        Track your performance and activity.
                    </p>

                </div>

                {/* Stats */}
                <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">

                    {stats.map((s, index) => (
                        <div
                            key={s.label}
                            className="group relative overflow-hidden rounded-xl border border-white/10 bg-[#071426]/70 p-5 backdrop-blur-md transition-all duration-300 hover:border-red-500/40 hover:bg-[#071426]/90 sm:p-6"
                        >

                            {/* Red accent */}
                            <div className="absolute left-0 top-0 h-0 w-1 bg-[#E21B23] transition-all duration-500 group-hover:h-full" />

                            {/* Number */}
                            <p className="mb-4 text-[8px] font-bold tracking-[0.25em] text-[#FF2A2A] sm:mb-5 sm:text-[9px] sm:tracking-[0.3em]">
                                {String(index + 1).padStart(2, "0")}
                            </p>

                            {/* Value */}
                            <p className="break-words text-2xl font-black tracking-tight text-white sm:text-3xl">
                                {s.value}
                            </p>

                            <div className="mt-3 h-px w-8 bg-[#E21B23]" />

                            {/* Label */}
                            <p className="mt-3 text-[9px] font-bold uppercase tracking-[0.14em] text-[#8B95A5] sm:text-[10px] sm:tracking-[0.18em]">
                                {s.label}
                            </p>

                        </div>
                    ))}

                </div>

                {/* Footer */}
                <div className="mt-8 flex flex-col gap-2 border-t border-white/10 pt-4 text-[7px] uppercase tracking-[0.25em] text-white/20 sm:mt-10 sm:flex-row sm:items-center sm:justify-between sm:text-[8px] sm:tracking-[0.3em]">

                    <span>ARENAX</span>

                    <span>ANALYTICS / 01</span>

                </div>

            </div>
        </div>
    );
};

export default Analytics;