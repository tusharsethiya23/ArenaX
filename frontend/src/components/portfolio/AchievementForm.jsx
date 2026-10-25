// AchievementForm.jsx
// Add or edit a portfolio achievement. Editing a verified achievement resets
// its verification (the backend does this), so the form says so.

import { useState } from 'react';
import { CATEGORIES, LEVELS } from '../../utils/achievements';
import Select from '../Select';


const LEVEL_OPTIONS = [{ value: '', label: 'Not set' }, ...LEVELS.map((l) => ({ value: l, label: l.charAt(0).toUpperCase() + l.slice(1) }))];

const today = () => new Date().toISOString().slice(0, 10);

const AchievementForm = ({ initial, onSubmit, onCancel }) => {
    const [form, setForm] = useState({
        title: initial?.title || '',
        category: initial?.category || 'competition',
        level: initial?.level || '',
        date: initial?.date ? new Date(initial.date).toISOString().slice(0, 10) : '',
        description: initial?.description || '',
        proofLink: initial?.proofLink || '',
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            await onSubmit(form);
        } catch (err) {
            setError(err.response?.data?.message || 'Could not save');
            setSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="label" htmlFor="ach-title">Title</label>
                <input id="ach-title" value={form.title} onChange={set('title')} maxLength={100} required placeholder="e.g. District championship: gold" className="input" />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                    <label className="label" htmlFor="ach-category">Type</label>
                    <Select id="ach-category" value={form.category} onChange={(v) => setForm({ ...form, category: v })} options={CATEGORIES.map((c) => ({ value: c.key, label: c.label }))} />
                </div>
                <div>
                    <label className="label" htmlFor="ach-level">Level</label>
                    <Select id="ach-level" value={form.level} onChange={(v) => setForm({ ...form, level: v })} options={LEVEL_OPTIONS} />
                </div>
                <div>
                    <label className="label" htmlFor="ach-date">Date</label>
                    <input id="ach-date" type="date" value={form.date} onChange={set('date')} max={today()} required className="input" />
                </div>
            </div>
            <div>
                <label className="label" htmlFor="ach-desc">Details (optional)</label>
                <textarea id="ach-desc" value={form.description} onChange={set('description')} maxLength={500} rows={2} className="input resize-none" />
            </div>
            <div>
                <label className="label" htmlFor="ach-proof">Proof link (optional)</label>
                <input id="ach-proof" type="url" value={form.proofLink} onChange={set('proofLink')} placeholder="https://... result page, certificate, news article" className="input" />
                <p className="mt-1 text-xs text-muted">A link helps your coach verify it faster.</p>
            </div>
            {initial?.status === 'verified' && (
                <p className="rounded-2xl bg-amber-400/15 px-4 py-3 text-sm text-amber-200">Saving changes removes the current verification. You can ask for it again.</p>
            )}
            {error && <p className="alert-error">{error}</p>}
            <div className="flex gap-2">
                <button type="button" onClick={onCancel} className="btn btn-soft">Cancel</button>
                <button type="submit" disabled={saving} className="btn btn-dark px-6">{saving ? 'Saving...' : initial ? 'Save changes' : 'Add to portfolio'}</button>
            </div>
        </form>
    );
};

export default AchievementForm;
