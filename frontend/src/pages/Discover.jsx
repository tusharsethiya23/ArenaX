// Discover.jsx
// Find a coach. Layout follows the design mockup:
//   main column:  white search hero (sport / location / level) + lime promo card,
//                 then "Top coaches" with sport chips, sort and filters
//   right column: upcoming session, coaches in your city, athlete spotlight
// Search hits the backend (/users/coaches); chips, sort and filters then work
// on the loaded results in the browser.

import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, BarChart3, SlidersHorizontal, ArrowRight, Star } from 'lucide-react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import useMyBookings from '../hooks/useMyBookings';
import useMyProfile from '../hooks/useMyProfile';
import useSubscription from '../hooks/useSubscription';
import useDismiss from '../hooks/useDismiss';
import useFollowingIds from '../hooks/useFollowingIds';
import CoachCard from '../components/CoachCard';
import NextSessionCard from '../components/NextSessionCard';
import Avatar from '../components/Avatar';
import { nextOpenSlot } from '../utils/slots';
import { normalizeSport, sportEmoji } from '../utils/sports';

const SORTS = {
    top: { label: 'Top rated', fn: (a, b) => (b.rating ?? 0) - (a.rating ?? 0) || b.reviewCount - a.reviewCount },
    soonest: { label: 'Soonest slot', fn: (a, b) => a._soonest - b._soonest },
    priceLow: { label: 'Price: low to high', fn: (a, b) => (a.pricePerSession ?? Infinity) - (b.pricePerSession ?? Infinity) },
    priceHigh: { label: 'Price: high to low', fn: (a, b) => (b.pricePerSession ?? -1) - (a.pricePerSession ?? -1) },
    experience: { label: 'Most experienced', fn: (a, b) => (b.yearsExperience ?? 0) - (a.yearsExperience ?? 0) },
};

// ---------- Small pieces ----------

const SearchField = ({ icon: Icon, label, children }) => (
    <label className="flex min-w-0 flex-1 items-center gap-3 px-5 py-2.5">
        <Icon size={18} className="shrink-0" />
        <span className="min-w-0 flex-1">
            <span className="block text-xs text-muted">{label}</span>
            {children}
        </span>
    </label>
);

const PromoCard = ({ showPremium }) => (
    <section className="flex flex-col justify-between rounded-[32px] bg-lime p-6 sm:p-8">
        {showPremium ? (
            <>
                <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-ink/70">Learner Premium</p>
                    <h2 className="mt-2 text-3xl font-black leading-tight tracking-tighter">Priority booking with top coaches</h2>
                </div>
                <Link to="/subscription" className="btn btn-dark mt-6 self-start">See plans <ArrowRight size={16} /></Link>
            </>
        ) : (
            <>
                <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-ink/70">AI coach</p>
                    <h2 className="mt-2 text-3xl font-black leading-tight tracking-tighter">Not sure who to pick? Ask the AI coach</h2>
                </div>
                <Link to="/ai-assistant" className="btn btn-dark mt-6 self-start">Ask now <ArrowRight size={16} /></Link>
            </>
        )}
    </section>
);

const FiltersButton = ({ filters, setFilters }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const close = useCallback(() => setOpen(false), []);
    useDismiss(ref, open, close);
    const active = (filters.maxPrice ? 1 : 0) + (filters.openOnly ? 1 : 0);

    return (
        <div ref={ref} className="relative">
            <button onClick={() => setOpen(!open)} className="chip gap-2" aria-expanded={open}>
                <SlidersHorizontal size={15} /> Filters{active > 0 && <span className="badge bg-lime px-2 py-0 text-ink">{active}</span>}
            </button>
            {open && (
                <div className="absolute right-0 top-full z-30 mt-2 w-64 space-y-4 rounded-3xl border border-line bg-surface p-5 shadow-[0_20px_50px_rgba(0,0,0,0.12)]">
                    <div>
                        <label className="label">Max price per session (₹)</label>
                        <input
                            type="number"
                            min="0"
                            value={filters.maxPrice}
                            onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                            placeholder="Any"
                            className="input"
                        />
                    </div>
                    <label className="flex cursor-pointer items-center justify-between gap-3 text-sm font-medium">
                        Open slot this week
                        <input
                            type="checkbox"
                            checked={filters.openOnly}
                            onChange={(e) => setFilters({ ...filters, openOnly: e.target.checked })}
                            className="h-5 w-5 accent-ink"
                        />
                    </label>
                    <button onClick={() => setFilters({ maxPrice: '', openOnly: false })} className="btn btn-soft w-full">Clear</button>
                </div>
            )}
        </div>
    );
};

// ---------- Page ----------

