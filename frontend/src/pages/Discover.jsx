// Discover.jsx
// Find a coach. Layout follows the design mockup:
//   main column: black hero with search, athlete spotlight, recommendations
//                (learners), then "Top coaches" with sport filter chips
//   right column (xl screens): SideRail (profile card + upcoming sessions)
// Search hits the backend (/users/coaches with sport/location); the sport
// chips then filter the loaded results in the browser.

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Star } from 'lucide-react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import StadiumArt from '../components/StadiumArt';
import SideRail from '../components/SideRail';

// Card header colours, cycled through like the mockup (blue, orange, teal)
const CARD_GRADIENTS = [
    'from-[#5B7FB5] to-[#9CC08F]',
    'from-[#E8A07A] to-[#C9663D]',
    'from-[#8DB3C2] to-[#5E8F78]',
];

// "cricket " -> "Cricket", so chips don't duplicate on case/spacing
const normalizeSport = (s = '') => s.trim().charAt(0).toUpperCase() + s.trim().slice(1).toLowerCase();

const CoachCard = ({ coach, index, canBook, onBook }) => (
    <div className="flex flex-col rounded-[28px] bg-surface p-3">
        {/* Photo area */}
        <div className={`relative flex h-44 items-end justify-center overflow-hidden rounded-[22px] bg-gradient-to-b ${CARD_GRADIENTS[index % CARD_GRADIENTS.length]}`}>
            {coach.profilePhoto ? (
                <img src={coach.profilePhoto} alt={coach.name} className="absolute inset-0 h-full w-full object-cover" />
            ) : (
                // Silhouette placeholder when there's no photo
                <div className="flex flex-col items-center" aria-hidden="true">
                    <div className="h-12 w-12 rounded-full bg-black/35" />
                    <div className="mt-1.5 h-24 w-24 rounded-t-[48px] bg-black/35" />
                </div>
            )}
            {coach.sport && (
                <span className="badge absolute left-3 top-3 bg-surface text-ink">{coach.sport}</span>
            )}
        </div>

        {/* Details */}
        <div className="flex flex-1 flex-col px-2 pb-2 pt-4">
            <div className="flex items-start justify-between gap-2">
                <Link to={`/profile-view/${coach._id}`} className="truncate text-lg font-bold tracking-tight hover:underline">
                    {coach.name}
                </Link>
                {coach.avgRating > 0 && (
                    <span className="flex shrink-0 items-center gap-1 text-sm font-semibold">
                        <Star size={14} className="fill-ink" /> {coach.avgRating}
                    </span>
                )}
            </div>
            <p className="mt-0.5 truncate text-sm capitalize text-muted">
                {[coach.skillLevelTaught, coach.location].filter(Boolean).join(' · ') || 'Location not set'}
            </p>

            <div className="mt-auto flex items-center justify-between gap-3 pt-5">
                <p className="text-xl font-extrabold tracking-tight">
                    {coach.pricePerSession ? <>₹{coach.pricePerSession}<span className="text-sm font-normal text-muted"> /session</span></> : <span className="text-sm font-normal text-muted">Price on request</span>}
                </p>
                {canBook ? (
                    <button onClick={() => onBook(coach._id)} className="btn btn-dark">Book</button>
                ) : (
                    <Link to={`/profile-view/${coach._id}`} className="btn btn-soft">View</Link>
                )}
            </div>
        </div>
    </div>
);

