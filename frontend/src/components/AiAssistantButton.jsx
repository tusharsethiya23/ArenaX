// AiAssistantButton.jsx
// Floating red "Ask AI coach" button (bottom-right on every page) and the chat
// panel it opens. The panel stays mounted while hidden so the conversation
// survives closing/reopening and moving between pages. Escape closes it.
// On mobile both sit above the bottom tab bar.

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
                className={`fixed bottom-[10.5rem] right-4 z-50 flex h-[520px] max-h-[calc(100dvh-72px-12rem)] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0D1220] shadow-[0_25px_60px_rgba(0,0,0,0.55)] transition-all duration-300 ease-out md:bottom-28 md:right-6 md:max-h-[calc(100dvh-72px-9rem)] ${
                    open ? 'visible translate-y-0 opacity-100' : 'invisible translate-y-6 opacity-0'
                }`}
            >
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                    <div className="flex items-center gap-2">
                        <Sparkles size={16} className="text-[#E11D1D]" />
                        <span className="text-sm font-semibold text-white">AI coach</span>
                    </div>
                    <button
                        onClick={() => setOpen(false)}
                        aria-label="Close AI coach"
                        className="rounded-md p-1 text-white/50 transition-colors hover:bg-white/5 hover:text-white"
                    >
                        <X size={18} />
                    </button>
                </div>
                <AiChat active={open} />
            </div>

            {/* ---------- Floating button (+ label on desktop) ---------- */}
            <div className="fixed bottom-20 right-4 z-50 flex items-center gap-3 md:bottom-6 md:right-6">
                <span className="hidden whitespace-nowrap rounded-lg border border-white/10 bg-[#0D1220] px-3 py-2 text-xs text-white/80 shadow-lg md:block">
                    Ask AI coach
                </span>
                <button
                    onClick={() => setOpen(!open)}
                    aria-label={open ? 'Close AI coach' : 'Ask AI coach'}
                    aria-expanded={open}
                    className="flex h-[62px] w-[62px] items-center justify-center rounded-full bg-[#E11D1D] text-white shadow-[0_10px_30px_rgba(225,29,29,0.45)] transition-all hover:bg-[#FF2A2A] active:scale-95"
                >
                    {open ? <X size={24} /> : <Sparkles size={24} />}
                </button>
            </div>
        </>
    );
};

export default AiAssistantButton;
