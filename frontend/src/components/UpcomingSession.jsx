// UpcomingSession.jsx
// Compact "Upcoming session" card at the top of the Feed on smaller screens
// (large screens show the full Upcoming sessions list in the SideRail).
// Bookings only store a weekday + time slot (no calendar date), so "next" =
// a confirmed booking first, otherwise one still awaiting the coach.
// Renders nothing when there's no active booking.

import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import useMyBookings from '../hooks/useMyBookings';

const UpcomingSession = ({ className = '' }) => {
    const { user } = useAuth();
    const { bookings } = useMyBookings();

    // API returns newest first; prefer confirmed over pending
    const booking = bookings.find((b) => b.status === 'confirmed') || bookings.find((b) => b.status === 'pending');
    if (!booking) return null;

    // Coaches see who they're training, everyone else sees their coach
    const other = user.role === 'coach' ? booking.learner : booking.coach;
    const isConfirmed = booking.status === 'confirmed';

    return (
        <Link to="/bookings" className={`group flex items-center gap-4 rounded-[28px] bg-surface p-4 ${className}`}>
            <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-ink text-white">
                <span className="text-base font-extrabold leading-none">{booking.day?.slice(0, 3).toUpperCase()}</span>
                <span className="mt-1 text-[10px] font-semibold uppercase text-lime">{isConfirmed ? 'Booked' : 'Pending'}</span>
            </div>

            <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-muted">Upcoming session</p>
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
