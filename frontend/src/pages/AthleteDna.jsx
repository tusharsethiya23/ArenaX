// AthleteDna.jsx
// Athlete DNA dashboard.
//   /dna            the logged-in athlete's own DNA (editable)
//   /dna/:athleteId a coach's view of an athlete they've coached (can assess)
// Flow: rate skills (self + coaches) -> pick a career goal -> see the gap ->
// follow the weekly action plan and log activities -> re-assess -> readiness %
// -> opportunities (coaches, tournaments, brands at 70%+).

import { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Plus, Undo2, Trophy, Megaphone, ArrowUpRight } from 'lucide-react';
import API from '../api/axios';
import PageHeader from '../components/PageHeader';
import Avatar from '../components/Avatar';
import MatchBadge from '../components/MatchBadge';
import SkillBars from '../components/dna/SkillBars';
import ProgressChart from '../components/dna/ProgressChart';
import AssessmentForm from '../components/dna/AssessmentForm';

const BRAND_READY = 70; // keep in sync with Backend/controllers/brand.controller.js
const fmtDate = (d) => new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
const daysSince = (d) => Math.floor((Date.now() - new Date(d)) / 86400000);

// ---------- Small pieces ----------

const GoalPicker = ({ goals, value, onChange, disabled }) => (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Career goal">
        {goals.map((g) => (
            <button
                key={g.key}
                role="radio"
                aria-checked={value === g.key}
                disabled={disabled}
                onClick={() => onChange(g.key)}
                className={`chip ${value === g.key ? 'chip-active' : 'bg-canvas'}`}
            >
                {g.label}
            </button>
        ))}
    </div>
);

// "●●○" — done this week out of the weekly target
const Pips = ({ done, total }) => (
    <span className="flex gap-1" aria-label={`${Math.min(done, total)} of ${total} this week`}>
        {Array.from({ length: total }, (_, i) => (
            <span key={i} className={`h-2.5 w-2.5 rounded-full ${i < done ? 'bg-ink' : 'bg-canvas ring-1 ring-inset ring-line'}`} />
        ))}
    </span>
);

const Onboarding = ({ dna, onDone }) => {
    const [goal, setGoal] = useState(dna.goal?.key || null);
    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <section className="rounded-[32px] bg-panel p-6 text-white sm:p-8">
                <p className="text-xs font-bold uppercase tracking-wider text-highlight">Athlete DNA</p>
                <h2 className="mt-2 text-3xl font-black leading-tight tracking-tighter sm:text-4xl">Where am I? Where do I want to go? What should I do next?</h2>
                <ol className="mt-6 space-y-3 text-sm text-white/80">
                    <li><span className="font-bold text-white">1. Pick your goal.</span> It sets the level you're aiming for.</li>
                    <li><span className="font-bold text-white">2. Rate yourself</span> on six skills. Coaches you train with can add their assessment, which counts double.</li>
                    <li><span className="font-bold text-white">3. Follow your plan.</span> We turn your biggest gaps into weekly activities and track your readiness.</li>
                </ol>
            </section>
            <section className="card space-y-6">
                <div>
                    <h2 className="text-lg font-bold tracking-tight">1. Your goal</h2>
                    <div className="mt-3"><GoalPicker goals={dna.goals} value={goal} onChange={setGoal} /></div>
                </div>
                <div>
                    <h2 className="mb-3 text-lg font-bold tracking-tight">2. Rate yourself honestly</h2>
                    {goal ? (
                        <AssessmentForm dimensions={dna.dimensions} submitLabel="Build my DNA" onSubmit={(data) => onDone(goal, data)} />
                    ) : (
                        <p className="rounded-2xl bg-canvas px-4 py-3 text-sm text-muted">Pick a goal first.</p>
                    )}
                </div>
            </section>
        </div>
    );
};

// ---------- Page ----------

