// CoachProfileCard.jsx
// The coach card at the top of a coach's public profile (design mockup):
//   - stadium header (or their photo) with sport tag, Follow button,
//     rating pill and a "Free today" pill when a slot is open today
//   - name + verified badge, level / experience / location
//   - who follows them
//   - day tabs (Today, Tomorrow, next two days) and that day's time slots;
//     taken or already-past slots are crossed out
//   - price and a "Book today, 6 PM" button that books the picked slot

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, Check, UserPlus, ArrowRight } from 'lucide-react';
import API from '../api/axios';
import Avatar from './Avatar';
import VerifiedBadge from './VerifiedBadge';
import StadiumArt from './StadiumArt';
import FollowListModal from './FollowListModal';
import { upcomingDays, slotsForDay } from '../utils/slots';
import { sportEmoji } from '../utils/sports';
import { compact } from '../utils/format';

const DAY_TABS = 4;

const CoachProfileCard = ({ coach, follow, isOwn, canBook, onBooked }) => {
    const days = upcomingDays(DAY_TABS);
    const availability = coach.availability || [];
    const slotsByDay = days.map((d) => slotsForDay(availability, coach.takenSlots, d));
    const isOpen = (s) => !s.taken && !s.past;

    // Start on the first day with an open slot, with that slot selected
    const firstOpenDay = Math.max(0, slotsByDay.findIndex((slots) => slots.some(isOpen)));
    const [dayIndex, setDayIndex] = useState(firstOpenDay);
    const [selected, setSelected] = useState(() => slotsByDay[firstOpenDay]?.find(isOpen)?.timeSlot || null);
    const [booking, setBooking] = useState(false);
    const [message, setMessage] = useState(null); // { text, error }
    const [followers, setFollowers] = useState([]);
    const [showFollowers, setShowFollowers] = useState(false);

    // A few followers for the avatar row (refreshes when the count changes)
    useEffect(() => {
        API.get(`/follows/${coach._id}/followers`).then((res) => setFollowers(res.data)).catch(() => {});
    }, [coach._id, follow.followers]);

    const pickDay = (i) => {
        setDayIndex(i);
        setSelected(slotsByDay[i].find(isOpen)?.timeSlot || null);
        setMessage(null);
    };

    const day = days[dayIndex];
    const daySlots = slotsByDay[dayIndex];
    const selectedSlot = daySlots.find((s) => s.timeSlot === selected);
    const freeToday = slotsByDay[0].some(isOpen);
    const dayWord = dayIndex === 0 ? 'today' : dayIndex === 1 ? 'tomorrow' : day.label;

    const handleBook = async () => {
        if (!selectedSlot) return;
        setBooking(true);
        setMessage(null);
        try {
            await API.post('/bookings', { coachId: coach._id, day: day.dayName, timeSlot: selectedSlot.timeSlot });
            setMessage({ text: `Request sent for ${dayWord}, ${selectedSlot.label}. ${coach.name.split(' ')[0]} will confirm it.` });
            setSelected(null);
            onBooked();
        } catch (err) {
            setMessage({ text: err.response?.data?.message || 'Could not book that slot', error: true });
            onBooked(); // refresh taken slots either way
        }
        setBooking(false);
    };

    // "You and 2.4k others follow" / "120 people follow" / "No followers yet"
    const othersCount = follow.followers - (follow.isFollowing ? 1 : 0);
    const followText = follow.isFollowing
        ? othersCount > 0 ? <>You and <b>{compact(othersCount)}</b> {othersCount === 1 ? 'other' : 'others'} follow</> : <>You follow {coach.name.split(' ')[0]}</>
        : follow.followers > 0 ? <><b>{compact(follow.followers)}</b> {follow.followers === 1 ? 'person follows' : 'people follow'}</> : 'No followers yet';

    return (
        <article className="overflow-hidden rounded-[32px] bg-surface p-3 sm:p-4">

            {/* ---------- Header image ---------- */}
            <div className="relative h-56 overflow-hidden rounded-[26px] sm:h-64">
                {coach.profilePhoto ? (
                    <>
                        <img src={coach.profilePhoto} alt={coach.name} className="absolute inset-0 h-full w-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50" />
                    </>
                ) : (
                    <StadiumArt silhouette={false} fade={false} />
                )}

                {coach.sport && (
                    <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-surface px-4 py-2 text-sm font-semibold">
                        <span aria-hidden="true">{sportEmoji(coach.sport)}</span> {coach.sport}
                    </span>
                )}

                {!isOwn && follow.loaded && (
                    <button
                        onClick={follow.toggle}
                        disabled={follow.busy}
                        aria-label={follow.isFollowing ? 'Unfollow' : 'Follow'}
                        className="btn absolute right-4 top-4 bg-ink px-5 text-white hover:bg-black/80"
                    >
                        {follow.isFollowing ? <><Check size={16} /> Following</> : <><UserPlus size={16} /> Follow</>}
                    </button>
                )}

                <span className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white">
                    {coach.rating ? (
                        <>
                            <Star size={15} className="fill-lime text-lime" />
                            <span className="text-lime">{coach.rating}</span>
                            <span>{coach.reviewCount} {coach.reviewCount === 1 ? 'review' : 'reviews'}</span>
                        </>
                    ) : (
                        'New coach'
                    )}
                </span>

                {freeToday && (
                    <span className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-full bg-lime px-4 py-2 text-sm font-semibold">
                        <span className="h-2.5 w-2.5 rounded-full bg-[#2E8B3A]" /> Free today
                    </span>
                )}
            </div>

            <div className="px-3 pb-3 pt-5 sm:px-4">
                {/* ---------- Name + details ---------- */}
                <div className="flex items-center gap-2">
                    <h1 className="text-3xl font-extrabold tracking-tight">{coach.name}</h1>
                    {coach.verified && <VerifiedBadge size={24} />}
                </div>
                <p className="mt-1 text-muted">
                    {[
                        coach.skillLevelTaught && coach.skillLevelTaught.charAt(0).toUpperCase() + coach.skillLevelTaught.slice(1),
                        coach.yearsExperience > 0 && `${coach.yearsExperience} yrs exp`,
                        coach.location,
                    ].filter(Boolean).join(' · ') || 'Coach'}
                </p>

                {/* ---------- Followers ---------- */}
                <button onClick={() => setShowFollowers(true)} className="mt-4 flex items-center gap-3 text-left text-muted hover:text-ink">
                    {followers.length > 0 && (
                        <span className="flex -space-x-2">
                            {followers.slice(0, 3).map(({ user }) => (
                                <Avatar key={user._id} name={user.name} photo={user.profilePhoto} pastel className="h-8 w-8 text-[10px] ring-2 ring-surface" />
                            ))}
                        </span>
                    )}
                    <span className="text-sm [&_b]:text-ink">{followText}</span>
                </button>

                {/* ---------- Day tabs ---------- */}
                {availability.length > 0 ? (
                    <>
                        <div className="mt-6 flex gap-6 border-b border-line" role="tablist">
                            {days.map((d, i) => (
                                <button
                                    key={d.dayName}
                                    role="tab"
                                    aria-selected={i === dayIndex}
                                    onClick={() => pickDay(i)}
                                    className={`-mb-px border-b-2 pb-2.5 font-semibold transition-colors ${
                                        i === dayIndex ? 'border-ink text-ink' : 'border-transparent text-muted hover:text-ink'
                                    }`}
                                >
                                    {d.label}
                                </button>
                            ))}
                        </div>

                        {/* ---------- Time slots ---------- */}
                        {daySlots.length === 0 ? (
                            <p className="mt-4 rounded-2xl bg-canvas px-4 py-3 text-sm text-muted">No slots on {day.dayName}.</p>
                        ) : (
                            <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
                                {daySlots.map((s) => {
                                    const unavailable = s.taken || s.past;
                                    const isSelected = s.timeSlot === selected;
                                    return (
                                        <button
                                            key={s.timeSlot}
                                            onClick={() => { setSelected(s.timeSlot); setMessage(null); }}
                                            disabled={unavailable || !canBook}
                                            title={s.taken ? 'Already booked' : s.past ? 'Already passed' : s.timeSlot}
                                            className={`rounded-2xl px-2 py-3 text-sm font-bold transition-colors ${
                                                isSelected
                                                    ? 'bg-ink text-lime'
                                                    : unavailable
                                                        ? 'cursor-not-allowed bg-canvas/50 text-muted/60 line-through'
                                                        : canBook ? 'bg-canvas hover:bg-[#E2E2E2]' : 'cursor-default bg-canvas'
                                            }`}
                                        >
                                            {s.label}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </>
                ) : (
                    <p className="mt-6 rounded-2xl bg-canvas px-4 py-3 text-sm text-muted">
                        {isOwn ? 'You haven\'t listed any slots yet.' : 'This coach hasn\'t listed any slots yet.'}
                    </p>
                )}

                {message && <p className={`mt-4 ${message.error ? 'alert-error' : 'alert-success'}`}>{message.text}</p>}

                {/* ---------- Price + book ---------- */}
                <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-5">
                    <p className="text-3xl font-black tracking-tight">
                        {coach.pricePerSession
                            ? <>₹{coach.pricePerSession}<span className="text-base font-normal text-muted"> /session</span></>
                            : <span className="text-base font-normal text-muted">Price on request</span>}
                    </p>
                    {canBook && (
                        <button onClick={handleBook} disabled={!selectedSlot || booking} className="btn btn-lime px-6 py-3.5 text-base">
                            {booking
                                ? 'Booking...'
                                : selectedSlot
                                    ? <>Book {dayWord}, {selectedSlot.label} <ArrowRight size={18} /></>
                                    : 'Pick a time'}
                        </button>
                    )}
                    {isOwn && <Link to="/settings" className="btn btn-soft">Edit availability</Link>}
                </div>
            </div>

            {showFollowers && <FollowListModal userId={coach._id} type="followers" onClose={() => setShowFollowers(false)} />}
        </article>
    );
};

export default CoachProfileCard;