const Discover = () => {
    const [coaches, setCoaches] = useState([]);
    const [totalCoaches, setTotalCoaches] = useState(null);
    const [filters, setFilters] = useState({ sport: '', location: '' });
    const [sportChip, setSportChip] = useState('All');
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const [spotlight, setSpotlight] = useState(null);
    const [recommended, setRecommended] = useState([]);

    const fetchCoaches = async () => {
        setLoading(true);
        try {
            const params = {};
            if (filters.sport) params.sport = filters.sport;
            if (filters.location) params.location = filters.location;

            const res = await API.get('/users/coaches', { params });
            setCoaches(res.data);
            // Remember the unfiltered total for the hero badge
            if (!filters.sport && !filters.location) setTotalCoaches(res.data.length);
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
        setSportChip('All');
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

    useEffect(() => {
        if (user?.role === 'learner') {
            API.get('/users/recommended').then((res) => setRecommended(res.data));
        }
    }, []);

    // Sport chips come from the coaches actually loaded
    const sports = [...new Set(coaches.map((c) => normalizeSport(c.sport)).filter(Boolean))].sort();
    const visibleCoaches = sportChip === 'All' ? coaches : coaches.filter((c) => normalizeSport(c.sport) === sportChip);

    return (
        <div className="page grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">

            {/* ===================== MAIN COLUMN ===================== */}
            <div className="min-w-0 space-y-6">

                {/* ---------- Hero ---------- */}
                <section className="relative overflow-hidden rounded-[32px] bg-ink p-6 sm:p-10">
                    <StadiumArt className="left-[30%] opacity-50 md:left-[45%] md:opacity-100" />

                    <div className="relative">
                        {totalCoaches > 0 && (
                            <span className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 py-1.5 pl-1.5 pr-4 text-sm font-medium text-white backdrop-blur">
                                <span className="h-6 w-6 rounded-full bg-lime" />
                                {totalCoaches} {totalCoaches === 1 ? 'coach' : 'coaches'} on ArenaX
                            </span>
                        )}

                        <h1 className="text-5xl font-black leading-[0.95] tracking-tighter text-white sm:text-6xl lg:text-7xl">
                            Find your<br /><span className="text-lime">coach.</span>
                        </h1>

                        {/* Search: one white pill on desktop, stacked on mobile */}
                        <form
                            onSubmit={handleSearch}
                            className="mt-8 flex max-w-2xl flex-col gap-1 rounded-3xl bg-surface p-1.5 sm:flex-row sm:items-center sm:rounded-full"
                        >
                            <label className="flex min-w-0 flex-1 items-center gap-2 px-4 py-2.5">
                                <Search size={18} className="shrink-0 text-muted" />
                                <input
                                    type="text"
                                    placeholder="Sport, e.g. Cricket"
                                    value={filters.sport}
                                    onChange={(e) => setFilters({ ...filters, sport: e.target.value })}
                                    className="w-full min-w-0 bg-transparent text-base text-ink outline-none placeholder:text-muted"
                                />
                            </label>
                            <span className="mx-4 h-px bg-line sm:mx-0 sm:h-8 sm:w-px" />
                            <label className="flex min-w-0 flex-1 items-center gap-2 px-4 py-2.5">
                                <MapPin size={18} className="shrink-0 text-muted" />
                                <input
                                    type="text"
                                    placeholder="Location, e.g. Indore"
                                    value={filters.location}
                                    onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                                    className="w-full min-w-0 bg-transparent text-base text-ink outline-none placeholder:text-muted"
                                />
                            </label>
                            <button type="submit" className="btn btn-lime px-8 py-3 text-base">Search</button>
                        </form>
                    </div>
                </section>

                {/* ---------- Athlete spotlight ---------- */}
                {spotlight && (
                    <section className="flex flex-wrap items-center gap-4 rounded-[28px] bg-surface p-5">
                        <span className="badge bg-lime text-ink">Athlete of the month</span>
                        <p className="min-w-0 flex-1 truncate">
                            <span className="font-bold">{spotlight.athlete.name}</span>
                            <span className="text-muted"> · {spotlight.athlete.sport} · Sponsored by {spotlight.sponsorBrand.companyName}</span>
                        </p>
                    </section>
                )}

                {/* ---------- Recommended (learners) ---------- */}
                {user?.role === 'learner' && recommended.length > 0 && (
                    <section>
                        <h2 className="section-title mb-4">Recommended for you</h2>
                        <div className="grid gap-3 sm:grid-cols-2">
                            {recommended.slice(0, 4).map((coach) => (
                                <Link
                                    key={coach._id}
                                    to={`/profile-view/${coach._id}`}
                                    className="flex items-center justify-between gap-3 rounded-3xl bg-surface p-4 transition-shadow hover:shadow-sm"
                                >
                                    <div className="min-w-0">
                                        <p className="truncate font-semibold">{coach.name}</p>
                                        <p className="truncate text-sm text-muted">{coach.sport} · {coach.location}</p>
                                    </div>
                                    {/* avgRating is "0.0" for coaches with no reviews yet */}
                                    <span className="badge shrink-0 bg-lime text-ink">
                                        {Number(coach.avgRating) > 0 ? `★ ${coach.avgRating}` : 'New'}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {/* ---------- Top coaches ---------- */}
                <section>
                    <div className="mb-5 flex flex-wrap items-center gap-3">
                        <h2 className="section-title mr-2">Top coaches</h2>
                        {/* Chips scroll sideways on small screens instead of wrapping */}
                        <div className="-mx-1 flex max-w-full gap-2 overflow-x-auto px-1 pb-1">
                            {['All', ...sports].map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setSportChip(s)}
                                    className={`chip ${sportChip === s ? 'chip-active' : ''}`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    {loading ? (
                        <p className="empty-state">Loading coaches...</p>
                    ) : visibleCoaches.length === 0 ? (
                        <p className="empty-state">No coaches found. Try a different search.</p>
                    ) : (
                        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {visibleCoaches.map((coach, index) => (
                                <CoachCard
                                    key={coach._id}
                                    coach={coach}
                                    index={index}
                                    canBook={user?.role === 'learner'}
                                    onBook={handleBook}
                                />
                            ))}
                        </div>
                    )}
                </section>
            </div>

            {/* ===================== RIGHT COLUMN ===================== */}
            <div className="hidden xl:block">
                <SideRail />
            </div>
        </div>
    );
};

export default Discover;
