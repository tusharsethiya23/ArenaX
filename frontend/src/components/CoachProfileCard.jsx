// CoachProfileCard.jsx
// The coach card at the top of a coach's public profile (design mockup):
//   - stadium header (or their photo) with sport tag, Follow button,
//     rating pill and a "Free today" pill when a slot is open today
//   - name + verified badge, level / experience / location
//   - who follows them
//   - date tabs for the next two weeks (SlotPicker) and that day's time slots;
//     taken or already-past slots are crossed out
//   - a "Book today, 6 PM" button that books the picked slot

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, Check, UserPlus, ArrowRight, Clock, MessageCircle } from 'lucide-react';
import API from '../api/axios';
import Avatar from './Avatar';
import VerifiedBadge from './VerifiedBadge';
import FoundingBadge from './FoundingBadge';
import StadiumArt from './StadiumArt';
import FollowListModal from './FollowListModal';
import SlotPicker from './SlotPicker';
import { upcomingDays, slotsForDay, nextOpenSlot, isOpenSlot } from '../utils/slots';
import { sportEmoji } from '../utils/sports';
import { compact } from '../utils/format';

const DAY_TABS = 14;

const CoachProfileCard = ({ coach, follow, isOwn, canBook, onBooked }) => {
    const availability = coach.availability || [];
    const freeToday = slotsForDay(availability, coach.takenSlots, upcomingDays(1)[0]).some(isOpenSlot);

    // Start with the first open slot selected
    const [pick, setPick] = useState(() => nextOpenSlot(availability, coach.takenSlots, DAY_TABS));
    const [booking, setBooking] = useState(false);
    const [message, setMessage] = useState(null); // { text, error }
    const [followers, setFollowers] = useState([]);
    const [showFollowers, setShowFollowers] = useState(false);

    // A few followers for the avatar row (refreshes when the count changes)
    useEffect(() => {
        API.get(`/follows/${coach._id}/followers`).then((res) => setFollowers(res.data)).catch(() => {});
    }, [coach._id, follow.followers]);

    const selectedSlot = pick?.slot;
    const dayWord = pick && (['Today', 'Tomorrow'].includes(pick.day.label) ? pick.day.label.toLowerCase() : pick.day.label);

    const handleBook = async () => {
        if (!selectedSlot) return;
        setBooking(true);
        setMessage(null);
        try {
            await API.post('/bookings', { coachId: coach._id, date: pick.day.iso, timeSlot: selectedSlot.timeSlot });
            setMessage({ text: `Request sent for ${dayWord}, ${selectedSlot.label}. ${coach.name.split(' ')[0]} will confirm it.` });
            setPick({ day: pick.day, slot: null });
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
        <article className="overflow-hidden rounded-2xl bg-surface p-3 sm:p-4">

            {/* ---------- Header image ---------- */}
            <div className="relative h-56 overflow-hidden rounded-[26px] sm:h-64">
                {coach.profilePhoto ? (
                    <>
                        <img src={coach.profilePhoto} alt={coach.name} className="photo absolute inset-0 h-full w-full" />
                        <div className="absolute inset-0 bg-black/30" />
                    </>
                ) : (
                    <StadiumArt dim="bg-black/35" />
                )}

                {coach.sport && (
                    <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-popover px-4 py-2 text-sm font-semibold">
                        <span aria-hidden="true">{sportEmoji(coach.sport)}</span> {coach.sport}
                    </span>
                )}

                {!isOwn && follow.loaded && (
                    <div className="absolute right-4 top-4 flex gap-2">
                        {follow.isFollowing && (
                            <Link to={`/messages/${coach._id}`} aria-label={`Message ${coach.name}`} className="btn bg-panel/90 px-4 text-white hover:bg-panel">
                                <MessageCircle size={16} /> Message
                            </Link>
                        )}
                        <button
                            onClick={follow.toggle}
                            disabled={follow.busy}
                            aria-label={follow.isFollowing ? 'Unfollow' : follow.requested ? 'Cancel follow request' : 'Follow'}
                            className="btn bg-panel/90 px-5 text-white hover:bg-panel"
                        >
                            {follow.isFollowing
                                ? <><Check size={16} /> Following</>
                                : follow.requested ? <><Clock size={16} /> Requested</> : <><UserPlus size={16} /> Follow</>}
                        </button>
                    </div>
                )}

                <span className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full bg-panel/90 px-4 py-2 text-sm font-semibold text-white">
                    {coach.rating ? (
                        <>
                            <Star size={15} className="fill-highlight text-highlight" />
                            <span className="text-highlight">{coach.rating}</span>
                            <span>{coach.reviewCount} {coach.reviewCount === 1 ? 'review' : 'reviews'}</span>
                        </>
                    ) : (
                        'New coach'
                    )}
                </span>

                {freeToday && (
                    <span className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-on-ink">
                        <span className="h-2.5 w-2.5 rounded-full bg-data-mint" /> Free today
                    </span>
                )}
            </div>

            <div className="px-3 pb-3 pt-5 sm:px-4">
                {/* ---------- Name + details ---------- */}
                <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-3xl font-extrabold tracking-tight">{coach.name}</h1>
                    {coach.verified && <VerifiedBadge size={24} />}
                    {coach.foundingMember && <FoundingBadge />}
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

                {/* ---------- Dates + time slots ---------- */}
                {availability.length > 0 ? (
                    <div className="mt-6">
                        <SlotPicker
                            availability={availability}
                            takenSlots={coach.takenSlots}
                            dayCount={DAY_TABS}
                            value={pick}
                            onChange={(p) => { setPick(p); setMessage(null); }}
                            readOnly={!canBook}
                        />
                    </div>
                ) : (
                    <p className="mt-6 rounded-2xl bg-canvas px-4 py-3 text-sm text-muted">
                        {isOwn ? 'You haven\'t listed any slots yet.' : 'This coach hasn\'t listed any slots yet.'}
                    </p>
                )}

                {message && <p className={`mt-4 ${message.error ? 'alert-error' : 'alert-success'}`}>{message.text}</p>}

                {/* ---------- Book ---------- */}
                <div className="mt-6 flex flex-wrap items-center justify-end gap-4 border-t border-line pt-5">
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
