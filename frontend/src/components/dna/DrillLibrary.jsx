// DrillLibrary.jsx
// Every drill, grouped by level (beginner / intermediate / advanced). Beginner
// is open to everyone; a locked level shows a lock, what unlocks it and how
// close the athlete is (the server decides, see DRILL_LEVELS in dna.util.js).
// Unlocked drills can be logged from here (own DNA only).

import { Lock, Plus, Unlock } from 'lucide-react';
import LevelChip from './LevelChip';
import { LEVEL_STYLE } from '../../utils/drills';

const DrillLibrary = ({ drills, levels, isOwn, onLog, busyKey }) => (
    <section className="card">
        <h2 className="text-lg font-bold tracking-tight">Drill library</h2>
        <p className="mt-1 text-sm text-muted">Beginner drills are open to everyone. Keep training to unlock the next level.</p>

        <div className="mt-5 space-y-5">
            {levels.map((lv) => {
                const list = drills.filter((d) => d.level === lv.level);
                return (
                    <div key={lv.level} className={`rounded-3xl p-4 ${lv.unlocked ? 'bg-canvas' : 'bg-canvas/60'}`}>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <LevelChip level={lv.level} />
                                <span className="text-xs text-muted">{lv.completed} completed</span>
                            </div>
                            <span className={`flex items-center gap-1.5 text-xs font-semibold ${lv.unlocked ? 'text-data-mint' : 'text-muted'}`}>
                                {lv.unlocked ? <><Unlock size={13} /> Unlocked</> : <><Lock size={13} /> Locked</>}
                            </span>
                        </div>

                        {/* How to unlock, with progress towards either route */}
                        {!lv.unlocked && (
                            <div className="mt-3 rounded-2xl border border-line p-3">
                                <p className="flex items-start gap-2 text-sm font-medium">
                                    <Lock size={15} className="mt-0.5 shrink-0 text-accent" />
                                    {lv.condition} to unlock.
                                </p>
                                {lv.progress && (
                                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        {lv.progress.map((p) => (
                                            <div key={p.label}>
                                                <div className="flex justify-between text-xs text-muted">
                                                    <span>{p.label}</span>
                                                    <span className="font-semibold text-ink">{p.value}/{p.target}</span>
                                                </div>
                                                <div className="mt-1 h-1.5 rounded-full bg-white/10" aria-hidden="true">
                                                    <div className={`h-full rounded-full ${LEVEL_STYLE[lv.level].bar}`} style={{ width: `${Math.round((p.value / p.target) * 100)}%` }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        <ul className="mt-2 divide-y divide-line">
                            {list.map((d) => (
                                <li key={d.key} className="flex items-center gap-3 py-2.5">
                                    <div className="min-w-0 flex-1">
                                        <p className={`text-sm font-medium ${d.locked ? 'text-ink/65' : ''}`}>{d.title}</p>
                                        <p className="text-xs text-muted">{d.dimensionLabel} · {d.perWeek}× a week</p>
                                    </div>
                                    {d.locked ? (
                                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-muted" title={lv.condition} aria-label={`Locked: ${lv.condition}`}>
                                            <Lock size={15} />
                                        </span>
                                    ) : isOwn && (
                                        <button onClick={() => onLog(d.key)} disabled={busyKey === d.key} aria-label={`Log ${d.title}`} className="btn btn-soft shrink-0 px-3 py-2">
                                            <Plus size={15} /> Log
                                        </button>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>
                );
            })}
        </div>
    </section>
);

export default DrillLibrary;