const AthleteDna = () => {
    const { athleteId } = useParams();
    const isOwn = !athleteId;
    const [dna, setDna] = useState(null);
    const [error, setError] = useState('');
    const [reassessing, setReassessing] = useState(false);
    const [busyKey, setBusyKey] = useState(null);
    const [flash, setFlash] = useState('');

    const load = useCallback(() => API.get(isOwn ? '/dna/me' : `/dna/athlete/${athleteId}`)
        .then((res) => setDna(res.data))
        .catch((err) => setError(err.response?.data?.message || 'Could not load the DNA')), [isOwn, athleteId]);

    useEffect(() => { load(); }, [load]);

    const say = (message) => { setFlash(message); setTimeout(() => setFlash(''), 2500); };
    const keepOpportunities = (next) => setDna((prev) => ({ ...next, opportunities: next.opportunities || prev?.opportunities }));

    const changeGoal = async (goal) => {
        try { setDna((await API.put('/dna/goal', { goal })).data); } catch (err) { say(err.response?.data?.message || 'Could not change goal'); }
    };
    const submitAssessment = async ({ scores, note }) => {
        const res = await API.post('/dna/assessments', { scores, note, ...(isOwn ? {} : { athleteId }) });
        keepOpportunities(res.data);
        setReassessing(false);
        say(isOwn ? 'Your DNA is updated.' : 'Assessment saved. Thanks, coach!');
    };
    const finishOnboarding = async (goal, data) => {
        await API.put('/dna/goal', { goal });
        await submitAssessment(data);
    };
    const logActivity = async (key) => {
        setBusyKey(key);
        try { keepOpportunities((await API.post('/dna/activities', { activityKey: key })).data); say('Logged. Nice work!'); }
        catch (err) { say(err.response?.data?.message || 'Could not log the activity'); }
        setBusyKey(null);
    };
    const undoLog = async (id) => {
        try { keepOpportunities((await API.delete(`/dna/activities/${id}`)).data); }
        catch (err) { say(err.response?.data?.message || 'Could not undo'); }
    };

    if (error) return <div className="page max-w-3xl"><p className="empty-state">{error}</p></div>;
    if (!dna) return <div className="page"><p className="empty-state">Loading DNA...</p></div>;

    const title = isOwn ? 'My DNA' : `${dna.athlete.name}'s DNA`;
    const subtitle = isOwn ? 'Where am I? → Where do I want to go? → What should I do next?' : [dna.athlete.sport, dna.athlete.location].filter(Boolean).join(' · ');

    // ---------- First visit: goal + self-rating ----------
    if (!dna.scores) {
        return (
            <div className="page">
                <PageHeader title={title} subtitle={subtitle} />
                {isOwn ? (
                    <Onboarding dna={dna} onDone={finishOnboarding} />
                ) : dna.canAssess ? (
                    <section className="card max-w-xl">
                        <h2 className="mb-1 text-lg font-bold tracking-tight">No DNA yet. Be the first to assess {dna.athlete.name.split(' ')[0]}</h2>
                        <p className="mb-5 text-sm text-muted">Your assessment counts double compared to their self-rating.</p>
                        <AssessmentForm dimensions={dna.dimensions} submitLabel="Save assessment" onSubmit={submitAssessment} />
                    </section>
                ) : (
                    <p className="empty-state">{dna.athlete.name} hasn't built their DNA yet.</p>
                )}
            </div>
        );
    }

    const biggest = dna.gaps.find((g) => g.gap > 0);
    const target = dna.goal?.target;
    const staleSelf = isOwn && dna.lastSelfAssessment && daysSince(dna.lastSelfAssessment) >= 14;

    return (
        <div className="page">
            <PageHeader
                title={title}
                subtitle={subtitle}
                action={flash && <span role="status" className="badge bg-white px-4 py-2 text-sm text-on-ink">{flash}</span>}
            />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
                {/* ===================== MAIN ===================== */}
                <div className="min-w-0 space-y-6">

                    {/* ---------- Headline numbers ---------- */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <section className="rounded-[28px] bg-panel p-5 text-white">
                            <p className="text-sm text-white/60">Career readiness</p>
                            <p className="mt-1 text-5xl font-black tracking-tighter text-highlight">{dna.readiness ?? '—'}{dna.readiness !== null && <span className="text-2xl">%</span>}</p>
                            <p className="mt-1 text-sm text-white/70">{dna.goal ? `for ${dna.goal.label}` : 'Pick a goal to see this'}</p>
                            {dna.readiness !== null && (
                                <div className="mt-3 h-1.5 rounded-full bg-white/15" aria-hidden="true">
                                    <div className="h-full rounded-full bg-highlight" style={{ width: `${dna.readiness}%` }} />
                                </div>
                            )}
                        </section>
                        <section className="card">
                            <p className="text-sm text-muted">Overall DNA</p>
                            <p className="mt-1 text-5xl font-black tracking-tighter">{dna.overall}<span className="text-2xl text-muted"> /10</span></p>
                            <p className="mt-1 text-sm text-muted">Average of six skills</p>
                        </section>
                        <section className="card">
                            <p className="text-sm text-muted">Biggest gap</p>
                            {biggest ? (
                                <>
                                    <p className="mt-1 text-2xl font-extrabold tracking-tight">{biggest.label}</p>
                                    <p className="mt-1 text-sm text-muted">{biggest.current} now · {biggest.gap} to reach {biggest.target}</p>
                                </>
                            ) : (
                                <p className="mt-1 text-2xl font-extrabold tracking-tight">{dna.goal ? 'Goal met 🎉' : 'No goal set'}</p>
                            )}
                        </section>
                    </div>

                    {/* ---------- Skills vs goal ---------- */}
                    <section className="card">
                        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <h2 className="text-lg font-bold tracking-tight">Skills vs goal</h2>
                                <p className="mt-1 text-sm text-muted">
                                    Based on {[
                                        dna.sources.self && `${isOwn ? 'your' : 'their'} self-rating (${fmtDate(dna.sources.self.date)})`,
                                        dna.sources.coaches.length && `${dna.sources.coaches.length} coach assessment${dna.sources.coaches.length > 1 ? 's' : ''} (${dna.sources.coaches.map((c) => c.name.split(' ')[0]).join(', ')})`,
                                    ].filter(Boolean).join(' and ')}. Coach assessments count double.
                                </p>
                            </div>
                            {isOwn && !reassessing && (
                                <button onClick={() => setReassessing(true)} className={`btn ${staleSelf ? 'btn-lime' : 'btn-soft'}`}>
                                    {staleSelf ? 'Time to re-assess' : 'Re-assess'}
                                </button>
                            )}
                        </div>

                        {isOwn && (
                            <div className="mb-6">
                                <p className="label">Your goal</p>
                                <GoalPicker goals={dna.goals} value={dna.goal?.key} onChange={changeGoal} />
                            </div>
                        )}

                        {reassessing ? (
                            <AssessmentForm dimensions={dna.dimensions} initial={dna.assessments.find((a) => a.source === 'self')?.scores} onSubmit={submitAssessment} onCancel={() => setReassessing(false)} />
                        ) : (
                            <SkillBars dimensions={dna.dimensions} scores={dna.scores} target={target} />
                        )}
                        {!reassessing && target && (
                            <p className="mt-4 flex items-center gap-2 text-xs text-muted">
                                <span className="inline-block h-3 w-0.5 rounded-full bg-muted" /> Goal {target} for {dna.goal.label}
                            </p>
                        )}
                    </section>

                    {/* ---------- Coach: assess ---------- */}
                    {!isOwn && dna.canAssess && (
                        <section className="card">
                            <h2 className="mb-1 text-lg font-bold tracking-tight">Assess {dna.athlete.name.split(' ')[0]}</h2>
                            <p className="mb-5 text-sm text-muted">Your assessment counts double compared to their self-rating, and stays in their DNA for 120 days.</p>
                            <AssessmentForm dimensions={dna.dimensions} initial={dna.scores} onSubmit={submitAssessment} />
                        </section>
                    )}

                    {/* ---------- Action plan ---------- */}
                    {dna.plan.length > 0 && (
                        <section className="card">
                            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
                                <h2 className="text-lg font-bold tracking-tight">This week's plan</h2>
                                <p className="text-sm text-muted">{dna.consistency}% consistency over the last 4 weeks</p>
                            </div>
                            <ul className="divide-y divide-line">
                                {dna.plan.map((p) => (
                                    <li key={p.key} className="flex flex-wrap items-center gap-3 py-3">
                                        <div className="min-w-0 flex-1">
                                            <p className="font-medium">{p.title}</p>
                                            <p className="text-xs text-muted">{p.dimensionLabel} · {p.perWeek}× a week</p>
                                        </div>
                                        <Pips done={p.doneThisWeek} total={p.perWeek} />
                                        {isOwn && (
                                            <button onClick={() => logActivity(p.key)} disabled={busyKey === p.key} className="btn btn-soft px-3 py-2">
                                                <Plus size={15} /> Log
                                            </button>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    {/* ---------- Progress ---------- */}
                    <section className="card">
                        <h2 className="mb-4 text-lg font-bold tracking-tight">Progress</h2>
                        <ProgressChart history={dna.history} target={target} />
                    </section>
                </div>

                {/* ===================== SIDE ===================== */}
                <aside className="space-y-6">
                    {isOwn && dna.opportunities && (
                        <section className="card">
                            <h2 className="mb-4 text-lg font-bold tracking-tight">Opportunities</h2>

                            {/* Brands */}
                            <div className={`mb-5 flex gap-3 rounded-2xl p-4 ${dna.readiness >= BRAND_READY ? 'bg-white text-on-ink' : 'bg-canvas'}`}>
                                <Megaphone size={18} className="mt-0.5 shrink-0" />
                                <p className="text-sm">
                                    {dna.readiness >= BRAND_READY
                                        ? <><b>You're visible to brands.</b> Athletes at {BRAND_READY}%+ readiness show up in brand talent search{isOwn ? ' (if your account is public)' : ''}.</>
                                        : <><b>{BRAND_READY - (dna.readiness ?? 0)}% to go</b> until brands can find you in talent search.</>}
                                </p>
                            </div>

                            {/* Coaches */}
                            <div className="flex items-baseline justify-between gap-2">
                                <p className="label">Best coaches for your gaps</p>
                                <Link to="/discover?sort=match" className="text-xs text-muted hover:text-ink">See all</Link>
                            </div>
                            {dna.opportunities.coaches.length === 0 ? (
                                <p className="mb-4 text-sm text-muted">No coaches in your sport yet.</p>
                            ) : (
                                <ul className="mb-5 space-y-4">
                                    {dna.opportunities.coaches.map((c) => (
                                        <li key={c._id}>
                                            <Link to={`/profile-view/${c._id}`} className="group flex items-start gap-3">
                                                <Avatar name={c.name} photo={c.profilePhoto} pastel className="h-10 w-10 text-xs" />
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <p className="truncate font-semibold group-hover:underline">{c.name}</p>
                                                        {c.match && <MatchBadge score={c.match.score} />}
                                                    </div>
                                                    <p className="text-xs text-muted">
                                                        {c.match?.reasons[0]?.text || [c.skillLevelTaught, c.location].filter(Boolean).join(' · ')}
                                                    </p>
                                                </div>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            )}

                            {/* Tournaments */}
                            <p className="label">Tournaments to enter</p>
                            {dna.opportunities.tournaments.length === 0 ? (
                                <p className="text-sm text-muted">No open tournaments in your sport right now.</p>
                            ) : (
                                <ul className="space-y-3">
                                    {dna.opportunities.tournaments.map((t) => (
                                        <li key={t._id}>
                                            <Link to="/tournaments" className="group flex items-center gap-3">
                                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-canvas"><Trophy size={16} /></span>
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate font-semibold">{t.name}</p>
                                                    <p className="truncate text-xs text-muted">{fmtDate(t.startDate)} · register by {fmtDate(t.registrationDeadline)}</p>
                                                </div>
                                                <ArrowUpRight size={16} className="shrink-0 text-muted group-hover:text-ink" />
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>
                    )}

                    {isOwn && dna.recentLogs.length > 0 && (
                        <section className="card">
                            <h2 className="mb-3 text-lg font-bold tracking-tight">Recent activity</h2>
                            <ul className="space-y-2">
                                {dna.recentLogs.slice(0, 6).map((l) => (
                                    <li key={l._id} className="flex items-center gap-2 text-sm">
                                        <span className="min-w-0 flex-1 truncate">{l.title}</span>
                                        <span className="shrink-0 text-xs text-muted">{fmtDate(l.doneAt)}</span>
                                        <button onClick={() => undoLog(l._id)} aria-label={`Undo ${l.title}`} title="Undo" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted hover:bg-canvas hover:text-ink">
                                            <Undo2 size={14} />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    <section className="card">
                        <h2 className="mb-3 text-lg font-bold tracking-tight">Assessments</h2>
                        <ul className="space-y-3">
                            {dna.assessments.map((a) => (
                                <li key={a._id} className="rounded-2xl bg-canvas p-3 text-sm">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="font-semibold">{a.source === 'self' ? 'Self-rating' : a.assessor?.name || 'Coach'}</span>
                                        <span className={`badge ${a.source === 'coach' ? 'bg-white text-on-ink' : 'bg-white/10 text-muted'}`}>{a.source === 'coach' ? 'Coach' : 'Self'}</span>
                                    </div>
                                    <p className="mt-0.5 text-xs text-muted">{fmtDate(a.createdAt)} · overall {(Object.values(a.scores).reduce((n, v) => n + v, 0) / 6).toFixed(1)}</p>
                                    {a.note && <p className="mt-1.5 text-ink/80">"{a.note}"</p>}
                                </li>
                            ))}
                        </ul>
                    </section>
                </aside>
            </div>
        </div>
    );
};

export default AthleteDna;
