// AiAssistantButton.jsx
// Floating "Ask AI coach" button (bottom-right on every page) and the chat
// panel it opens. Desktop: black pill with a lime sparkle circle and label.
// Mobile: just the round button, sitting above the bottom tab bar.
// The panel stays mounted while hidden so the conversation survives closing,
// reopening and moving between pages. Escape closes it.

import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Sparkles, X } from 'lucide-react';
import AiChat from './AiChat';

const AiAssistantButton = () => {
    const [open, setOpen] = useState(false);
    const { pathname } = useLocation();

    useEffect(() => {
        if (!open) return;
        const handleKey = (e) => e.key === 'Escape' && setOpen(false);
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [open]);

    // The full-page assistant is already open there
    if (pathname === '/ai-assistant') return null;

    return (
        <>
            {/* ---------- Chat panel: slides up from the bottom-right ---------- */}
            <div
                role="dialog"
                aria-label="AI coach"
                inert={!open}
                className={`fixed bottom-[10.5rem] right-4 z-50 flex h-[540px] max-h-[calc(100dvh-80px-12rem)] w-[min(400px,calc(100vw-2rem))] flex-col overflow-hidden rounded-[28px] border border-line bg-surface shadow-[0_25px_60px_rgba(0,0,0,0.18)] transition-all duration-300 ease-out md:bottom-28 md:right-6 md:max-h-[calc(100dvh-80px-9rem)] lg:right-10 ${
                    open ? 'visible translate-y-0 opacity-100' : 'invisible translate-y-6 opacity-0'
                }`}
            >
                <div className="flex items-center justify-between border-b border-line px-5 py-4">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-lime">
                            <Sparkles size={16} />
                        </span>
                        <span className="font-bold">AI coach</span>
                    </div>
                    <button
                        onClick={() => setOpen(false)}
                        aria-label="Close AI coach"
                        className="flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-canvas hover:text-ink"
                    >
                        <X size={18} />
                    </button>
                </div>
                <AiChat active={open} />
            </div>

            {/* ---------- Floating button ---------- */}
            <button
                onClick={() => setOpen(!open)}
                aria-label={open ? 'Close AI coach' : 'Ask AI coach'}
                aria-expanded={open}
                className="fixed bottom-20 right-4 z-50 flex h-[62px] items-center gap-3 rounded-full bg-ink p-2 text-white shadow-[0_10px_30px_rgba(0,0,0,0.25)] transition-transform active:scale-95 md:bottom-6 md:right-6 md:pr-6 lg:right-10"
            >
                <span className="flex h-[46px] w-[46px] items-center justify-center rounded-full bg-lime text-ink">
                    {open ? <X size={20} /> : <Sparkles size={20} />}
                </span>
                <span className="hidden whitespace-nowrap text-base font-semibold md:block">
                    {open ? 'Close' : 'Ask AI coach'}
                </span>
            </button>
        </>
    );
};

export default AiAssistantButton;
