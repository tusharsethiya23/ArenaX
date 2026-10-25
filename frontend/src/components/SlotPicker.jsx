// SlotPicker.jsx
// Pick a date + time from a coach's weekly slots: a scrollable row of date
// tabs (Today, Tomorrow, Mon 27, ...) and that day's slots. Taken or already
// passed slots are crossed out.
// Controlled: `value` is { day, slot } (from slotsForDay) or null, and
// `onChange` gets the same shape (slot is null on a day with nothing open).

import { useState, useEffect, useRef } from 'react';
import { upcomingDays, slotsForDay, isOpenSlot } from '../utils/slots';

const SlotPicker = ({ availability = [], takenSlots = [], dayCount = 14, value, onChange, readOnly = false }) => {
    const days = upcomingDays(dayCount);
    const slotsByDay = days.map((d) => slotsForDay(availability, takenSlots, d));

    // Start on the picked day, else the first day with an open slot
    const [dayIndex, setDayIndex] = useState(() => {
        const picked = days.findIndex((d) => d.iso === value?.day?.iso);
        return picked >= 0 ? picked : Math.max(0, slotsByDay.findIndex((slots) => slots.some(isOpenSlot)));
    });

    // Keep the selected tab visible in the scrolling row (without moving the page)
    const tabsRef = useRef(null);
    useEffect(() => {
        const row = tabsRef.current;
        const tab = row?.children[dayIndex];
        if (tab) row.scrollLeft = Math.max(0, tab.offsetLeft - row.clientWidth / 2 + tab.clientWidth / 2);
    }, [dayIndex]);

    const pickDay = (i) => {
        setDayIndex(i);
        onChange({ day: days[i], slot: slotsByDay[i].find(isOpenSlot) || null });
    };

    const day = days[dayIndex];
    const daySlots = slotsByDay[dayIndex];
    const selected = value?.day?.iso === day.iso ? value.slot?.timeSlot : null;

    return (
        <div>
            <div ref={tabsRef} className="flex gap-6 overflow-x-auto border-b border-line [scrollbar-width:none]" role="tablist" aria-label="Date">
                {days.map((d, i) => {
                    const hasOpen = slotsByDay[i].some(isOpenSlot);
                    return (
                        <button
                            key={d.iso}
                            type="button"
                            role="tab"
                            aria-selected={i === dayIndex}
                            onClick={() => pickDay(i)}
                            className={`-mb-px shrink-0 whitespace-nowrap border-b-2 pb-2.5 font-semibold transition-colors ${
                                i === dayIndex ? 'border-accent text-accent' : hasOpen ? 'border-transparent text-muted hover:text-ink' : 'border-transparent text-muted/50 hover:text-muted'
                            }`}
                        >
                            {d.label}
                        </button>
                    );
                })}
            </div>

            {daySlots.length === 0 ? (
                <p className="mt-4 rounded-2xl bg-canvas px-4 py-3 text-sm text-muted">No slots on {day.dayName}.</p>
            ) : (
                <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {daySlots.map((s) => {
                        const unavailable = !isOpenSlot(s);
                        const isSelected = s.timeSlot === selected;
                        return (
                            <button
                                key={s.timeSlot}
                                type="button"
                                onClick={() => onChange({ day, slot: s })}
                                disabled={unavailable || readOnly}
                                aria-pressed={isSelected}
                                title={s.taken ? 'Already booked' : s.past ? 'Already passed' : s.timeSlot}
                                className={`rounded-2xl px-2 py-3 text-sm font-bold transition-colors ${
                                    isSelected
                                        ? 'bg-accent/15 text-accent ring-1 ring-inset ring-accent/50'
                                        : unavailable
                                            ? 'cursor-not-allowed bg-canvas/50 text-muted/60 line-through'
                                            : readOnly ? 'cursor-default bg-canvas' : 'bg-canvas hover:bg-white/10'
                                }`}
                            >
                                {s.label}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default SlotPicker;
