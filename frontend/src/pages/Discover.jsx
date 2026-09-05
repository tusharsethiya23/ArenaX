import { useState, useEffect } from 'react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router';

const Discover = () => {
    const [coaches, setCoaches] = useState([]);
    const [filters, setFilters] = useState({ sport: '', location: '' });
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const [spotlight, setSpotlight] = useState(null);

    const fetchCoaches = async () => {
        setLoading(true);
        try {
            const params = {};
            if (filters.sport) params.sport = filters.sport;
            if (filters.location) params.location = filters.location;

            const res = await API.get('/users/coaches', { params });
            setCoaches(res.data);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    useEffect(() => {
        API.get('/spotlight/current').then((res) => setSpotlight(res.data));
    }, []);

    useEffect(() => {
        fetchCoaches();
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchCoaches();
    };

    const handleBook = async (coachId) => {
        const day = prompt('Which day? (e.g. Saturday)');
        const timeSlot = prompt('Which time slot? (e.g. 5 PM - 6 PM)');
        if (!day || !timeSlot) return;

        try {
            await API.post('/bookings', { coachId, day, timeSlot });
            alert('Booking request sent!');
        } catch (err) {
            alert(err.response?.data?.message || 'Something went wrong');
        }
    };

    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-[#05070D]">

            {/* Background glow */}
            <div className="pointer-events-none absolute left-1/2 top-10 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-red-600/10 blur-[120px] sm:top-20 sm:h-[500px] sm:w-[500px] sm:blur-[150px]" />

            {/* Grid lines */}
            <div className="pointer-events-none absolute left-[8%] top-0 h-full border-l border-white/[0.035] sm:left-[15%]" />
            <div className="pointer-events-none absolute left-1/2 top-0 h-full border-l border-red-500/[0.04]" />
            <div className="pointer-events-none absolute right-[8%] top-0 h-full border-l border-white/[0.035] sm:right-[15%]" />

            <div className="relative mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-12 md:py-16">

                {/* ================= HEADING ================= */}

                <div className="mb-8 border-l-4 border-[#E21B23] pl-4 sm:mb-10 sm:pl-6">

                    <p className="mb-2 text-[8px] font-bold uppercase tracking-[0.3em] text-[#FF2A2A] sm:mb-3 sm:text-[10px] sm:tracking-[0.4em]">
                        ARENAX / DISCOVER
                    </p>

                    <h1 className="text-3xl font-black uppercase tracking-tight text-white sm:text-4xl md:text-6xl">
                        FIND YOUR COACH
                    </h1>

                    <p className="mt-3 text-xs text-[#8B95A5] sm:mt-4 sm:text-sm">
                        Search by sport or location
                    </p>

                </div>


                {/* ================= ATHLETE SPOTLIGHT ================= */}

                {spotlight && (
                    <div className="relative mb-6 overflow-hidden rounded-xl border border-red-500/20 bg-[#071426]/70 p-4 backdrop-blur-md sm:mb-8 sm:p-5">

                        {/* Red accent */}
                        <div className="absolute left-0 top-0 h-full w-1 bg-[#E21B23]" />

                        <div className="flex items-start justify-between gap-4">

                            <div className="min-w-0">

                                <p className="mb-2 text-[8px] font-bold uppercase tracking-[0.25em] text-[#FF2A2A] sm:text-[9px] sm:tracking-[0.35em]">
                                    ATHLETE OF THE MONTH
                                </p>

                                <p className="break-words text-lg font-black uppercase tracking-tight text-white sm:text-xl">
                                    {spotlight.athlete.name}
                                </p>

                                <p className="mt-1 flex flex-wrap items-center text-[10px] uppercase tracking-[0.1em] text-[#8B95A5] sm:text-xs sm:tracking-[0.12em]">
                                    <span>{spotlight.athlete.sport}</span>

                                    <span className="mx-2 text-[#E21B23]">
                                        /
                                    </span>

                                    <span>
                                        Sponsored by {spotlight.sponsorBrand.companyName}
                                    </span>
                                </p>

                            </div>

                            <div className="hidden shrink-0 text-[9px] font-bold uppercase tracking-[0.3em] text-white/20 sm:block">
                                SPOTLIGHT / 01
                            </div>

                        </div>

                    </div>
                )}


                {/* ================= SEARCH ================= */}

                <form
                    onSubmit={handleSearch}
                    className="mb-10 grid overflow-hidden rounded-xl border border-white/10 bg-[#071426]/70 backdrop-blur-md sm:mb-16 md:grid-cols-[1fr_1fr_auto]"
                >

                    {/* Sport */}
                    <input
                        type="text"
                        placeholder="SPORT — e.g. Cricket"
                        value={filters.sport}
                        onChange={(e) =>
                            setFilters({
                                ...filters,
                                sport: e.target.value
                            })
                        }
                        className="min-w-0 border-b border-white/10 bg-transparent px-4 py-4 text-xs uppercase tracking-wide text-white outline-none placeholder:text-white/25 focus:border-[#E21B23] sm:px-5 sm:py-5 sm:text-sm md:border-b-0 md:border-r"
                    />

                    {/* Location */}
                    <input
                        type="text"
                        placeholder="LOCATION — e.g. Delhi"
                        value={filters.location}
                        onChange={(e) =>
                            setFilters({
                                ...filters,
                                location: e.target.value
                            })
                        }
                        className="min-w-0 border-b border-white/10 bg-transparent px-4 py-4 text-xs uppercase tracking-wide text-white outline-none placeholder:text-white/25 focus:border-[#E21B23] sm:px-5 sm:py-5 sm:text-sm md:border-b-0 md:border-r"
                    />

                    {/* Search */}
                    <button
                        type="submit"
                        className="bg-[#E21B23] px-6 py-4 text-[10px] font-black uppercase tracking-[0.18em] text-white transition-all duration-300 hover:bg-[#FF2A2A] hover:shadow-[0_0_25px_rgba(226,27,35,0.25)] active:scale-[0.98] sm:px-10 sm:py-5 sm:text-xs sm:tracking-[0.2em]"
                    >
                        Search
                    </button>

                </form>


                {/* ================= RESULTS ================= */}

                {loading ? (

                    <div className="border-y border-white/10 py-10 sm:py-12">
                        <p className="text-[9px] uppercase tracking-[0.25em] text-[#8B95A5] sm:text-[10px] sm:tracking-[0.3em]">
                            Loading coaches...
                        </p>
                    </div>

                ) : coaches.length === 0 ? (

                    <div className="rounded-xl border border-white/10 bg-[#071426]/50 px-4 py-12 text-center sm:px-6 sm:py-16">
                        <p className="text-xs text-[#8B95A5] sm:text-sm">
                            No coaches found. Try a different search.
                        </p>
                    </div>

                ) : (

                    <div className="grid gap-4 sm:gap-5 md:grid-cols-2">

                        {coaches.map((coach, index) => (

                            <div
                                key={coach._id}
                                className="group relative flex flex-col overflow-hidden rounded-xl border border-white/10 bg-[#071426]/70 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-red-500/40 hover:bg-[#071426]/90 hover:shadow-[0_10px_40px_rgba(0,0,0,0.35)] sm:p-6"
                            >

                                {/* Red side accent */}
                                <div className="absolute left-0 top-0 h-0 w-1 bg-[#E21B23] transition-all duration-500 group-hover:h-full" />


                                {/* ================= TOP ROW ================= */}

                                <div className="mb-5 flex items-center justify-between gap-3 sm:mb-6">

                                    <span className="text-[9px] font-bold tracking-[0.25em] text-[#FF2A2A] sm:text-[10px] sm:tracking-[0.3em]">
                                        {String(index + 1).padStart(2, "0")}
                                    </span>

                                    {coach.pricePerSession && (
                                        <span className="text-[10px] uppercase tracking-wide text-white/50 sm:text-xs">
                                            ₹{coach.pricePerSession}

                                            <span className="text-white/25">
                                                {" "} / SESSION
                                            </span>
                                        </span>
                                    )}

                                </div>


                                {/* ================= PROFILE ================= */}

                                <div className="flex min-w-0 items-center gap-3 sm:gap-4">

                                    {/* Image */}
                                    <div className="relative shrink-0">

                                        {/* Image glow */}
                                        <div className="absolute inset-0 rounded-xl bg-[#E21B23]/20 blur-md transition-all duration-300 group-hover:bg-[#E21B23]/30" />

                                        <img
                                            src={
                                                coach.profilePhoto ||
                                                "https://placehold.co/100x100?text=?"
                                            }
                                            alt={coach.name}
                                            className="relative h-16 w-16 rounded-xl border-2 border-white/10 object-cover shadow-[0_0_20px_rgba(0,0,0,0.4)] transition-all duration-300 group-hover:border-[#E21B23]/60 sm:h-20 sm:w-20"
                                        />

                                    </div>


                                    {/* Name + sport */}
                                    <div className="min-w-0">

                                        <h3 className="break-words text-lg font-black uppercase tracking-tight text-white sm:text-xl">

                                            <Link
                                                to={`/profile-view/${coach._id}`}
                                                className="transition-colors duration-200 hover:text-[#FF2A2A]"
                                            >
                                                {coach.name}
                                            </Link>

                                        </h3>

                                        <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.15em] text-[#FF2A2A] sm:mt-2 sm:text-xs sm:tracking-[0.2em]">
                                            {coach.sport}
                                        </p>

                                    </div>

                                </div>


                                {/* Divider */}
                                <div className="my-5 h-px bg-white/10 sm:my-6" />


                                {/* ================= LOCATION ================= */}

                                <div className="flex min-w-0 items-start gap-3">

                                    <span className="shrink-0 text-[8px] font-bold uppercase tracking-[0.2em] text-[#8B95A5] sm:text-[9px] sm:tracking-[0.25em]">
                                        LOCATION
                                    </span>

                                    <span className="min-w-0 break-words text-[10px] uppercase tracking-[0.1em] text-white/60 sm:text-xs sm:tracking-[0.12em]">
                                        {coach.location}
                                    </span>

                                </div>


                                {/* ================= FIXED BIO ================= */}

                                <div className="mt-4 h-[66px] overflow-hidden sm:mt-5 sm:h-[72px]">

                                    {coach.bio ? (

                                        <p className="line-clamp-3 text-xs leading-5 text-white/45 sm:text-sm sm:leading-6">
                                            {coach.bio}
                                        </p>

                                    ) : (

                                        <p className="text-xs leading-5 text-white/20 sm:text-sm sm:leading-6">
                                            No bio available.
                                        </p>

                                    )}

                                </div>


                                {/* ================= BOOKING ================= */}

                                {user?.role === "learner" && (
                                    <button
                                        onClick={() => handleBook(coach._id)}
                                        className="mt-5 w-full rounded-lg border border-[#E21B23] bg-[#E21B23] px-5 py-3 text-[10px] font-black uppercase tracking-[0.12em] text-white transition-all duration-300 hover:bg-[#FF2A2A] hover:shadow-[0_0_25px_rgba(226,27,35,0.25)] active:scale-[0.97] sm:mt-6 sm:px-6 sm:text-xs sm:tracking-[0.15em]"
                                    >
                                        Request Booking
                                    </button>
                                )}

                            </div>

                        ))}

                    </div>

                )}


                {/* ================= FOOTER ================= */}

                <div className="mt-10 flex flex-col gap-2 border-t border-white/10 pt-5 text-[7px] uppercase tracking-[0.25em] text-white/20 sm:mt-12 sm:flex-row sm:items-center sm:justify-between sm:text-[9px] sm:tracking-[0.3em]">

                    <span>ARENAX</span>

                    <span>DISCOVER / COACHES</span>

                </div>

            </div>
        </div>
    );
};

export default Discover;