// Modal.jsx
// Shared popup used by every dialog in the app: dimmed, blurred backdrop and
// a solid rounded panel that scales in. Closes on Escape, a click on the
// backdrop, or the X. While open it locks page scrolling, keeps Tab focus
// inside the panel, and puts focus back where it was when it closes.
// It is drawn straight into <body> (a portal): inside a glass card, the
// card's blur would otherwise trap the "fixed" backdrop within that card.
//   title:       heading (also the dialog's accessible name)
//   description: optional muted line under the title
//   icon:        optional element shown in a round tile above the title
//   alert:       true for questions that need an answer (role="alertdialog", no X)

import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

const Modal = ({ title, description, icon, onClose, children, alert = false, className = 'max-w-sm' }) => {
    const panelRef = useRef(null);
    const titleId = useId();
    const descId = useId();
    // Latest onClose, so the key listener below is added once
    const closeRef = useRef(onClose);
    useEffect(() => { closeRef.current = onClose; }, [onClose]);

    useEffect(() => {
        const before = document.activeElement;
        const panel = panelRef.current;
        // Focus the field/button marked data-autofocus, else the first focusable one
        (panel.querySelector('[data-autofocus]') || panel.querySelector(FOCUSABLE) || panel).focus();

        const onKey = (e) => {
            if (e.key === 'Escape') { e.stopPropagation(); closeRef.current(); }
            if (e.key !== 'Tab') return;
            const items = [...panel.querySelectorAll(FOCUSABLE)];
            if (!items.length) return;
            const first = items[0];
            const last = items[items.length - 1];
            if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
            else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        };
        document.addEventListener('keydown', onKey);

        const { overflow } = document.body.style;
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = overflow;
            before?.focus?.();
        };
    }, []);

    return createPortal(
        <div
            className="modal-backdrop fixed inset-0 z-60 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center"
            onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div
                ref={panelRef}
                role={alert ? 'alertdialog' : 'dialog'}
                aria-modal="true"
                aria-labelledby={titleId}
                aria-describedby={description ? descId : undefined}
                tabIndex={-1}
                className={`modal-panel relative flex max-h-[85vh] w-full flex-col overflow-hidden rounded-[28px] border border-line bg-popover shadow-[0_24px_60px_rgba(0,0,0,0.5)] outline-none ${className}`}
            >
                <div className="px-6 pb-2 pt-6">
                    {icon && <div className="mb-4">{icon}</div>}
                    <h2 id={titleId} className="pr-8 text-xl font-extrabold tracking-tight">{title}</h2>
                    {description && <p id={descId} className="mt-1.5 text-sm leading-6 text-muted">{description}</p>}
                    {!alert && (
                        <button onClick={onClose} aria-label="Close" className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-canvas hover:text-ink">
                            <X size={18} />
                        </button>
                    )}
                </div>
                <div className="min-h-0 overflow-y-auto px-6 pb-6 pt-3">{children}</div>
            </div>
        </div>,
        document.body
    );
};

export default Modal;
