// Select.jsx
// The app's dropdown, replacing the browser's <select> so the open list
// matches ArenaX (rounded card, lime check on the chosen option) instead of
// the grey system list.
//
//   <Select value={v} onChange={setV} options={[{ value, label }]} />
//
// variant: 'field'  — looks like the other form inputs (default)
//          'inline' — just text + chevron, for sort pickers and search bars
// Keyboard: Enter/Space/Arrow keys open; Up/Down/Home/End move; Enter picks;
// Esc closes; typing a letter jumps to the first option starting with it.
// The list opens upward when there isn't room below.

import { useState, useRef, useEffect, useCallback, useId } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import useDismiss from '../hooks/useDismiss';

const LIST_MAX = 288; // px, matches max-h-72

const Select = ({
    value,
    onChange,
    options,
    id,
    placeholder = 'Select...',
    variant = 'field',
    className = '',
    buttonClassName = '',
    disabled = false,
    'aria-label': ariaLabel,
}) => {
    const autoId = useId();
    const buttonId = id || `select-${autoId}`;
    const listId = `${buttonId}-list`;
    const [open, setOpen] = useState(false);
    const [active, setActive] = useState(-1);
    const [upward, setUpward] = useState(false);
    const wrapRef = useRef(null);
    const buttonRef = useRef(null);
    const listRef = useRef(null);

    const selectedIndex = options.findIndex((o) => o.value === value);
    const selected = options[selectedIndex];

    const close = useCallback(() => setOpen(false), []);
    useDismiss(wrapRef, open, close);

    const openList = (index = selectedIndex) => {
        if (disabled) return;
        const rect = buttonRef.current.getBoundingClientRect();
        const below = window.innerHeight - rect.bottom;
        setUpward(below < Math.min(LIST_MAX, options.length * 44 + 16) && rect.top > below);
        setActive(index >= 0 ? index : 0);
        setOpen(true);
    };

    const choose = (index) => {
        const option = options[index];
        if (option && !option.disabled) onChange(option.value);
        setOpen(false);
        buttonRef.current?.focus();
    };

    // Keep the highlighted option in view while moving with the keyboard
    useEffect(() => {
        if (!open || active < 0) return;
        listRef.current?.children[active]?.scrollIntoView({ block: 'nearest' });
    }, [open, active]);

    const move = (from, step) => {
        for (let i = 1; i <= options.length; i++) {
            const next = (from + step * i + options.length) % options.length;
            if (!options[next].disabled) return next;
        }
        return from;
    };

    const handleKeyDown = (e) => {
        if (disabled) return;
        if (!open) {
            if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
                e.preventDefault();
                openList();
            }
            return;
        }
        if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => move(i, 1)); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => move(i, -1)); }
        else if (e.key === 'Home') { e.preventDefault(); setActive(move(-1, 1)); }
        else if (e.key === 'End') { e.preventDefault(); setActive(move(options.length, -1)); }
        else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(active); }
        else if (e.key === 'Tab') setOpen(false);
        else if (e.key.length === 1) {
            // Type-to-jump: next option starting with that letter
            const letter = e.key.toLowerCase();
            const start = active + 1;
            for (let k = 0; k < options.length; k++) {
                const i = (start + k) % options.length;
                if (!options[i].disabled && String(options[i].label).toLowerCase().startsWith(letter)) { setActive(i); break; }
            }
        }
    };

    const isField = variant === 'field';

    return (
        <div ref={wrapRef} className={`relative ${isField ? 'w-full' : 'inline-block'} ${className}`}>
            <button
                ref={buttonRef}
                id={buttonId}
                type="button"
                disabled={disabled}
                onClick={() => (open ? close() : openList())}
                onKeyDown={handleKeyDown}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-controls={open ? listId : undefined}
                aria-activedescendant={open && active >= 0 ? `${listId}-${active}` : undefined}
                aria-label={ariaLabel}
                className={isField
                    ? `input flex items-center justify-between gap-2 text-left disabled:cursor-not-allowed disabled:opacity-60 ${open ? 'border-ink/20 bg-white/10' : ''} ${buttonClassName}`
                    : `inline-flex max-w-full items-center gap-1 font-medium outline-none focus-visible:underline disabled:opacity-60 ${buttonClassName}`}
            >
                <span className={`truncate ${selected ? '' : 'text-muted'}`}>{selected ? selected.label : placeholder}</span>
                <ChevronDown size={isField ? 16 : 14} className={`shrink-0 text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <ul
                    ref={listRef}
                    id={listId}
                    role="listbox"
                    aria-labelledby={ariaLabel ? undefined : buttonId}
                    aria-label={ariaLabel}
                    className={`dropdown-panel absolute z-50 max-h-72 min-w-full overflow-auto rounded-2xl border border-line bg-popover p-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.12)] ${upward ? 'bottom-full mb-2 origin-bottom' : 'top-full mt-2 origin-top'} ${isField ? 'left-0 right-0' : 'right-0 w-max max-w-[min(18rem,calc(100vw-2rem))]'}`}
                >
                    {options.map((o, i) => {
                        const isSelected = i === selectedIndex;
                        return (
                            <li
                                key={String(o.value)}
                                id={`${listId}-${i}`}
                                role="option"
                                aria-selected={isSelected}
                                aria-disabled={o.disabled || undefined}
                                onMouseEnter={() => !o.disabled && setActive(i)}
                                onMouseDown={(e) => e.preventDefault()} // keep focus on the button
                                onClick={() => !o.disabled && choose(i)}
                                className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm ${
                                    o.disabled ? 'cursor-not-allowed text-muted/60' : i === active ? 'bg-canvas' : ''
                                } ${isSelected ? 'font-semibold' : ''}`}
                            >
                                <span className="truncate">{o.label}</span>
                                {isSelected && (
                                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-on-ink">
                                        <Check size={12} strokeWidth={3} />
                                    </span>
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
};

export default Select;
