// AiAssistant.jsx
// Full-page version of the AI Training Assistant (route: /ai-assistant).
// The chat itself lives in components/AiChat.jsx, shared with the floating
// "Ask AI coach" panel. Fills the screen height under the 72px navbar
// (and above the mobile tab bar).

import AiChat from '../components/AiChat';

const AiAssistant = () => (
    <div className="bg-[#05070D]">
        <div className="mx-auto flex h-[calc(100dvh-72px-4rem)] max-w-2xl flex-col px-4 py-4 sm:py-8 md:h-[calc(100dvh-72px)]">
            <div className="mb-4 border-l-4 border-[#E11D1D] pl-4">
                <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.3em] text-[#FF2A2A]">ARENAX / AI COACH</p>
                <h1 className="text-xl font-black uppercase tracking-tight text-white sm:text-2xl">AI Training Assistant</h1>
                <p className="mt-1 text-xs text-[#8B95A5] sm:text-sm">Quick guidance on drills, technique and recovery</p>
            </div>

            <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-white/10 bg-[#0D1220]">
                <AiChat />
            </div>
        </div>
    </div>
);

export default AiAssistant;
