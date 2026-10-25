// AiAssistant.jsx
// Full-page version of the AI Training Assistant (route: /ai-assistant).
// The chat itself lives in components/AiChat.jsx, shared with the floating
// "Ask AI coach" panel. Fills the screen height under the 80px navbar
// (and above the mobile tab bar).

import { Sparkles } from 'lucide-react';
import AiChat from '../components/AiChat';

const AiAssistant = () => (
    <div className="mx-auto flex h-[calc(100dvh-80px-4rem)] max-w-3xl flex-col px-4 py-4 sm:px-6 md:h-[calc(100dvh-80px)] md:pb-8">
        <div className="mb-4 flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-lime text-on-ink">
                <Sparkles size={22} />
            </span>
            <div>
                <h1 className="text-2xl font-extrabold tracking-tight">AI coach</h1>
                <p className="text-sm text-muted">Quick guidance on drills, technique and recovery</p>
            </div>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden rounded-[28px] bg-surface">
            <AiChat />
        </div>
    </div>
);

export default AiAssistant;
