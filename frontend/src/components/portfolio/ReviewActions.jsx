// ReviewActions.jsx
// Verify / Decline buttons for coaches (their athletes) and admins (coaches).
// Declining asks for a short note so the athlete knows what to fix.

import { useState } from 'react';
import { Check, X } from 'lucide-react';
import API from '../../api/axios';

const ReviewActions = ({ achievementId, onDone }) => {
    const [declining, setDeclining] = useState(false);
    const [note, setNote] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    const send = async (approve) => {
        setBusy(true);
        setError('');
        try {
            const res = await API.put(`/achievements/${achievementId}/${approve ? 'verify' : 'reject'}`, { note });
            onDone(res.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Could not save your review');
        }
        setBusy(false);
    };

    if (declining) {
        return (
            <div className="mt-3 space-y-2">
                <input
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    maxLength={300}
                    autoFocus
                    placeholder="Why? e.g. Please add the official result link"
                    aria-label="Reason for declining"
                    className="input py-2.5"
                />
                {error && <p className="text-sm text-danger">{error}</p>}
                <div className="flex gap-2">
                    <button onClick={() => setDeclining(false)} className="btn btn-soft px-4 py-2">Back</button>
                    <button onClick={() => send(false)} disabled={busy || !note.trim()} className="btn btn-danger px-4 py-2">Decline</button>
                </div>
            </div>
        );
    }

    return (
        <div className="mt-3">
            <div className="flex flex-wrap gap-2">
                <button onClick={() => send(true)} disabled={busy} className="btn btn-dark px-4 py-2"><Check size={15} /> Verify</button>
                <button onClick={() => setDeclining(true)} disabled={busy} className="btn btn-soft px-4 py-2"><X size={15} /> Decline</button>
            </div>
            {error && <p className="mt-2 text-sm text-danger">{error}</p>}
        </div>
    );
};

export default ReviewActions;
