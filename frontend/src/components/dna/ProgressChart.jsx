// ProgressChart.jsx
// Overall DNA score (0-10) after each assessment, as a single 2px line with a
// soft lime wash under it, a grey reference line at the goal, the latest value
// labelled at the end, a hover crosshair + tooltip, and a table view.

import { useState, useRef } from 'react';

const W = 640;
const H = 220;
const PAD = { top: 16, right: 44, bottom: 28, left: 28 };
const fmtDate = (iso) => new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

const ProgressChart = ({ history, target }) => {
    const [hover, setHover] = useState(null);
    const svgRef = useRef(null);

    if (history.length === 0) return <p className="text-sm text-muted">No assessments yet.</p>;

    const innerW = W - PAD.left - PAD.right;
    const innerH = H - PAD.top - PAD.bottom;
    const x = (i) => PAD.left + (history.length === 1 ? innerW / 2 : (i / (history.length - 1)) * innerW);
    const y = (v) => PAD.top + innerH - (v / 10) * innerH;
    const points = history.map((h, i) => [x(i), y(h.overall)]);
    const line = points.map(([px, py], i) => `${i ? 'L' : 'M'}${px},${py}`).join(' ');
    const area = `${line} L${points.at(-1)[0]},${y(0)} L${points[0][0]},${y(0)} Z`;
    const last = history.at(-1);

    // Nearest point to the pointer
    const onMove = (e) => {
        const rect = svgRef.current.getBoundingClientRect();
        const px = ((e.clientX - rect.left) / rect.width) * W;
        let best = 0;
        points.forEach(([pxi], i) => { if (Math.abs(pxi - px) < Math.abs(points[best][0] - px)) best = i; });
        setHover(best);
    };

    return (
        <div>
            <div className="relative">
                <svg
                    ref={svgRef}
                    viewBox={`0 0 ${W} ${H}`}
                    className="h-auto w-full"
                    role="img"
                    aria-label={`Overall DNA score over time, from ${history[0].overall} to ${last.overall}`}
                    onMouseMove={onMove}
                    onMouseLeave={() => setHover(null)}
                >
                    {/* Gridlines at 0, 5, 10 */}
                    {[0, 5, 10].map((v) => (
                        <g key={v}>
                            <line x1={PAD.left} x2={W - PAD.right} y1={y(v)} y2={y(v)} stroke="#E4E4E4" strokeWidth="1" />
                            <text x={PAD.left - 8} y={y(v) + 4} textAnchor="end" fontSize="11" fill="#8A8A8A">{v}</text>
                        </g>
                    ))}

                    {/* Goal reference line */}
                    {target && (
                        <g>
                            <line x1={PAD.left} x2={W - PAD.right} y1={y(target)} y2={y(target)} stroke="#8A8A8A" strokeWidth="1" />
                            <text x={W - PAD.right + 6} y={y(target) + 4} fontSize="11" fill="#8A8A8A">Goal {target}</text>
                        </g>
                    )}

                    {history.length > 1 && <path d={area} fill="#D4F23B" fillOpacity="0.25" />}
                    {history.length > 1 && <path d={line} fill="none" stroke="#111111" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />}

                    {/* Crosshair */}
                    {hover !== null && (
                        <line x1={points[hover][0]} x2={points[hover][0]} y1={PAD.top} y2={y(0)} stroke="#111111" strokeOpacity="0.25" strokeWidth="1" />
                    )}

                    {/* End dot (2px surface ring) + its value; hovered dot */}
                    {[history.length - 1, ...(hover !== null && hover !== history.length - 1 ? [hover] : [])].map((i) => (
                        <circle key={i} cx={points[i][0]} cy={points[i][1]} r="5" fill="#111111" stroke="#FFFFFF" strokeWidth="2" />
                    ))}
                    {/* Latest value; drops below the dot when it would collide with the goal label */}
                    <text
                        x={points.at(-1)[0] + 9}
                        y={points.at(-1)[1] + (target && Math.abs(target - last.overall) < 1 ? 18 : -8)}
                        fontSize="12"
                        fontWeight="700"
                        fill="#111111"
                    >
                        {last.overall}
                    </text>

                    {/* First and last dates */}
                    <text x={points[0][0]} y={H - 8} textAnchor={history.length === 1 ? 'middle' : 'start'} fontSize="11" fill="#8A8A8A">{fmtDate(history[0].date)}</text>
                    {history.length > 1 && <text x={points.at(-1)[0]} y={H - 8} textAnchor="end" fontSize="11" fill="#8A8A8A">{fmtDate(last.date)}</text>}
                </svg>

                {/* Tooltip: one line, above the point; anchored left/right near the edges so it stays inside */}
                {hover !== null && (
                    <div
                        className={`pointer-events-none absolute -translate-y-full whitespace-nowrap rounded-xl bg-ink px-3 py-1.5 text-xs text-on-ink shadow ${
                            points[hover][0] > W * 0.75 ? '-translate-x-full' : points[hover][0] < W * 0.25 ? '' : '-translate-x-1/2'
                        }`}
                        style={{ left: `${(points[hover][0] / W) * 100}%`, top: `${(points[hover][1] / H) * 100}%`, marginTop: -10 }}
                    >
                        <span className="font-semibold">{history[hover].overall}</span> / 10 · {fmtDate(history[hover].date)}
                    </div>
                )}
            </div>

            {history.length === 1 && <p className="mt-1 text-sm text-muted">Re-assess later to see your progress line.</p>}

            <details className="mt-2 text-sm">
                <summary className="cursor-pointer text-muted hover:text-ink">View as table</summary>
                <table className="mt-2 w-full text-left">
                    <thead><tr className="text-muted"><th className="py-1 font-medium">Date</th><th className="py-1 font-medium">Overall score</th></tr></thead>
                    <tbody>
                        {history.map((h) => (
                            <tr key={h.date} className="border-t border-line"><td className="py-1">{fmtDate(h.date)}</td><td className="py-1 tabular-nums">{h.overall}</td></tr>
                        ))}
                    </tbody>
                </table>
            </details>
        </div>
    );
};

export default ProgressChart;
