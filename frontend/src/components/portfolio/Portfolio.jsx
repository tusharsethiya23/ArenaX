// Portfolio.jsx
// A user's achievements as a timeline (newest first), with verification status.
//   Own portfolio: add / edit / delete, and ask for verification
//     (athletes pick a coach they've trained with; coaches go to the ArenaX team)
//   Someone else's: read-only, plus Verify / Decline for coaches who trained
//     that athlete and for admins (`canVerify` comes from the API)

import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, ExternalLink, Send } from 'lucide-react';
import API from '../../api/axios';
import { CATEGORY_BY_KEY, achievementMeta } from '../../utils/achievements';
import AchievementForm from './AchievementForm';
import VerificationStatus from './VerificationStatus';
import ReviewActions from './ReviewActions';
import Select from '../Select';
import { confirmDialog, toastError } from '../../utils/dialogs';

// "Ask for verification": athletes choose a coach; coaches send to the ArenaX team
const RequestVerification = ({ achievement, role, verifiers, onDone }) => {
    const [coachId, setCoachId] = useState(achievement.requestedFrom?._id || verifiers[0]?._id || '');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    const send = async () => {
        setBusy(true);
        setError('');
        try {
            const res = await API.post(`/achievements/${achievement._id}/request-verification`, role === 'learner' ? { coachId } : {});
            onDone(res.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Could not send the request');
        }
        setBusy(false);
    };

    if (role === 'learner' && verifiers.length === 0) {
        return (
            <p className="mt-3 text-sm text-muted">
                To get this verified, <Link to="/discover" className="font-semibold text-ink underline">book a session</Link> with a coach first. Coaches you've trained with can verify it.
            </p>
        );
    }

    return (
        <div className="mt-3">
            <div className="flex flex-wrap items-center gap-2">
                {role === 'learner' && (
                    <Select
                        value={coachId}
                        onChange={setCoachId}
                        aria-label="Coach to verify"
                        className="w-auto min-w-44"
                        buttonClassName="py-2"
                        options={verifiers.map((c) => ({ value: c._id, label: c.name }))}
                    />
                )}
                <button onClick={send} disabled={busy || (role === 'learner' && !coachId)} className="btn btn-dark px-4 py-2">
                    <Send size={14} /> {achievement.status === 'pending' ? 'Re-send' : role === 'learner' ? 'Ask to verify' : 'Send to ArenaX team'}
                </button>
            </div>
            {error && <p className="mt-2 text-sm text-danger">{error}</p>}
        </div>
    );
};

const Portfolio = ({ userId, isOwn, role }) => {
    const [items, setItems] = useState(null);
    const [verifiers, setVerifiers] = useState([]);
    const [editing, setEditing] = useState(null); // 'new' | achievement id
    const [error, setError] = useState('');

    const load = useCallback(() => API.get(`/achievements/${userId}`)
        .then((res) => setItems(res.data))
        .catch(() => setError('Could not load the portfolio')), [userId]);

    useEffect(() => { load(); }, [load]);
    useEffect(() => {
        if (isOwn && role === 'learner') API.get('/achievements/verifiers').then((res) => setVerifiers(res.data)).catch(() => {});
    }, [isOwn, role]);

    const replace = (updated) => setItems((prev) => prev.map((a) => (a._id === updated._id ? { ...a, ...updated, canVerify: false } : a)));

    const save = async (form) => {
        if (editing === 'new') {
            const res = await API.post('/achievements', form);
            setItems((prev) => [res.data, ...prev].sort((a, b) => new Date(b.date) - new Date(a.date)));
        } else {
            const res = await API.put(`/achievements/${editing}`, form);
            setItems((prev) => prev.map((a) => (a._id === editing ? res.data : a)).sort((a, b) => new Date(b.date) - new Date(a.date)));
        }
        setEditing(null);
    };

    const remove = async (a) => {
        if (!(await confirmDialog({ title: 'Delete this achievement?', message: `"${a.title}" will be removed from your portfolio.`, confirmLabel: 'Delete', danger: true }))) return;
        try {
            await API.delete(`/achievements/${a._id}`);
            setItems((prev) => prev.filter((x) => x._id !== a._id));
        } catch (err) {
            toastError(err, 'Could not delete');
        }
    };

    if (error) return <p className="empty-state">{error}</p>;
    if (!items) return <p className="empty-state">Loading portfolio...</p>;

    const verifiedCount = items.filter((a) => a.status === 'verified').length;

    return (
        <section className="card">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-lg font-bold tracking-tight">Portfolio</h2>
                    <p className="text-sm text-muted">{items.length} achievement{items.length === 1 ? '' : 's'} · {verifiedCount} verified</p>
                </div>
                {isOwn && editing !== 'new' && (
                    <button onClick={() => setEditing('new')} className="btn btn-dark"><Plus size={16} /> Add achievement</button>
                )}
            </div>

            {editing === 'new' && (
                <div className="mb-6 rounded-3xl border border-line p-4 sm:p-5">
                    <AchievementForm onSubmit={save} onCancel={() => setEditing(null)} />
                </div>
            )}

            {items.length === 0 && editing !== 'new' && (
                <p className="rounded-2xl bg-canvas px-4 py-6 text-center text-sm text-muted">
                    {isOwn ? 'Add your results, selections and certificates. Verified ones build trust with coaches and brands.' : 'No achievements yet.'}
                </p>
            )}

            {/* Timeline */}
            <ol className="relative space-y-5 border-l border-line pl-6">
                {items.map((a) => {
                    const Category = CATEGORY_BY_KEY[a.category] || CATEGORY_BY_KEY.competition;
                    const Icon = Category.icon;
                    return (
                        <li key={a._id} className="relative">
                            <span className={`absolute -left-[37px] top-0 flex h-7 w-7 items-center justify-center rounded-full ring-4 ring-surface ${a.status === 'verified' ? 'bg-data-mint text-on-ink' : `bg-canvas ${Category.tone}`}`}>
                                <Icon size={14} />
                            </span>

                            {editing === a._id ? (
                                <div className="rounded-3xl border border-line p-4 sm:p-5">
                                    <AchievementForm initial={a} onSubmit={save} onCancel={() => setEditing(null)} />
                                </div>
                            ) : (
                                <div>
                                    <div className="flex flex-wrap items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <p className="font-semibold">{a.title}</p>
                                            <p className="text-sm text-muted">{achievementMeta(a)}</p>
                                        </div>
                                        <VerificationStatus achievement={a} />
                                    </div>
                                    {a.description && <p className="mt-1.5 text-sm text-ink/80">{a.description}</p>}
                                    {a.status === 'rejected' && a.reviewNote && (
                                        <p className="mt-1.5 text-sm text-danger">Reviewer's note: "{a.reviewNote}"</p>
                                    )}
                                    {a.status === 'verified' && a.reviewNote && (
                                        <p className="mt-1.5 text-sm text-muted">"{a.reviewNote}"</p>
                                    )}

                                    <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                                        {a.proofLink && (
                                            <a href={a.proofLink} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 font-medium underline-offset-2 hover:underline">
                                                <ExternalLink size={14} /> View proof
                                            </a>
                                        )}
                                        {isOwn && (
                                            <>
                                                <button onClick={() => setEditing(a._id)} className="inline-flex items-center gap-1 text-muted hover:text-ink"><Pencil size={14} /> Edit</button>
                                                <button onClick={() => remove(a)} className="inline-flex items-center gap-1 text-muted hover:text-danger"><Trash2 size={14} /> Delete</button>
                                            </>
                                        )}
                                    </div>

                                    {isOwn && a.status !== 'verified' && (
                                        <RequestVerification achievement={a} role={role} verifiers={verifiers} onDone={replace} />
                                    )}
                                    {!isOwn && a.canVerify && <ReviewActions achievementId={a._id} onDone={replace} />}
                                </div>
                            )}
                        </li>
                    );
                })}
            </ol>
        </section>
    );
};

export default Portfolio;
