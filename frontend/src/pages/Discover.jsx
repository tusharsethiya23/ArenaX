// Discover.jsx
// Find a coach. Layout:
//   top left:   search hero (sport / location / level) + promo card
//   top right:  upcoming session, best-matching coaches (athletes) or coaches
//               in your city, athlete spotlight
//   full width: "Top coaches" with sport chips, sort and filters, then the
//               coach cards (3 per row from 1280px, 2 on tablets/small laptops)
// On smaller screens everything stacks: hero, top coaches, then the side cards.
// Search hits the backend (/users/coaches); chips, sort and filters then work
// on the loaded results in the browser.

import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, MapPin, BarChart3, SlidersHorizontal, ArrowRight, Star, Check } from 'lucide-react';
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
import MatchBadge from '../components/MatchBadge';
import Select from '../components/Select';
import { nextOpenSlot } from '../utils/slots';
import { normalizeSport, sportEmoji } from '../utils/sports';

const SORTS = {
    // Athletes only: coaches outside their sport have no match (-1) and come last
    match: { label: 'Best match', fn: (a, b) => b._match - a._match || (b.rating ?? 0) - (a.rating ?? 0) },
    top: { label: 'Top rated', fn: (a, b) => (b.rating ?? 0) - (a.rating ?? 0) || b.reviewCount - a.reviewCount },
    soonest: { label: 'Soonest slot', fn: (a, b) => a._soonest - b._soonest },
    priceLow: { label: 'Price: low to high', fn: (a, b) => (a.pricePerSession ?? Infinity) - (b.pricePerSession ?? Infinity) },
    priceHigh: { label: 'Price: high to low', fn: (a, b) => (b.pricePerSession ?? -1) - (a.pricePerSession ?? -1) },
    experience: { label: 'Most experienced', fn: (a, b) => (b.yearsExperience ?? 0) - (a.yearsExperience ?? 0) },
};

// ---------- Small pieces ----------

// A labelled field in the search bar. Dropdowns use a <div> wrapper: a <label>
// would re-open the list on every click inside it.
const SearchField = ({ icon: Icon, label, children, as: Tag = 'label', tone = '' }) => (
    <Tag className="flex min-w-0 flex-1 items-center gap-3 px-5 py-2.5">
        <Icon size={18} className={`shrink-0 ${tone}`} />
        <span className="min-w-0 flex-1">
            <span className="block text-xs text-muted">{label}</span>
            {children}
        </span>
    </Tag>
);

const LEVEL_OPTIONS = [
    { value: '', label: 'Any level' },
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
];

