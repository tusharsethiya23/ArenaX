// Calendar.jsx
// All of the user's sessions on real dates: a month grid on the left and
// lists on the right:
//   Needs your answer: requests (coaches) and new times the other person suggested
//   Ready to mark completed (coaches): confirmed sessions that have started
//   Upcoming: pending and confirmed, soonest first
//   Past: completed, declined, cancelled and expired, newest first
// Picking a day on the grid narrows every list to that day.

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import useMyBookings from '../hooks/useMyBookings';
import PageHeader from '../components/PageHeader';
import MonthCalendar from '../components/calendar/MonthCalendar';
import SessionCard from '../components/calendar/SessionCard';
import { fmtDate, hasStarted, isUpcoming, byStart } from '../utils/sessions';

const PAST_PAGE = 6;

const Section = ({ title, items, empty, children, ...card }) => {
    if (!items.length && !empty) return null;
    return (
        <section>
            <h2 className="mb-3 flex items-center gap-2 text-lg font-bold tracking-tight">
                {title} {items.length > 0 && <span className="badge bg-surface px-2 py-0.5 text-ink">{items.length}</span>}
            </h2>
            {items.length === 0 ? (
                <p className="rounded-2xl bg-surface px-5 py-6 text-sm text-muted">{empty}</p>
            ) : (
                <div className="space-y-3">
                    {items.map((b) => <SessionCard key={b._id} booking={b} {...card} />)}
                </div>
            )}
            {children}
        </section>
    );
};

const Calendar = () => {
    const { user } = useAuth();
    const isCoach = user.role === 'coach';
    const { bookings, loaded, reload } = useMyBookings();
    const [day, setDay] = useState(null);
    const [pastShown, setPastShown] = useState(PAST_PAGE);

    const onDay = day ? bookings.filter((b) => b.date === day || (b.reschedule && b.reschedule.date === day)) : bookings;
    const active = (b) => ['pending', 'confirmed'].includes(b.status);
    const waitingOnMe = (b) => active(b) && (
        (isCoach && b.status === 'pending' && !b.reschedule && !hasStarted(b))
        || (b.reschedule && String(b.reschedule.by) !== String(user._id))
    );

    const needsAnswer = onDay.filter(waitingOnMe).sort(byStart);
    const toComplete = isCoach ? onDay.filter((b) => b.status === 'confirmed' && hasStarted(b)).sort(byStart) : [];
    const upcoming = onDay.filter((b) => isUpcoming(b) && !waitingOnMe(b)).sort(byStart);
    const past = onDay.filter((b) => !isUpcoming(b) && !waitingOnMe(b) && !toComplete.includes(b)).sort((a, b) => byStart(b, a));
    const card = { me: user._id, isCoach, onChanged: reload };

    return (
        <div className="page max-w-6xl">
            <PageHeader
                title="Calendar"
                subtitle={isCoach ? 'Your sessions with athletes' : 'Your sessions with coaches'}
            />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[340px_minmax(0,1fr)] lg:items-start">
                <div className="lg:sticky lg:top-24">
                    <MonthCalendar bookings={bookings} selected={day} onSelect={(d) => { setDay(d); setPastShown(PAST_PAGE); }} />
                </div>

                <div className="min-w-0 space-y-8">
                    {day && (
                        <div className="flex items-center justify-between gap-3 rounded-full bg-surface py-2 pl-5 pr-2">
                            <p className="text-sm">
                                Showing <b>{fmtDate(day, { weekday: 'long', day: 'numeric', month: 'long' })}</b>
                                <span className="text-muted"> · {onDay.length} {onDay.length === 1 ? 'session' : 'sessions'}</span>
                            </p>
                            <button onClick={() => setDay(null)} className="btn btn-soft px-3 py-1.5 text-sm"><X size={14} /> All dates</button>
                        </div>
                    )}

                    {!loaded ? (
                        <p className="empty-state">Loading...</p>
                    ) : (
                        <>
                            <Section title="Needs your answer" items={needsAnswer} {...card} />
                            <Section title="Ready to mark completed" items={toComplete} {...card} />
                            <Section
                                title="Upcoming"
                                items={upcoming}
                                empty={day ? 'Nothing booked on this day.' : isCoach
                                    ? 'No upcoming sessions. Requests from athletes show up here once you accept them.'
                                    : <>No upcoming sessions. <Link to="/discover" className="font-semibold text-ink underline">Find a coach</Link> to book one.</>}
                                {...card}
                            />
                            <Section title="Past" items={past.slice(0, pastShown)} {...card}>
                                {past.length > pastShown && (
                                    <button onClick={() => setPastShown(pastShown + PAST_PAGE)} className="btn btn-soft mt-3 w-full">
                                        Show more ({past.length - pastShown})
                                    </button>
                                )}
                            </Section>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Calendar;
