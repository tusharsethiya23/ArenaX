// Settings.jsx
// Account settings (route: /settings, from the avatar menu): editing profile
// details, a coach's weekly time slots, the Private account switch, and
// permanently deleting the account.
// The form waits for the full profile to load, so saving never blanks out
// fields that the login data doesn't include.

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X, Check } from 'lucide-react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import useMyProfile from '../hooks/useMyProfile';
import PageHeader from '../components/PageHeader';
import { WEEKDAYS, slotStartMinutes } from '../utils/slots';
import { DNA_SKILLS, MAX_COACH_FOCUS } from '../utils/dna';
import Select from '../components/Select';

const LEVELS = ['beginner', 'intermediate', 'advanced'];
const LEVEL_OPTIONS = [{ value: '', label: 'Not set' }, ...LEVELS.map((l) => ({ value: l, label: l.charAt(0).toUpperCase() + l.slice(1) }))];

// Sort slots Monday-first, then by start time
const DAY_ORDER = [...WEEKDAYS.slice(1), WEEKDAYS[0]];
const sortSlots = (slots) => [...slots].sort((a, b) =>
    DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day)
    || (slotStartMinutes(a.timeSlot) ?? 9999) - (slotStartMinutes(b.timeSlot) ?? 9999));

// Form values from the loaded profile
const initialForm = (profile) => ({
    bio: profile.bio || '',
    location: profile.location || '',
    sport: profile.sport || '',
    pricePerSession: profile.pricePerSession ?? '',
    skillLevelTaught: profile.skillLevelTaught || '',
    yearsExperience: profile.yearsExperience ?? '',
    availability: sortSlots((profile.availability || []).map(({ day, timeSlot }) => ({ day, timeSlot }))),
    coachFocus: profile.coachFocus || [],
    goals: profile.goals || '',
    skillLevel: profile.skillLevel || '',
});

// "Private account" switch. Saves as soon as it's flipped. Private accounts
// approve new followers and only show their posts to approved followers;
// going public accepts everyone still waiting.
const PrivacyCard = ({ initialPrivate }) => {
    const { user, login } = useAuth();
    const [isPrivate, setIsPrivate] = useState(initialPrivate);
    const [saving, setSaving] = useState(false);
    const [note, setNote] = useState('');

    const toggle = async () => {
        const next = !isPrivate;
        if (!next && !window.confirm('Make your account public? Anyone with a pending follow request will become a follower.')) return;
        setSaving(true);
        setIsPrivate(next);
        try {
            const res = await API.put('/users/profile', { isPrivate: next });
            login({ ...user, isPrivate: res.data.isPrivate, token: localStorage.getItem('token') });
            setNote(next ? 'Your account is now private.' : 'Your account is now public.');
        } catch (err) {
            setIsPrivate(!next);
            setNote(err.response?.data?.message || 'Could not change your privacy setting');
        }
        setSaving(false);
    };

    return (
        <section className="card">
            <h2 className="text-lg font-bold tracking-tight">Privacy</h2>
            <div className="mt-4 flex items-start justify-between gap-4">
                <div>
                    <p className="font-semibold">Private account</p>
                    <p className="mt-1 text-sm text-muted">
                        New followers need your approval, and only approved followers see your posts.
                        People who already follow you stay.
                    </p>
                </div>
                {/* Switch: lime when on */}
                <button
                    type="button"
                    role="switch"
                    aria-checked={isPrivate}
                    aria-label="Private account"
                    onClick={toggle}
                    disabled={saving}
                    className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${isPrivate ? 'bg-accent' : 'bg-canvas'}`}
                >
                    <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all ${isPrivate ? 'left-7' : 'left-1'}`} />
                </button>
            </div>
            {note && <p className="mt-3 text-sm text-muted" role="status">{note}</p>}
        </section>
    );
};

