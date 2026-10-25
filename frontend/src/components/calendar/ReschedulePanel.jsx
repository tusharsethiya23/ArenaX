// ReschedulePanel.jsx
// Suggest a new time for a session: the coach's open slots for the next four
// weeks. The other person has to accept it; until then the current time stays.

import { useState, useEffect } from 'react';
import API from '../../api/axios';
import SlotPicker from '../SlotPicker';
import { nextOpenSlot, BOOKING_WINDOW_DAYS } from '../../utils/slots';

const ReschedulePanel = ({ booking, otherName, onDone, onCancel }) => {
    const coachId = booking.coach?._id || booking.coach;
    const [coach, setCoach] = useState(null);
    const [pick, setPick] = useState(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        API.get(`/users/${coachId}`)
            .then((res) => {
                setCoach(res.data);
                setPick(nextOpenSlot(res.data.availability, res.data.takenSlots, BOOKING_WINDOW_DAYS));
            })
            .catch(() => setError('Could not load the coach\'s slots'));
    }, [coachId]);

    const send = async () => {
        setBusy(true);
        setError('');
        try {
            await API.post(`/bookings/${booking._id}/reschedule`, { date: pick.day.iso, timeSlot: pick.slot.timeSlot });
            onDone();
        } catch (err) {
            setError(err.response?.data?.message || 'Could not suggest that time');
            setBusy(false);
        }
    };

    return (
        <div className="mt-4 rounded-3xl border border-line p-4">
            <p className="font-semibold">Suggest a new time</p>
            <p className="mb-4 text-sm text-muted">{otherName} will need to accept it. Until then, the current time stays booked.</p>

            {!coach && !error && <p className="text-sm text-muted">Loading slots...</p>}
            {coach && (coach.availability?.length ? (
                <SlotPicker availability={coach.availability} takenSlots={coach.takenSlots} dayCount={BOOKING_WINDOW_DAYS} value={pick} onChange={setPick} />
            ) : (
                <p className="text-sm text-muted">The coach hasn't listed any slots.</p>
            ))}

            {error && <p className="mt-3 text-sm text-danger">{error}</p>}
            <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={onCancel} className="btn btn-soft px-4 py-2">Back</button>
                <button onClick={send} disabled={busy || !pick?.slot} className="btn btn-dark min-w-0 whitespace-normal px-4 py-2 text-center">
                    {pick?.slot ? `Suggest ${pick.day.label}, ${pick.slot.label}` : 'Pick a time'}
                </button>
            </div>
        </div>
    );
};

export default ReschedulePanel;
