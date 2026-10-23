// CoachCard.jsx
// Coach card on Discover: avatar, name + verified badge, sport and rating,
// detail chips, the next open slot, price, and Profile / Book actions.
// The heart follows/unfollows the coach.

import { Link } from 'react-router-dom';
import { Heart, Clock, Star } from 'lucide-react';
import Avatar from './Avatar';
import VerifiedBadge from './VerifiedBadge';
import { nextOpenSlot } from '../utils/slots';

const Chip = ({ children }) => (
    <span className="badge bg-canvas font-medium text-ink">{children}</span>
);

// "advanced" -> "Advanced"
const capitalize = (s = '') => s.charAt(0).toUpperCase() + s.slice(1);

const CoachCard = ({ coach, isFollowing, canFollow, onToggleFollow, canBook, onBook }) => {
    const next = nextOpenSlot(coach.availability, coach.takenSlots);
    const hasSlots = coach.availability?.length > 0;

    return (
        <article className="flex flex-col rounded-[28px] bg-surface p-5">
            {/* ---------- Header ---------- */}
            <div className="flex items-start gap-3">
                <Avatar name={coach.name} photo={coach.profilePhoto} pastel className="h-14 w-14 text-lg" />
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                        <Link to={`/profile-view/${coach._id}`} className="truncate text-lg font-bold tracking-tight hover:underline">
                            {coach.name}
                        </Link>
                        {coach.verified && <VerifiedBadge />}
                    </div>
                    <p className="flex items-center gap-1 truncate text-sm text-muted">
                        {coach.sport && <span>{coach.sport} ·</span>}
                        {coach.rating ? (
                            <>
                                <Star size={13} className="fill-muted" /> {coach.rating}
                                <span>({coach.reviewCount})</span>
                            </>
                        ) : (
                            <span>New coach</span>
                        )}
                    </p>
                </div>
                {canFollow && (
                    <button
                        onClick={() => onToggleFollow(coach._id)}
                        aria-label={isFollowing ? `Unfollow ${coach.name}` : `Follow ${coach.name}`}
                        title={isFollowing ? 'Following' : 'Follow'}
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors ${
                            isFollowing ? 'bg-lime' : 'bg-canvas hover:bg-[#E2E2E2]'
                        }`}
                    >
                        <Heart size={16} className={isFollowing ? 'fill-ink' : ''} />
                    </button>
                )}
            </div>

            {/* ---------- Detail chips ---------- */}
            <div className="mt-4 flex flex-wrap gap-2">
                {coach.skillLevelTaught && <Chip>{capitalize(coach.skillLevelTaught)}</Chip>}
                {coach.yearsExperience > 0 && <Chip>{coach.yearsExperience} yrs exp</Chip>}
                {coach.location && <Chip>{coach.location}</Chip>}
            </div>

            {/* ---------- Next slot ---------- */}
            <div className={`mt-4 flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm ${next ? 'bg-lime/25' : 'bg-canvas text-muted'}`}>
                <Clock size={15} className="shrink-0" />
                {next ? (
                    <span className="truncate">
                        Next slot: <span className="font-bold">{next.day.label}, {next.slot.label}</span>
                    </span>
                ) : (
                    <span>{hasSlots ? 'Fully booked this week' : 'No slots listed yet'}</span>
                )}
            </div>

            {/* ---------- Price + actions ---------- */}
            <div className="mt-5 flex items-center justify-between gap-3 border-t border-line pt-4">
                <p className="whitespace-nowrap text-xl font-extrabold tracking-tight">
                    {coach.pricePerSession
                        ? <>₹{coach.pricePerSession}<span className="text-sm font-normal text-muted"> /session</span></>
                        : <span className="text-sm font-normal text-muted">Price on request</span>}
                </p>
                <div className="flex shrink-0 items-center gap-1">
                    <Link to={`/profile-view/${coach._id}`} className="btn px-3 text-ink hover:bg-canvas">Profile</Link>
                    {canBook && next && (
                        <button onClick={() => onBook(coach, next)} className="btn btn-dark">Book</button>
                    )}
                </div>
            </div>
        </article>
    );
};

export default CoachCard;