const PromoCard = ({ showPremium }) => (
    <section className="flex flex-col justify-between rounded-[32px] bg-surface p-6 text-ink backdrop-blur-2xl sm:p-8">
        {showPremium ? (
            <>
                <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-ink/65">Learner Premium</p>
                    <h2 className="mt-2 text-3xl font-black leading-tight tracking-tighter">Priority booking with top coaches</h2>
                </div>
                <Link to="/subscription" className="btn btn-dark mt-6 self-start">See plans <ArrowRight size={16} /></Link>
            </>
        ) : (
            <>
                <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-ink/65">AI coach</p>
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
                <SlidersHorizontal size={15} /> Filters{active > 0 && <span className="badge bg-white px-2 py-0 text-on-ink">{active}</span>}
            </button>
            {open && (
                <div className="absolute right-0 top-full z-30 mt-2 w-64 space-y-4 rounded-3xl border border-line bg-popover p-5 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.12)]">
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
                        Open slot in the next 2 weeks
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

// "Based on your Fitness and Speed & agility gaps" / a nudge to set up DNA
const matchBasis = ({ hasDna, goal, needs }) => {
    if (!hasDna) return null;
    const names = needs.map((n) => n.label);
    const list = names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names.at(-1)}` : names[0];
    if (!list) return 'Based on your level, city and schedule';
    return goal ? `Based on your ${list} ${names.length > 1 ? 'gaps' : 'gap'}` : `Based on your weaker skills: ${list}`;
};

// Top three coaches for the athlete, each with why they match
const BestMatches = ({ matches }) => {
    const basis = matchBasis(matches.basis);
    return (
        <section className="card">
            <h2 className="text-lg font-bold tracking-tight">Best matches for you</h2>
            {basis ? (
                <p className="mb-4 text-sm text-muted">{basis}</p>
            ) : (
                <p className="mb-4 text-sm text-muted">
                    <Link to="/dna" className="font-semibold text-ink underline">Set up your Athlete DNA</Link> to match coaches to your weak spots.
                </p>
            )}
            <ul className="space-y-5">
                {matches.coaches.slice(0, 3).map((c) => (
                    <li key={c._id}>
                        <Link to={`/profile-view/${c._id}`} className="group flex items-start gap-3">
                            <Avatar name={c.name} photo={c.profilePhoto} pastel className="h-11 w-11 text-sm" />
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                    <p className="truncate font-semibold group-hover:underline">{c.name}</p>
                                    <MatchBadge score={c.match.score} />
                                </div>
                                <ul className="mt-1 space-y-0.5 text-sm text-muted">
                                    {c.match.reasons.slice(0, 2).map((r) => (
                                        <li key={r.text} className="flex gap-1.5">
                                            <Check size={14} className="mt-0.5 shrink-0 text-ink" /> {r.text}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </Link>
                    </li>
                ))}
            </ul>
        </section>
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
    const isLearner = user.role === 'learner';
    const [searchParams] = useSearchParams();
    const [sortKey, setSortKey] = useState(() => {
        const wanted = searchParams.get('sort');
        if (SORTS[wanted] && (wanted !== 'match' || isLearner)) return wanted;
        return isLearner ? 'match' : 'top';
    });
    const [filters, setFilters] = useState({ maxPrice: '', openOnly: false });
    const [loading, setLoading] = useState(true);
    const [spotlight, setSpotlight] = useState(null);
    const [matches, setMatches] = useState(null); // { basis, coaches } for athletes

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
        if (isLearner) {
            API.get('/match/coaches').then((res) => setMatches(res.data)).catch(() => {});
        }
    }, [fetchCoaches, isLearner]);
    const matchById = Object.fromEntries((matches?.coaches || []).map((c) => [c._id, c.match]));

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
            await API.post('/bookings', { coachId: coach._id, date: next.day.iso, timeSlot: next.slot.timeSlot });
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
            return {
                ...c,
                _next: next,
                _soonest: next ? next.day.date.getTime() + (next.slot.start ?? 0) * 60000 : Infinity,
                _match: matchById[c._id]?.score ?? -1,
            };
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
        <div className="page grid max-w-[1680px] grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">

            {/* ===================== TOP LEFT: search + promo ===================== */}
            <div className="min-w-0 xl:col-start-1 xl:row-start-1">
                <div className="grid h-full grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">

                    {/* ---------- Search hero (centred vertically when the side column is taller) ---------- */}
                    <section className="card flex flex-col justify-center sm:p-8">
                        <h1 className="text-4xl font-black tracking-tighter sm:text-5xl">
                            Find your <span className="rounded-2xl bg-white px-3 text-on-ink">coach</span>
                        </h1>
                        <p className="mt-3 text-muted">
                            {allCoaches.length
                                ? `${allCoaches.length} ${allCoaches.length === 1 ? 'coach' : 'coaches'}${topSports.length ? ` across ${topSports.join(', ').toLowerCase()} and more` : ''}`
                                : 'Coaches across every sport'}
                        </p>

                        <div className="@container mt-6">
                        <form onSubmit={handleSearch} className="flex flex-col gap-1 rounded-3xl bg-canvas p-1.5 @2xl:flex-row @2xl:items-center @2xl:rounded-full">
                            <div className="grid min-w-0 flex-1 grid-cols-1 divide-y divide-line @md:grid-cols-3 @md:divide-x @md:divide-y-0">
                            <SearchField icon={Search} label="Sport" tone="text-accent">
                                <input
                                    value={search.sport}
                                    onChange={(e) => setSearch({ ...search, sport: e.target.value })}
                                    placeholder="Any sport"
                                    className="w-full bg-transparent font-medium outline-none placeholder:text-ink/40"
                                />
                            </SearchField>
                            <SearchField icon={MapPin} label="Location" tone="text-data-pink">
                                <input
                                    value={search.location}
                                    onChange={(e) => setSearch({ ...search, location: e.target.value })}
                                    placeholder="Anywhere"
                                    className="w-full bg-transparent font-medium outline-none placeholder:text-ink/40"
                                />
                            </SearchField>
                            <SearchField icon={BarChart3} label="Level" as="div" tone="text-data-mint">
                                <Select
                                    variant="inline"
                                    aria-label="Level"
                                    value={search.level}
                                    onChange={(level) => setSearch({ ...search, level })}
                                    options={LEVEL_OPTIONS}
                                    className="w-full"
                                    buttonClassName="w-full justify-between"
                                />
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
            </div>

            {/* ===================== FULL WIDTH: top coaches ===================== */}
            <section className="min-w-0 xl:col-span-2 xl:row-start-2">
                <div className="mb-5 flex flex-wrap items-center gap-3">
                    <h2 className="section-title mr-1">Top coaches</h2>
                    <div className="-mx-1 flex max-w-full flex-1 gap-2 overflow-x-auto px-1 pb-1">
                        {['All', ...sports].map((s) => (
                            <button key={s} onClick={() => setSportChip(s)} className={`chip gap-1.5 ${sportChip === s ? 'chip-active' : ''}`}>
                                {s !== 'All' && <span aria-hidden="true">{sportEmoji(s)}</span>}
                                {s}
                                <span className={sportChip === s ? 'text-accent/75' : 'text-muted'}>
                                    {s === 'All' ? coaches.length : sportCounts[s]}
                                </span>
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="chip gap-1 pr-3">
                            <span className="text-muted">Sort:</span>
                            <Select
                                variant="inline"
                                aria-label="Sort coaches"
                                value={sortKey}
                                onChange={setSortKey}
                                options={Object.entries(SORTS)
                                    .filter(([k]) => k !== 'match' || isLearner)
                                    .map(([k, s]) => ({ value: k, label: s.label }))}
                            />
                        </div>
                        <FiltersButton filters={filters} setFilters={setFilters} />
                    </div>
                </div>

                {loading ? (
                    <p className="empty-state">Loading coaches...</p>
                ) : visible.length === 0 ? (
                    <p className="empty-state">No coaches match. Try a different search or clear the filters.</p>
                ) : (
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {visible.map((coach) => (
                            <CoachCard
                                key={coach._id}
                                coach={coach}
                                match={matchById[coach._id]}
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

            {/* ===================== TOP RIGHT ===================== */}
            <aside className="space-y-6 xl:col-start-2 xl:row-start-1">
                <NextSessionCard user={user} bookings={bookings} />

                {/* Athletes: best matches for their DNA gaps, with the reasons */}
                {isLearner && matches?.coaches.length > 0 && <BestMatches matches={matches} />}

                {/* Everyone else: coaches in my city */}
                {!isLearner && nearYou.length > 0 && (
                    <section className="card">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-bold tracking-tight">Coaches near you</h2>
                            <span className="text-sm capitalize text-muted">{profile.location}</span>
                        </div>
                        <ul className="space-y-3">
                            {nearYou.map((c) => (
                                <li key={c._id}>
                                    <Link to={`/profile-view/${c._id}`} className="flex items-center gap-3 rounded-2xl transition-colors hover:bg-canvas">
                                        <Avatar name={c.name} photo={c.profilePhoto} pastel className="h-11 w-11 text-sm" />
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate font-semibold">{c.name}</p>
                                            <p className="flex items-center gap-1 truncate text-sm text-muted">
                                                {c.sport}
                                                {c.rating && <> · <Star size={12} className="fill-highlight text-highlight" /> {c.rating}</>}
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
                        <span className="badge bg-white text-on-ink">Athlete of the month</span>
                        <p className="mt-3 text-lg font-bold">{spotlight.athlete.name}</p>
                        <p className="text-sm text-muted">{spotlight.athlete.sport} · Sponsored by {spotlight.sponsorBrand.companyName}</p>
                    </section>
                )}
            </aside>
        </div>
    );
};

export default Discover;
