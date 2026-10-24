// MonthCalendar.jsx
// Month grid for the Calendar page. Days with sessions get a dot per session
// (up to three), coloured by status, with a legend underneath so colour is
// never the only cue (each day's button also says how many sessions it has).
// Clicking a day filters the session lists to that day; clicking it again clears it.

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { toISODate, fromISODate } from '../../utils/slots';

const WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const SHOWN = ['pending', 'confirmed', 'completed']; // declined / cancelled don't appear on the grid
const DOT = { confirmed: 'bg-ink', pending: 'bg-[#E8A300]', completed: 'bg-muted/50' };
const LEGEND = [['confirmed', 'Confirmed'], ['pending', 'Requested'], ['completed', 'Completed']];

const MonthCalendar = ({ bookings, selected, onSelect }) => {
    const [month, setMonth] = useState(() => {
        const d = selected ? fromISODate(selected) : new Date();
        return new Date(d.getFullYear(), d.getMonth(), 1);
    });
    const todayIso = toISODate(new Date());

    const byDate = {};
    for (const b of bookings) {
        if (b.date && SHOWN.includes(b.status)) (byDate[b.date] ||= []).push(b.status);
    }

    const lead = (month.getDay() + 6) % 7; // Monday-first grid
    const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const cells = [
        ...Array(lead).fill(null),
        ...Array.from({ length: daysInMonth }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1)),
    ];
    const shift = (n) => setMonth(new Date(month.getFullYear(), month.getMonth() + n, 1));
    const monthTotal = Object.entries(byDate)
        .filter(([iso]) => iso.startsWith(toISODate(month).slice(0, 7)))
        .reduce((sum, [, list]) => sum + list.length, 0);

    return (
        <section className="card">
            <div className="mb-4 flex items-center justify-between gap-2">
                <div>
                    <h2 className="text-lg font-bold tracking-tight">
                        {month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                    </h2>
                    <p className="text-sm text-muted">{monthTotal} {monthTotal === 1 ? 'session' : 'sessions'}</p>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={() => shift(-1)} aria-label="Previous month" className="flex h-9 w-9 items-center justify-center rounded-full bg-canvas hover:bg-[#E2E2E2]">
                        <ChevronLeft size={16} />
                    </button>
                    <button
                        onClick={() => { const d = new Date(); setMonth(new Date(d.getFullYear(), d.getMonth(), 1)); }}
                        className="rounded-full bg-canvas px-3 py-2 text-xs font-semibold hover:bg-[#E2E2E2]"
                    >
                        Today
                    </button>
                    <button onClick={() => shift(1)} aria-label="Next month" className="flex h-9 w-9 items-center justify-center rounded-full bg-canvas hover:bg-[#E2E2E2]">
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center">
                {WEEK.map((d) => <span key={d} className="pb-1 text-xs font-semibold text-muted">{d.slice(0, 2)}</span>)}
                {cells.map((date, i) => {
                    if (!date) return <span key={`blank-${i}`} />;
                    const iso = toISODate(date);
                    const list = byDate[iso] || [];
                    const isSelected = iso === selected;
                    const isToday = iso === todayIso;
                    return (
                        <button
                            key={iso}
                            onClick={() => onSelect(isSelected ? null : iso)}
                            aria-pressed={isSelected}
                            aria-label={`${date.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}: ${list.length || 'no'} ${list.length === 1 ? 'session' : 'sessions'}`}
                            className={`flex aspect-square flex-col items-center justify-center rounded-2xl text-sm font-semibold transition-colors ${
                                isSelected
                                    ? 'bg-ink text-white'
                                    : isToday ? 'bg-lime text-ink' : list.length ? 'bg-canvas hover:bg-[#E2E2E2]' : 'text-ink/70 hover:bg-canvas'
                            }`}
                        >
                            {date.getDate()}
                            <span className="mt-0.5 flex h-1.5 gap-0.5">
                                {list.slice(0, 3).map((s, j) => (
                                    <span key={j} className={`h-1.5 w-1.5 rounded-full ${isSelected && s === 'confirmed' ? 'bg-lime' : DOT[s]}`} />
                                ))}
                            </span>
                        </button>
                    );
                })}
            </div>

            <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                {LEGEND.map(([s, label]) => (
                    <li key={s} className="flex items-center gap-1.5"><span className={`h-2 w-2 rounded-full ${DOT[s]}`} /> {label}</li>
                ))}
            </ul>
        </section>
    );
};

export default MonthCalendar;
