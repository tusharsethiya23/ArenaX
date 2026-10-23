// UpcomingSession.jsx
// Card at the top of the Feed showing the user's next session, linking to
// My bookings. Bookings only store a weekday + time slot (no calendar date),
// so "next" = a confirmed booking first, otherwise one still awaiting the
// coach. Renders nothing when there's no active booking.

import { Link } from 'react-router-dom';
import { CalendarDays, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import useMyBookings from '../hooks/useMyBookings';

const UpcomingSession = () => {
    const { user } = useAuth();
    const { bookings } = useMyBookings();

    // API returns newest first; prefer confirmed over pending
    const booking = bookings.find((b) => b.status === 'confirmed') || bookings.find((b) => b.status === 'pending');
    if (!booking) return null;

    // Coaches see who they're training, everyone else sees their coach
    const other = user.role === 'coach' ? booking.learner : booking.coach;
    const isConfirmed = booking.status === 'confirmed';

    return (
        <Link
            to="/bookings"
            className="group relative mb-5 flex items-center gap-4 overflow-hidden rounded-xl border border-red-500/20 bg-[#071426]/70 p-4 backdrop-blur-md transition-colors hover:border-red-500/45 sm:mb-6 sm:p-5"
        >
            <div className="absolute left-0 top-0 h-full w-1 bg-[#E21B23]" />

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E11D1D]/15 text-[#FF2A2A]">
                <CalendarDays size={20} />
            </div>

            <div className="min-w-0 flex-1">
                <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#FF2A2A] sm:text-[10px]">
                    Upcoming session
                </p>
                <p className="mt-1 truncate text-sm font-semibold text-white sm:text-base">
                    {booking.day} · {booking.timeSlot}
                    {other?.name && <span className="font-normal text-white/50"> with {other.name}</span>}
                </p>
                <p className={`mt-0.5 text-xs ${isConfirmed ? 'text-emerald-400/80' : 'text-white/40'}`}>
                    {isConfirmed ? 'Confirmed' : 'Awaiting confirmation'}
                </p>
            </div>

            <span className="hidden shrink-0 items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-white/50 transition-colors group-hover:text-white sm:flex">
                My bookings <ChevronRight size={14} />
            </span>
            <ChevronRight size={18} className="shrink-0 text-white/40 sm:hidden" />
        </Link>
    );
};

export default UpcomingSession;
