// NextSessionCard.jsx
// "Upcoming session" card on Discover: the user's next session with a date
// tile, status, and actions.

import { Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { fromISODate } from '../utils/slots';
import { upcomingSessions } from '../utils/sessions';

const NextSessionCard = ({ user, bookings }) => {
    const booking = upcomingSessions(bookings)[0];
    const other = booking && (user.role === 'coach' ? booking.learner : booking.coach);
    const date = booking?.date && fromISODate(booking.date);

    return (
        <section className="card">
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold tracking-tight">Upcoming session</h2>
                <Link to="/calendar" className="text-sm text-muted hover:text-ink">See all</Link>
            </div>

            {!booking ? (
                <p className="py-2 text-sm text-muted">No sessions booked yet. Pick a coach and a slot to get started.</p>
            ) : (
                <>
                    <div className="flex items-start gap-4">
                        <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-ink text-on-ink">
                            <span className="text-2xl font-extrabold leading-none">{date ? date.getDate() : '—'}</span>
                            <span className="mt-1 text-[11px] font-bold uppercase text-on-ink/60">{booking.day?.slice(0, 3)}</span>
                        </div>
                        <div className="min-w-0">
                            <p className="truncate font-semibold">Session with {other?.name || 'your coach'}</p>
                            <p className="truncate text-sm text-muted">
                                {[booking.timeSlot, other?.location].filter(Boolean).join(' · ')}
                            </p>
                            <span className={`badge mt-2 ${booking.status === 'confirmed' ? 'bg-ok/15 text-ok' : 'bg-warn/15 text-warn'}`}>
                                {booking.status === 'confirmed'
                                    ? 'Confirmed'
                                    : user.role === 'coach' ? 'Waiting for your reply' : 'Waiting for coach'}
                            </span>
                        </div>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-2">
                        <Link to="/calendar" className="btn btn-soft">Calendar</Link>
                        {booking.status === 'confirmed' ? (
                            <Link to={`/chat/${booking._id}`} className="btn btn-dark"><MessageCircle size={16} /> Chat</Link>
                        ) : (
                            <Link to="/calendar" className="btn btn-dark">View details</Link>
                        )}
                    </div>
                </>
            )}
        </section>
    );
};

export default NextSessionCard;
