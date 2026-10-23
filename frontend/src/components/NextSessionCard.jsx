// NextSessionCard.jsx
// "Upcoming session" card on Discover: the user's next booking with a date
// tile, status, and actions. Bookings store a weekday, so the date shown is
// the next date that falls on that weekday.

import { Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { nextDateFor } from '../utils/slots';

const NextSessionCard = ({ user, bookings }) => {
    // Confirmed first, then ones still waiting for the coach
    const booking = bookings.find((b) => b.status === 'confirmed') || bookings.find((b) => b.status === 'pending');
    const other = booking && (user.role === 'coach' ? booking.learner : booking.coach);
    const date = booking && nextDateFor(booking.day);

    return (
        <section className="card">
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold tracking-tight">Upcoming session</h2>
                <Link to="/bookings" className="text-sm text-muted hover:text-ink">See all</Link>
            </div>

            {!booking ? (
                <p className="py-2 text-sm text-muted">No sessions booked yet. Pick a coach and a slot to get started.</p>
            ) : (
                <>
                    <div className="flex items-start gap-4">
                        <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-ink text-white">
                            <span className="text-2xl font-extrabold leading-none">{date ? date.getDate() : '—'}</span>
                            <span className="mt-1 text-[11px] font-bold uppercase text-lime">{booking.day?.slice(0, 3)}</span>
                        </div>
                        <div className="min-w-0">
                            <p className="truncate font-semibold">Session with {other?.name || 'your coach'}</p>
                            <p className="truncate text-sm text-muted">
                                {[booking.timeSlot, other?.location].filter(Boolean).join(' · ')}
                            </p>
                            <span className={`badge mt-2 ${booking.status === 'confirmed' ? 'bg-lime text-ink' : 'bg-[#FBF0D2] text-[#8A5B00]'}`}>
                                {booking.status === 'confirmed'
                                    ? 'Confirmed'
                                    : user.role === 'coach' ? 'Waiting for your reply' : 'Waiting for coach'}
                            </span>
                        </div>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-2">
                        <Link to="/bookings" className="btn btn-soft">My bookings</Link>
                        {booking.status === 'confirmed' ? (
                            <Link to={`/chat/${booking._id}`} className="btn btn-dark"><MessageCircle size={16} /> Chat</Link>
                        ) : (
                            <Link to="/bookings" className="btn btn-dark">View details</Link>
                        )}
                    </div>
                </>
            )}
        </section>
    );
};

export default NextSessionCard;