const SettingsContent = ({ profile }) => {
    const { user, login, logout } = useAuth();
    const navigate = useNavigate();
    const isCoach = user.role === 'coach';

    const [formData, setFormData] = useState(() => initialForm(profile));
    const [newSlot, setNewSlot] = useState({ day: 'Monday', timeSlot: '' });
    const [message, setMessage] = useState('');
    const [messageIsError, setMessageIsError] = useState(false);
    const [saving, setSaving] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const addSlot = () => {
        const timeSlot = newSlot.timeSlot.trim();
        if (!timeSlot) return;
        const exists = formData.availability.some(
            (s) => s.day === newSlot.day && s.timeSlot.toLowerCase() === timeSlot.toLowerCase()
        );
        if (!exists) {
            setFormData({ ...formData, availability: sortSlots([...formData.availability, { day: newSlot.day, timeSlot }]) });
        }
        setNewSlot({ ...newSlot, timeSlot: '' });
    };

    // Up to MAX_COACH_FOCUS skills; the others are disabled once that many are picked
    const toggleFocus = (key) => {
        const focus = formData.coachFocus;
        setFormData({ ...formData, coachFocus: focus.includes(key) ? focus.filter((k) => k !== key) : [...focus, key] });
    };

    const removeSlot = (index) => {
        setFormData({ ...formData, availability: formData.availability.filter((_, i) => i !== index) });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        // Only send the fields that apply to this role
        const payload = { bio: formData.bio, location: formData.location, sport: formData.sport };
        if (isCoach) {
            Object.assign(payload, {
                pricePerSession: formData.pricePerSession,
                skillLevelTaught: formData.skillLevelTaught,
                yearsExperience: formData.yearsExperience,
                availability: formData.availability,
                coachFocus: formData.coachFocus,
            });
        } else if (user.role === 'learner') {
            Object.assign(payload, { goals: formData.goals, skillLevel: formData.skillLevel });
        }
        try {
            const res = await API.put('/users/profile', payload);
            login({ ...user, ...res.data, token: localStorage.getItem('token') });
            setMessage('Profile updated!');
            setMessageIsError(false);
        } catch (err) {
            setMessage(err.response?.data?.message || 'Something went wrong');
            setMessageIsError(true);
        }
        setSaving(false);
    };

    // Handles permanent account deletion after user confirmation
    const handleDeleteAccount = async () => {
        const confirmed = window.confirm(
            'Are you sure you want to delete your account? This cannot be undone.'
        );
        if (!confirmed) return;

        try {
            await API.delete('/users/profile');
            logout(); // clear local auth state
            navigate('/register'); // send them back to the landing/register page
        } catch (err) {
            alert(err.response?.data?.message || 'Something went wrong');
        }
    };

    return (
        <div className="page max-w-3xl">
            <PageHeader title="Settings" subtitle="Manage your profile and account" />

            {message && <div className={`mb-5 ${messageIsError ? 'alert-error' : 'alert-success'}`}>{message}</div>}

            <form onSubmit={handleSubmit} className="space-y-6">

                    {/* ================= DETAILS ================= */}
                    <section className="card space-y-4">
                        <h2 className="text-lg font-bold tracking-tight">Edit details</h2>

                        <div>
                            <label className="label">Bio</label>
                            <textarea name="bio" value={formData.bio} onChange={handleChange} rows={3} className="input resize-none" />
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <label className="label">Location</label>
                                <input type="text" name="location" value={formData.location} onChange={handleChange} placeholder="e.g. Indore" className="input" />
                            </div>
                            {(isCoach || user.role === 'learner') && (
                                <div>
                                    <label className="label">{isCoach ? 'Sport' : 'Preferred sport'}</label>
                                    <input type="text" name="sport" value={formData.sport} onChange={handleChange} placeholder="e.g. Cricket" className="input" />
                                </div>
                            )}
                        </div>

                        {isCoach && (
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                <div>
                                    <label className="label">Price per session (₹)</label>
                                    <input type="number" min="0" name="pricePerSession" value={formData.pricePerSession} onChange={handleChange} className="input" />
                                </div>
                                <div>
                                    <label className="label" htmlFor="set-level-taught">Level you teach</label>
                                    <Select id="set-level-taught" value={formData.skillLevelTaught} onChange={(v) => setFormData({ ...formData, skillLevelTaught: v })} options={LEVEL_OPTIONS} />
                                </div>
                                <div>
                                    <label className="label">Years of experience</label>
                                    <input type="number" min="0" max="60" name="yearsExperience" value={formData.yearsExperience} onChange={handleChange} className="input" />
                                </div>
                            </div>
                        )}

                        {isCoach && (
                            <fieldset>
                                <legend className="label">Skills you focus on <span className="font-normal text-muted">(up to {MAX_COACH_FOCUS})</span></legend>
                                <p className="mb-3 text-sm text-muted">Athletes whose DNA shows a gap in these skills will see you as a match.</p>
                                <div className="flex flex-wrap gap-2">
                                    {DNA_SKILLS.map((s) => {
                                        const on = formData.coachFocus.includes(s.key);
                                        const full = !on && formData.coachFocus.length >= MAX_COACH_FOCUS;
                                        return (
                                            <button
                                                key={s.key}
                                                type="button"
                                                aria-pressed={on}
                                                disabled={full}
                                                onClick={() => toggleFocus(s.key)}
                                                className={`chip ${on ? 'chip-active' : ''} ${full ? 'cursor-not-allowed opacity-40' : ''}`}
                                            >
                                                {on && <Check size={14} />} {s.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </fieldset>
                        )}

                        {user.role === 'learner' && (
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="label" htmlFor="set-level">Your level</label>
                                    <Select id="set-level" value={formData.skillLevel} onChange={(v) => setFormData({ ...formData, skillLevel: v })} options={LEVEL_OPTIONS} />
                                </div>
                                <div>
                                    <label className="label">Goals</label>
                                    <input type="text" name="goals" value={formData.goals} onChange={handleChange} placeholder="e.g. Make the district team" className="input" />
                                </div>
                            </div>
                        )}
                    </section>

                    {/* ================= COACH TIME SLOTS ================= */}
                    {isCoach && (
                        <section className="card space-y-4">
                            <div>
                                <h2 className="text-lg font-bold tracking-tight">Weekly time slots</h2>
                                <p className="mt-1 text-sm text-muted">Learners pick from these when booking. They repeat every week.</p>
                            </div>

                            {formData.availability.length === 0 ? (
                                <p className="rounded-2xl bg-canvas px-4 py-3 text-sm text-muted">No slots yet. Add your first one below.</p>
                            ) : (
                                <ul className="flex flex-wrap gap-2">
                                    {formData.availability.map((s, i) => (
                                        <li key={`${s.day}-${s.timeSlot}`} className="flex items-center gap-2 rounded-full bg-canvas py-1.5 pl-4 pr-1.5 text-sm">
                                            <span className="font-semibold">{s.day.slice(0, 3)}</span>
                                            <span>{s.timeSlot}</span>
                                            <button
                                                type="button"
                                                onClick={() => removeSlot(i)}
                                                aria-label={`Remove ${s.day} ${s.timeSlot}`}
                                                className="flex h-6 w-6 items-center justify-center rounded-full text-muted hover:bg-white/10 hover:text-danger"
                                            >
                                                <X size={14} />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}

                            <div className="flex flex-col gap-2 sm:flex-row">
                                <Select
                                    value={newSlot.day}
                                    onChange={(day) => setNewSlot({ ...newSlot, day })}
                                    aria-label="Day"
                                    className="sm:w-44 sm:shrink-0"
                                    options={DAY_ORDER.map((d) => ({ value: d, label: d }))}
                                />
                                <input
                                    value={newSlot.timeSlot}
                                    onChange={(e) => setNewSlot({ ...newSlot, timeSlot: e.target.value })}
                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSlot(); } }}
                                    placeholder="e.g. 6 PM - 7 PM"
                                    maxLength={40}
                                    className="input"
                                    aria-label="Time"
                                />
                                <button type="button" onClick={addSlot} disabled={!newSlot.timeSlot.trim()} className="btn btn-soft shrink-0">
                                    <Plus size={16} /> Add slot
                                </button>
                            </div>
                        </section>
                    )}

                    <button type="submit" disabled={saving} className="btn btn-dark px-8">
                        {saving ? 'Saving...' : 'Save changes'}
                    </button>
            </form>

            {/* ================= PRIVACY ================= */}
            <div className="mt-6">
                <PrivacyCard initialPrivate={Boolean(profile.isPrivate)} />
            </div>

            {/* ================= DANGER ZONE ================= */}
            <section className="card mt-6 ring-1 ring-inset ring-danger/30">
                <h2 className="text-lg font-bold tracking-tight text-danger">Danger zone</h2>
                <p className="mb-4 mt-1 text-sm text-muted">
                    Deleting your account is permanent and cannot be undone.
                </p>
                <button onClick={handleDeleteAccount} className="btn btn-danger">
                    Delete my account
                </button>
            </section>
        </div>
    );
};

// Waits for the full profile so the form never starts with blank fields
const Settings = () => {
    const { profile, loaded } = useMyProfile();
    if (!loaded) {
        return (
            <div className="page max-w-3xl">
                <PageHeader title="Settings" subtitle="Manage your profile and account" />
                <p className="empty-state">Loading your profile...</p>
            </div>
        );
    }
    return <SettingsContent profile={profile} />;
};

export default Settings;
