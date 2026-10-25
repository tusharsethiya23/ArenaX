// CoachCard.jsx
// Coach card on Discover: avatar, name + verified badge, sport and rating,
// detail chips, how well they match the athlete (athletes only), the next
// open slot, and a Book button. The avatar and name open the coach's
// profile; the Follow button follows/unfollows them.

import { Link } from 'react-router-dom';
import { Clock, Star, Check, Hourglass } from 'lucide-react';
import Avatar from './Avatar';
import VerifiedBadge from './VerifiedBadge';
import MatchBadge from './MatchBadge';
import { nextOpenSlot } from '../utils/slots';
import MessageButton from './MessageButton';

const Chip = ({ children }) => (
    <span className="badge bg-canvas font-medium text-ink">{children}</span>
);

// "advanced" -> "Advanced"
const capitalize = (s = '') => s.charAt(0).toUpperCase() + s.slice(1);

const CoachCard = ({ coach, match, followState = 'none', canFollow, onToggleFollow, canBook, onBook }) => {
    const next = nextOpenSlot(coach.availability, coach.takenSlots);
    const hasSlots = coach.availability?.length > 0;
    const profileUrl = `/profile-view/${coach._id}`;

    return (
        <article className="flex flex-col rounded-[28px] bg-surface p-5">
            {/* ---------- Header: avatar + name link to the profile ---------- */}
            <div className="flex items-start gap-3">
                <Link to={profileUrl} aria-label={`${coach.name}'s profile`} className="shrink-0 rounded-full transition-opacity hover:opacity-85">
                    <Avatar name={coach.name} photo={coach.profilePhoto} pastel className="h-14 w-14 text-lg" />
                </Link>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                        <Link to={profileUrl} className="truncate text-lg font-bold tracking-tight hover:underline">
                            {coach.name}
                        </Link>
                        {coach.verified && <VerifiedBadge />}
                    </div>
                    <p className="flex items-center gap-1 truncate text-sm text-muted">
                        {coach.sport && <span>{coach.sport} ·</span>}
                        {coach.rating ? (
                            <>
                                <Star size={13} className="fill-highlight text-highlight" /> {coach.rating}
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
                        aria-label={{ following: `Unfollow ${coach.name}`, requested: `Cancel follow request to ${coach.name}` }[followState] || `Follow ${coach.name}`}
                        className={`btn shrink-0 px-4 py-2 ${followState === 'none' ? 'btn-dark' : 'btn-soft'}`}
                    >
                        {followState === 'following' && <><Check size={15} /> Following</>}
                        {followState === 'requested' && <><Hourglass size={15} /> Requested</>}
                        {followState === 'none' && 'Follow'}
                    </button>
                )}
                {canFollow && followState === 'following' && <MessageButton compact userId={coach._id} name={coach.name} />}
            </div>

            {/* ---------- Detail chips ---------- */}
            <div className="mt-4 flex flex-wrap gap-2">
                {coach.skillLevelTaught && <Chip>{capitalize(coach.skillLevelTaught)}</Chip>}
                {coach.yearsExperience > 0 && <Chip>{coach.yearsExperience} yrs exp</Chip>}
                {coach.location && <Chip>{coach.location}</Chip>}
            </div>

            {/* ---------- Match for the logged-in athlete ---------- */}
            {match && (
                <div className="mt-3 flex items-start gap-2 text-sm">
                    <MatchBadge score={match.score} />
                    {match.reasons[0] && <span className="min-w-0 pt-0.5 text-muted">{match.reasons[0].text}</span>}
                </div>
            )}

            {/* ---------- Next slot ---------- */}
            <div className={`mt-4 flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm ${next ? 'bg-white/[0.08] text-highlight' : 'bg-canvas text-muted'}`}>
                <Clock size={15} className="shrink-0" />
                {next ? (
                    <span className="truncate">
                        Next slot: <span className="font-bold">{next.day.label}, {next.slot.label}</span>
                    </span>
                ) : (
                    <span>{hasSlots ? 'Fully booked for 2 weeks' : 'No slots listed yet'}</span>
                )}
            </div>

            {/* ---------- Book (learners, when a slot is open) ---------- */}
            {/* mt-auto keeps Book at the bottom so buttons line up across a row */}
            {canBook && next && (
                <div className="mt-auto pt-4">
                    <button onClick={() => onBook(coach, next)} className="btn btn-dark w-full py-3">
                        Book
                    </button>
                </div>
            )}
        </article>
    );
};

export default CoachCard;
