// RateSession.jsx
// Star rating + optional comment for a completed session (one review per session).

import { useState } from 'react';
import { Star } from 'lucide-react';
import API from '../../api/axios';

const LABELS = ['', 'Poor', 'Okay', 'Good', 'Great', 'Excellent'];

const RateSession = ({ booking, onDone, onCancel }) => {
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [comment, setComment] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    const send = async () => {
        setBusy(true);
        setError('');
        try {
            await API.post('/reviews', { bookingId: booking._id, rating, comment });
            onDone();
        } catch (err) {
            setError(err.response?.data?.message || 'Could not save your rating');
            setBusy(false);
        }
    };

    const shown = hover || rating;

    return (
        <div className="mt-4 rounded-3xl border border-line p-4">
            <p className="font-semibold">How was the session?</p>
            <div className="mt-2 flex items-center gap-1" onMouseLeave={() => setHover(0)}>
                {[1, 2, 3, 4, 5].map((n) => (
                    <button
                        key={n}
                        type="button"
                        onClick={() => setRating(n)}
                        onMouseEnter={() => setHover(n)}
                        aria-label={`${n} ${n === 1 ? 'star' : 'stars'}`}
                        aria-pressed={rating === n}
                        className="p-1"
                    >
                        <Star size={26} className={n <= shown ? 'fill-[#F5B800] text-[#F5B800]' : 'text-line'} />
                    </button>
                ))}
                <span className="ml-2 text-sm font-semibold text-muted">{LABELS[shown]}</span>
            </div>
            <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={500}
                rows={2}
                placeholder="What went well? (optional)"
                aria-label="Comment"
                className="input mt-3 resize-none"
            />
            {error && <p className="mt-2 text-sm text-danger">{error}</p>}
            <div className="mt-3 flex gap-2">
                <button onClick={onCancel} className="btn btn-soft px-4 py-2">Back</button>
                <button onClick={send} disabled={busy || !rating} className="btn btn-dark px-4 py-2">Submit rating</button>
            </div>
        </div>
    );
};

export default RateSession;
