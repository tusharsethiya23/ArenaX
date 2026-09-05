import { useState, useEffect } from 'react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

const Bookings = () => {
    const { user } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    const endpoint = user.role === 'coach' ? '/bookings/my-requests' : '/bookings/my-bookings';

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const res = await API.get(endpoint);
            setBookings(res.data);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    const handleStatusUpdate = async (id, status) => {
        try {
            await API.put(`/bookings/${id}`, { status });
            fetchBookings();
        } catch (err) {
            alert(err.response?.data?.message || 'Something went wrong');
        }
    };

    const statusColor = {
        pending: 'text-stone border-stone/30',
        confirmed: 'text-teal border-teal/30',
        declined: 'text-signal border-signal/30',
        completed: 'text-ink border-ink/20',
    };

    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-[#05070D]">

            {/* Red glow */}
            <div className="pointer-events-none absolute right-[-100px] top-10 h-[280px] w-[280px] rounded-full bg-red-600/10 blur-[120px] sm:right-0 sm:top-20 sm:h-[400px] sm:w-[400px] sm:blur-[150px]" />

            {/* Grid */}
            <div className="pointer-events-none absolute left-[8%] top-0 h-full border-l border-white/[0.035] sm:left-[15%]" />

            <div className="pointer-events-none absolute left-1/2 top-0 h-full border-l border-red-500/[0.04]" />

            <div className="pointer-events-none absolute right-[8%] top-0 h-full border-l border-white/[0.035] sm:right-[15%]" />

            <div className="relative mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-12 md:py-16">

                {/* Heading */}
                <div className="mb-10 border-l-4 border-[#E21B23] pl-4 sm:mb-14 sm:pl-6">

                    <p className="mb-2 text-[8px] font-bold uppercase tracking-[0.3em] text-[#FF2A2A] sm:mb-3 sm:text-[10px] sm:tracking-[0.4em]">
                        ARENAX / BOOKINGS
                    </p>

                    <h1 className="text-3xl font-black uppercase tracking-tight text-white sm:text-4xl md:text-6xl">
                        {user.role === "coach"
                            ? "BOOKING REQUESTS"
                            : "MY BOOKINGS"}
                    </h1>

                    <p className="mt-3 max-w-xl text-xs leading-5 text-[#8B95A5] sm:mt-4 sm:text-sm">
                        {user.role === "coach"
                            ? "Manage your incoming booking requests."
                            : "View and manage your upcoming bookings."}
                    </p>

                </div>

                {/* Loading */}
                {loading ? (

                    <div className="border-y border-white/10 py-10 sm:py-12">
                        <p className="text-[9px] uppercase tracking-[0.25em] text-[#8B95A5] sm:text-[10px] sm:tracking-[0.3em]">
                            Loading...
                        </p>
                    </div>

                ) : bookings.length === 0 ? (

                    <div className="rounded-xl border border-white/10 bg-[#071426]/50 px-4 py-12 text-center sm:px-6 sm:py-16">
                        <p className="text-xs text-[#8B95A5] sm:text-sm">
                            No bookings yet.
                        </p>
                    </div>

                ) : (

                    <div className="space-y-4">

                        {bookings.map((b, index) => (
                            <div
                                key={b._id}
                                className="group relative flex flex-col gap-5 overflow-hidden rounded-xl border border-white/10 bg-[#071426]/50 p-4 transition-all duration-300 hover:border-red-500/40 hover:bg-[#071426]/80 sm:gap-6 sm:p-6 md:flex-row md:items-center md:justify-between"
                            >

                                {/* Red side line */}
                                <div className="absolute left-0 top-0 h-0 w-1 bg-[#E21B23] transition-all duration-500 group-hover:h-full" />

                                {/* Information */}
                                <div className="flex min-w-0 items-start gap-3 sm:gap-6">

                                    <span className="shrink-0 pt-1 text-[9px] font-bold tracking-[0.25em] text-[#FF2A2A] sm:text-[10px] sm:tracking-[0.3em]">
                                        {String(index + 1).padStart(2, "0")}
                                    </span>

                                    <div className="min-w-0">

                                        <p className="break-words text-base font-bold uppercase tracking-wide text-white sm:text-lg">
                                            {user.role === "coach"
                                                ? b.learner?.name
                                                : b.coach?.name}
                                        </p>

                                        <p className="mt-2 flex flex-wrap items-center gap-1 text-[10px] uppercase tracking-[0.12em] text-[#8B95A5] sm:text-xs sm:tracking-[0.15em]">
                                            <span>{b.day}</span>

                                            <span className="mx-1 text-[#FF2A2A] sm:mx-2">
                                                /
                                            </span>

                                            <span>{b.timeSlot}</span>
                                        </p>

                                    </div>

                                </div>

                                {/* Status + Actions */}
                                <div className="flex flex-wrap items-center gap-2 sm:gap-3">

                                    <span
                                        className={`border px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.12em] sm:text-[10px] sm:tracking-[0.15em] ${statusColor[b.status]}`}
                                    >
                                        {b.status.toUpperCase()}
                                    </span>

                                    {user.role === "coach" && b.status === "pending" && (
                                        <>
                                            <button
                                                onClick={() =>
                                                    handleStatusUpdate(
                                                        b._id,
                                                        "confirmed"
                                                    )
                                                }
                                                className="flex-1 bg-[#E21B23] px-4 py-2 text-[10px] font-black uppercase tracking-[0.1em] text-white transition-all duration-300 hover:bg-[#FF2A2A] hover:shadow-[0_0_20px_rgba(226,27,35,0.2)] active:scale-[0.97] sm:flex-none sm:px-5 sm:text-xs sm:tracking-[0.12em]"
                                            >
                                                Accept
                                            </button>

                                            <button
                                                onClick={() =>
                                                    handleStatusUpdate(
                                                        b._id,
                                                        "declined"
                                                    )
                                                }
                                                className="flex-1 border border-white/20 bg-white/[0.02] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.1em] text-white/60 transition-all duration-300 hover:border-white/50 hover:text-white active:scale-[0.97] sm:flex-none sm:px-5 sm:text-xs sm:tracking-[0.12em]"
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

                {/* Footer */}
                <div className="mt-10 flex flex-col gap-2 border-t border-white/10 pt-5 text-[7px] uppercase tracking-[0.25em] text-white/20 sm:mt-12 sm:flex-row sm:items-center sm:justify-between sm:text-[9px] sm:tracking-[0.3em]">
                    <span>ARENAX</span>
                    <span>BOOKINGS / 01</span>
                </div>

            </div>
        </div>
    );
};

export default Bookings;