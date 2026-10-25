// SkillBars.jsx
// Athlete DNA "skills vs goal": one horizontal bar per skill on a 0-10 scale.
// Ink bar = current score, grey tick = the goal's target, and the numbers are
// written out ("5.7 / 7 · 1.3 to go") so nothing relies on colour alone.

const SkillBars = ({ dimensions, scores, target }) => (
    <ul className="space-y-4">
        {dimensions.map((d) => {
            const current = scores?.[d.key] ?? 0;
            const gap = target ? Math.max(0, Math.round((target - current) * 10) / 10) : 0;
            return (
                <li key={d.key}>
                    <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                        <span className="font-medium">{d.label}</span>
                        <span className="tabular-nums text-muted">
                            <span className="font-semibold text-ink">{current}</span>
                            {target ? <> / {target} · {gap > 0 ? `${gap} to go` : 'goal met'}</> : ' / 10'}
                        </span>
                    </div>
                    <div
                        className="relative h-3 rounded-full bg-canvas"
                        role="img"
                        aria-label={`${d.label}: ${current} out of 10${target ? `, goal ${target}` : ''}`}
                        title={`${d.label}: ${current}${target ? ` (goal ${target})` : ''}`}
                    >
                        <div className="absolute inset-y-0 left-0 rounded-full bg-lime" style={{ width: `${current * 10}%` }} />
                        {target && (
                            // Goal marker: a short upright tick that sticks out above and below the track
                            <div className="absolute -inset-y-1 w-0.5 rounded-full bg-muted" style={{ left: `calc(${target * 10}% - 1px)` }} />
                        )}
                    </div>
                </li>
            );
        })}
    </ul>
);

export default SkillBars;
