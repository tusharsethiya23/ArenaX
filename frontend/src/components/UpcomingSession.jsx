// UpcomingSession.jsx
// Compact "Upcoming session" card at the top of the Feed on smaller screens
// (larger screens show the full Upcoming list in the Feed's right column).
// Shows the soonest pending or confirmed session; renders nothing without one.

import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import useMyBookings from '../hooks/useMyBookings';
import { fromISODate } from '../utils/slots';
import { upcomingSessions } from '../utils/sessions';

const UpcomingSession = ({ className = '' }) => {
    const { user } = useAuth();
    const { bookings } = useMyBookings();

    const booking = upcomingSessions(bookings)[0];
    if (!booking) return null;

    // Coaches see who they're training, everyone else sees their coach
    const other = user.role === 'coach' ? booking.learner : booking.coach;
    const isConfirmed = booking.status === 'confirmed';
    const date = booking.date && fromISODate(booking.date);

    return (
        <Link to="/calendar" className={`group flex items-center gap-4 rounded-[28px] bg-surface p-4 ${className}`}>
            <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-ink text-white">
                <span className="text-base font-extrabold leading-none">
                    {date ? date.getDate() : booking.day?.slice(0, 3).toUpperCase()}
                </span>
                <span className="mt-1 text-[10px] font-semibold uppercase text-lime">{booking.day?.slice(0, 3)}</span>
            </div>

            <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-muted">Upcoming session · {isConfirmed ? 'Confirmed' : 'Pending'}</p>
                <p className="truncate font-semibold">
                    {booking.timeSlot}
                    {other?.name && <span className="font-normal text-muted"> · {other.name}</span>}
                </p>
            </div>

            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-canvas transition-colors group-hover:bg-lime">
                <ArrowUpRight size={16} />
            </span>
        </Link>
    );
};

export default UpcomingSession;
