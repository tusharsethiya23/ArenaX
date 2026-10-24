// AssessmentForm.jsx
// Six 1-10 sliders (one per skill) and an optional note. Used by athletes
// rating themselves and by coaches assessing an athlete they've coached.

import { useState } from 'react';

const LABELS = { 1: 'Just starting', 4: 'Developing', 6: 'Solid', 8: 'Advanced', 10: 'Elite' };
const describe = (n) => LABELS[Object.keys(LABELS).map(Number).filter((k) => k <= n).pop()];

const AssessmentForm = ({ dimensions, initial, submitLabel = 'Save assessment', onSubmit, onCancel }) => {
    const [scores, setScores] = useState(() => Object.fromEntries(dimensions.map((d) => [d.key, Math.round(initial?.[d.key] ?? 5)])));
    const [note, setNote] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            await onSubmit({ scores, note });
        } catch (err) {
            setError(err.response?.data?.message || 'Could not save the assessment');
        }
        setSaving(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {dimensions.map((d) => (
                <div key={d.key}>
                    <div className="mb-1 flex items-baseline justify-between text-sm">
                        <label htmlFor={`skill-${d.key}`} className="font-medium">{d.label}</label>
                        <span className="tabular-nums text-muted"><span className="font-bold text-ink">{scores[d.key]}</span> · {describe(scores[d.key])}</span>
                    </div>
                    <input
                        id={`skill-${d.key}`}
                        type="range"
                        min="1"
                        max="10"
                        step="1"
                        value={scores[d.key]}
                        onChange={(e) => setScores({ ...scores, [d.key]: Number(e.target.value) })}
                        className="w-full accent-ink"
                    />
                </div>
            ))}
            <div>
                <label className="label" htmlFor="assessment-note">Note (optional)</label>
                <textarea id="assessment-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} rows={2} className="input resize-none" />
            </div>
            {error && <p className="alert-error">{error}</p>}
            <div className="flex gap-2">
                {onCancel && <button type="button" onClick={onCancel} className="btn btn-soft">Cancel</button>}
                <button type="submit" disabled={saving} className="btn btn-dark px-6">{saving ? 'Saving...' : submitLabel}</button>
            </div>
        </form>
    );
};

export default AssessmentForm;