const Discover = () => {
    const { user } = useAuth();
    const { profile } = useMyProfile();
    const isPro = useSubscription();
    const { bookings, reload: reloadBookings } = useMyBookings();

    const [coaches, setCoaches] = useState([]);
    const [allCoaches, setAllCoaches] = useState([]); // unfiltered, for the hero text and "near you"
    const [search, setSearch] = useState({ sport: '', location: '', level: '' });
    const [sportChip, setSportChip] = useState('All');
    const [sortKey, setSortKey] = useState('top');
    const [filters, setFilters] = useState({ maxPrice: '', openOnly: false });
    const [loading, setLoading] = useState(true);
    const [spotlight, setSpotlight] = useState(null);
    const [recommended, setRecommended] = useState([]);

    const fetchCoaches = useCallback((params = {}) =>
        API.get('/users/coaches', { params }).then((res) => {
            setCoaches(res.data);
            if (!Object.keys(params).length) setAllCoaches(res.data);
        }), []);

    const { followState, toggleFollow } = useFollowingIds();

    // Initial load: coaches, spotlight, recommendations
    useEffect(() => {
        fetchCoaches().catch(console.error).finally(() => setLoading(false));
        API.get('/spotlight/current').then((res) => setSpotlight(res.data)).catch(() => {});
        if (user.role === 'learner') {
            API.get('/users/recommended').then((res) => setRecommended(res.data)).catch(() => {});
        }
    }, [fetchCoaches, user.role]);

    const currentParams = () => {
        const params = {};
        if (search.sport.trim()) params.sport = search.sport.trim();
        if (search.location.trim()) params.location = search.location.trim();
        if (search.level) params.skillLevelTaught = search.level;
        return params;
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setSportChip('All');
        setLoading(true);
        fetchCoaches(currentParams()).catch(console.error).finally(() => setLoading(false));
    };

    // Book the slot shown on the card
    const handleBook = async (coach, next) => {
        if (!window.confirm(`Book ${coach.name} for ${next.day.label}, ${next.slot.timeSlot}?`)) return;
        try {
            await API.post('/bookings', { coachId: coach._id, day: next.day.dayName, timeSlot: next.slot.timeSlot });
            alert('Booking request sent! The coach will confirm it.');
            reloadBookings();
            fetchCoaches(currentParams()).catch(console.error); // refresh taken slots
        } catch (err) {
            alert(err.response?.data?.message || 'Something went wrong');
            fetchCoaches(currentParams()).catch(console.error);
        }
    };

    // ---------- Derived lists ----------
    const sportCounts = coaches.reduce((acc, c) => {
        const s = normalizeSport(c.sport);
        if (s) acc[s] = (acc[s] || 0) + 1;
        return acc;
    }, {});
    const sports = Object.keys(sportCounts).sort((a, b) => sportCounts[b] - sportCounts[a]);

    const visible = coaches
        .map((c) => {
            const next = nextOpenSlot(c.availability, c.takenSlots);
            return { ...c, _next: next, _soonest: next ? next.day.date.getTime() + (next.slot.start ?? 0) * 60000 : Infinity };
        })
        .filter((c) => sportChip === 'All' || normalizeSport(c.sport) === sportChip)
        .filter((c) => !filters.maxPrice || (c.pricePerSession ?? Infinity) <= Number(filters.maxPrice))
        .filter((c) => !filters.openOnly || c._next)
        .sort(SORTS[sortKey].fn);

    const topSports = [...new Set(allCoaches.map((c) => normalizeSport(c.sport)).filter(Boolean))].slice(0, 2);
    const myCity = profile.location?.trim().toLowerCase();
    const nearYou = myCity
        ? allCoaches
            .filter((c) => c._id !== user._id && c.location?.toLowerCase().includes(myCity))
            .sort(SORTS.top.fn)
            .slice(0, 3)
        : [];

    return (
        <div className="page grid max-w-[1680px] gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">

            {/* ===================== MAIN COLUMN ===================== */}
            <div className="min-w-0 space-y-6">
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">

                    {/* ---------- Search hero ---------- */}
                    <section className="card sm:p-8">
                        <h1 className="text-4xl font-black tracking-tighter sm:text-5xl">
                            Find your <span className="rounded-2xl bg-lime px-3">coach</span>
                        </h1>
                        <p className="mt-3 text-muted">
                            {allCoaches.length
                                ? `${allCoaches.length} ${allCoaches.length === 1 ? 'coach' : 'coaches'}${topSports.length ? ` across ${topSports.join(', ').toLowerCase()} and more` : ''}`
                                : 'Coaches across every sport'}
                        </p>

                        <div className="@container mt-6">
                        <form onSubmit={handleSearch} className="flex flex-col gap-1 rounded-3xl bg-canvas p-1.5 @2xl:flex-row @2xl:items-center @2xl:rounded-full">
                            <div className="grid min-w-0 flex-1 grid-cols-1 divide-y divide-line @md:grid-cols-3 @md:divide-x @md:divide-y-0">
                            <SearchField icon={Search} label="Sport">
                                <input
                                    value={search.sport}
                                    onChange={(e) => setSearch({ ...search, sport: e.target.value })}
                                    placeholder="Any sport"
                                    className="w-full bg-transparent font-medium outline-none placeholder:text-ink/40"
                                />
                            </SearchField>
                            <SearchField icon={MapPin} label="Location">
                                <input
                                    value={search.location}
                                    onChange={(e) => setSearch({ ...search, location: e.target.value })}
                                    placeholder="Anywhere"
                                    className="w-full bg-transparent font-medium outline-none placeholder:text-ink/40"
                                />
                            </SearchField>
                            <SearchField icon={BarChart3} label="Level">
                                <select
                                    value={search.level}
                                    onChange={(e) => setSearch({ ...search, level: e.target.value })}
                                    className="w-full cursor-pointer bg-transparent font-medium outline-none"
                                >
                                    <option value="">Any level</option>
                                    <option value="beginner">Beginner</option>
                                    <option value="intermediate">Intermediate</option>
                                    <option value="advanced">Advanced</option>
                                </select>
                            </SearchField>
                            </div>
                            <button type="submit" className="btn btn-dark w-full px-7 py-3.5 text-base @2xl:w-auto">
                                <Search size={18} /> Search
                            </button>
                        </form>
                        </div>
                    </section>

                    <PromoCard showPremium={user.role === 'learner' && !isPro} />
                </div>

                {/* ---------- Top coaches ---------- */}
                <section>
                    <div className="mb-5 flex flex-wrap items-center gap-3">
                        <h2 className="section-title mr-1">Top coaches</h2>
                        <div className="-mx-1 flex max-w-full flex-1 gap-2 overflow-x-auto px-1 pb-1">
                            {['All', ...sports].map((s) => (
                                <button key={s} onClick={() => setSportChip(s)} className={`chip gap-1.5 ${sportChip === s ? 'chip-active' : ''}`}>
                                    {s !== 'All' && <span aria-hidden="true">{sportEmoji(s)}</span>}
                                    {s}
                                    <span className={sportChip === s ? 'text-white/60' : 'text-muted'}>
                                        {s === 'All' ? coaches.length : sportCounts[s]}
                                    </span>
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="chip gap-1 pr-2">
                                <span className="text-muted">Sort:</span>
                                <select value={sortKey} onChange={(e) => setSortKey(e.target.value)} className="cursor-pointer bg-transparent font-medium outline-none">
                                    {Object.entries(SORTS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
                                </select>
                            </label>
                            <FiltersButton filters={filters} setFilters={setFilters} />
                        </div>
                    </div>

                    {loading ? (
                        <p className="empty-state">Loading coaches...</p>
                    ) : visible.length === 0 ? (
                        <p className="empty-state">No coaches match. Try a different search or clear the filters.</p>
                    ) : (
                        <div className="grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(min(100%,330px),1fr))]">
                            {visible.map((coach) => (
                                <CoachCard
                                    key={coach._id}
                                    coach={coach}
                                    canFollow={coach._id !== user._id}
                                    followState={followState(coach._id)}
                                    onToggleFollow={toggleFollow}
                                    canBook={user.role === 'learner'}
                                    onBook={handleBook}
                                />
                            ))}
                        </div>
                    )}
                </section>
            </div>

            {/* ===================== RIGHT COLUMN ===================== */}
            <aside className="space-y-6">
                <NextSessionCard user={user} bookings={bookings} />

                {/* Coaches in my city; learners without a city (or matches) see recommendations */}
                {(nearYou.length > 0 || recommended.length > 0) && (
                    <section className="card">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-bold tracking-tight">{nearYou.length ? 'Coaches near you' : 'Recommended for you'}</h2>
                            {nearYou.length > 0 && <span className="text-sm capitalize text-muted">{profile.location}</span>}
                        </div>
                        <ul className="space-y-3">
                            {(nearYou.length ? nearYou : recommended.slice(0, 3)).map((c) => (
                                <li key={c._id}>
                                    <Link to={`/profile-view/${c._id}`} className="flex items-center gap-3 rounded-2xl transition-colors hover:bg-canvas">
                                        <Avatar name={c.name} photo={c.profilePhoto} pastel className="h-11 w-11 text-sm" />
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate font-semibold">{c.name}</p>
                                            <p className="flex items-center gap-1 truncate text-sm text-muted">
                                                {c.sport}
                                                {(c.rating || Number(c.avgRating) > 0) && <> · <Star size={12} className="fill-muted" /> {c.rating || c.avgRating}</>}
                                            </p>
                                        </div>
                                        {c.pricePerSession && <span className="badge shrink-0 bg-canvas text-muted">₹{c.pricePerSession}</span>}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                {spotlight && (
                    <section className="card">
                        <span className="badge bg-lime text-ink">Athlete of the month</span>
                        <p className="mt-3 text-lg font-bold">{spotlight.athlete.name}</p>
                        <p className="text-sm text-muted">{spotlight.athlete.sport} · Sponsored by {spotlight.sponsorBrand.companyName}</p>
                    </section>
                )}
            </aside>
        </div>
    );
};

export default Discover;
