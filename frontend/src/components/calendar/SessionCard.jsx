// SessionCard.jsx
// One session on the Calendar page: date tile, the other person, time, status,
// and whatever can be done next:
//   coach:   accept / decline a request, mark a finished session completed
//   learner: rate a completed session
//   both:    suggest a new time, answer the other person's suggestion,
//            cancel before it starts, chat, add it to Google Calendar

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, CalendarClock, CalendarPlus, Check, Star } from 'lucide-react';
import API from '../../api/axios';
import Avatar from '../Avatar';
import ReschedulePanel from './ReschedulePanel';
import RateSession from './RateSession';
import { fromISODate } from '../../utils/slots';
import { STATUS, fmtSession, hasStarted, googleCalendarUrl } from '../../utils/sessions';

const EXPIRED = { label: 'Expired', className: 'bg-canvas text-muted' };

const SessionCard = ({ booking: b, me, isCoach, onChanged }) => {
    const [mode, setMode] = useState(null); // 'reschedule' | 'rate' | 'cancel'
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    const other = isCoach ? b.learner : b.coach;
    const otherName = other?.name || (isCoach ? 'The learner' : 'The coach');
    const firstName = otherName.split(' ')[0];
    const started = hasStarted(b);
    const active = ['pending', 'confirmed'].includes(b.status);
    const expired = b.status === 'pending' && started;
    const toComplete = b.status === 'confirmed' && started;
    const badge = expired ? EXPIRED : STATUS[b.status] || STATUS.pending;
    const suggestion = active ? b.reschedule : null;
    const suggestedByMe = suggestion && String(suggestion.by) === String(me);
    const date = b.date && fromISODate(b.date);
    const calendarUrl = b.status === 'confirmed' && !started && googleCalendarUrl(b, `ArenaX session with ${otherName}`);

    const act = async (request) => {
        setBusy(true);
        setError('');
        try {
            await request();
            setMode(null);
            onChanged();
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong');
            onChanged();
        }
        setBusy(false);
    };
    const setStatus = (status) => act(() => API.put(`/bookings/${b._id}`, { status }));
    const answer = (accept) => act(() => API.post(`/bookings/${b._id}/reschedule/respond`, { accept }));
    const done = () => { setMode(null); onChanged(); };

    return (
        <article className="rounded-2xl bg-surface p-4 sm:p-5">
            <div className="flex gap-4">
                {/* Date tile */}
                <div className={`flex h-16 w-14 shrink-0 flex-col items-center justify-center rounded-2xl ${active && !started ? 'bg-ink text-on-ink' : 'bg-canvas'}`}>
                    <span className={`text-[10px] font-bold uppercase ${active && !started ? 'text-on-ink/60' : 'text-muted'}`}>{b.day?.slice(0, 3)}</span>
                    <span className="text-xl font-extrabold leading-tight">{date ? date.getDate() : '—'}</span>
                    <span className="text-[10px] font-semibold uppercase opacity-70">{date ? date.toLocaleDateString(undefined, { month: 'short' }) : ''}</span>
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2.5">
                            <Avatar name={otherName} photo={other?.profilePhoto} pastel className="h-9 w-9 shrink-0 text-xs" />
                            <div className="min-w-0">
                                <Link to={`/profile-view/${other?._id}`} className="block truncate font-semibold hover:underline">{otherName}</Link>
                                <p className="truncate text-sm text-muted">{[b.timeSlot, other?.sport, other?.location].filter(Boolean).join(' · ')}</p>
                            </div>
                        </div>
                        <span className={`badge shrink-0 ${badge.className}`}>{badge.label}</span>
                    </div>

                    {/* ---------- Status notes ---------- */}
                    {suggestion && (
                        <div className="mt-3 rounded-2xl bg-accent/15 px-4 py-3 text-sm text-ink">
                            {suggestedByMe
                                ? <>You suggested <b>{fmtSession(suggestion)}</b>. Waiting for {firstName} to accept.</>
                                : <><b>{firstName}</b> suggested moving to <b>{fmtSession(suggestion)}</b>.</>}
                            <div className="mt-2 flex flex-wrap gap-2">
                                {suggestedByMe ? (
                                    <button onClick={() => answer(false)} disabled={busy} className="btn bg-surface px-4 py-2">Withdraw</button>
                                ) : (
                                    <>
                                        <button onClick={() => answer(true)} disabled={busy} className="btn btn-dark px-4 py-2"><Check size={15} /> Accept new time</button>
                                        <button onClick={() => answer(false)} disabled={busy} className="btn bg-surface px-4 py-2">Keep current time</button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                    {expired && <p className="mt-2 text-sm text-muted">Not answered before the session time.</p>}
                    {toComplete && !isCoach && <p className="mt-2 text-sm text-muted">Waiting for {firstName} to mark it completed.</p>}
                    {b.status === 'cancelled' && (
                        <p className="mt-2 text-sm text-muted">
                            Cancelled {String(b.cancelledBy) === String(me) ? 'by you' : b.cancelledBy ? `by ${firstName}` : ''}
                        </p>
                    )}
                    {b.status === 'completed' && !isCoach && b.reviewed && (
                        <p className="mt-2 flex items-center gap-1 text-sm text-muted"><Star size={14} className="fill-highlight text-highlight" /> You rated this session</p>
                    )}

                    {/* ---------- Actions ---------- */}
                    {mode === null && (
                        <div className="mt-3 flex flex-wrap gap-2">
                            {isCoach && b.status === 'pending' && !started && (
                                <>
                                    <button onClick={() => setStatus('confirmed')} disabled={busy} className="btn btn-lime px-4 py-2">Accept</button>
                                    <button onClick={() => setStatus('declined')} disabled={busy} className="btn btn-soft px-4 py-2">Decline</button>
                                </>
                            )}
                            {isCoach && toComplete && (
                                <button onClick={() => setStatus('completed')} disabled={busy} className="btn btn-lime px-4 py-2"><Check size={15} /> Mark completed</button>
                            )}
                            {!isCoach && b.status === 'completed' && !b.reviewed && (
                                <button onClick={() => setMode('rate')} className="btn btn-lime px-4 py-2"><Star size={15} /> Rate session</button>
                            )}
                            {(b.status === 'confirmed' || b.status === 'completed') && (
                                <Link to={`/chat/${b._id}`} className="btn btn-soft px-4 py-2"><MessageCircle size={15} className="text-data-blue" /> Chat</Link>
                            )}
                            {calendarUrl && (
                                <a href={calendarUrl} target="_blank" rel="noopener noreferrer" className="btn btn-soft px-4 py-2">
                                    <CalendarPlus size={15} className="text-data-mint" /> Add to Google Calendar
                                </a>
                            )}
                            {active && !started && !suggestion && (
                                <button onClick={() => setMode('reschedule')} className="btn btn-soft px-4 py-2"><CalendarClock size={15} className="text-data-pink" /> Reschedule</button>
                            )}
                            {active && !started && (
                                <button onClick={() => setMode('cancel')} className="btn px-4 py-2 text-danger hover:bg-danger/10">Cancel</button>
                            )}
                        </div>
                    )}

                    {mode === 'cancel' && (
                        <div className="mt-3 rounded-2xl bg-danger/5 px-4 py-3 text-sm">
                            <p>Cancel this session{b.status === 'confirmed' ? ` with ${firstName}` : ' request'}? This frees the slot.</p>
                            <div className="mt-2 flex gap-2">
                                <button onClick={() => setMode(null)} className="btn bg-surface px-4 py-2">Keep it</button>
                                <button onClick={() => setStatus('cancelled')} disabled={busy} className="btn btn-danger px-4 py-2">Yes, cancel</button>
                            </div>
                        </div>
                    )}
                    {mode === 'reschedule' && <ReschedulePanel booking={b} otherName={firstName} onDone={done} onCancel={() => setMode(null)} />}
                    {mode === 'rate' && <RateSession booking={b} onDone={done} onCancel={() => setMode(null)} />}

                    {error && <p className="mt-2 text-sm text-danger">{error}</p>}
                </div>
            </div>
        </article>
    );
};

export default SessionCard;
