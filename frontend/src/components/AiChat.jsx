// AiChat.jsx
// The AI Training Assistant conversation (message list + input), shared by the
// /ai-assistant page and the floating chat panel. The conversation lives only
// in component state (not saved to the database). Each question is sent to
// /ai/ask, which adds the user's sport and skill level as context on the backend.
// Fills whatever height its parent gives it.

import { useState, useRef, useEffect } from 'react';
import API from '../api/axios';

const AiChat = ({ active = true }) => {
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            text: "Hi! I'm your AI training assistant. Ask me about drills, technique, recovery, or anything training-related.",
        },
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const listRef = useRef(null);
    const inputRef = useRef(null);

    // Keep the newest message in view (scrolls only the message list, not the page)
    useEffect(() => {
        const list = listRef.current;
        if (list) list.scrollTo({ top: list.scrollHeight, behavior: 'smooth' });
    }, [messages, loading]);

    // Focus the input whenever the chat becomes visible
    useEffect(() => {
        if (active) inputRef.current?.focus();
    }, [active]);

    const handleSend = async (e) => {
        e.preventDefault();
        const question = input.trim();
        if (!question || loading) return;

        setMessages((prev) => [...prev, { role: 'user', text: question }]);
        setInput('');
        setLoading(true);

        try {
            const res = await API.post('/ai/ask', { message: question });
            setMessages((prev) => [...prev, { role: 'assistant', text: res.data.reply }]);
        } catch (err) {
            // Show the server's message if there is one, so problems are visible
            const reason = err.response?.data?.message || "Couldn't reach the assistant. Please try again.";
            setMessages((prev) => [...prev, { role: 'assistant', text: reason }]);
        }
        setLoading(false);
    };

    return (
        <div className="flex h-full min-h-0 flex-col">
            {/* Message list */}
            <div ref={listRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3 sm:p-4">
                {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div
                            className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm leading-6 ${
                                m.role === 'user'
                                    ? 'rounded-br-sm bg-[#E11D1D] text-white'
                                    : 'rounded-bl-sm border border-white/10 bg-white/[0.04] text-white/85'
                            }`}
                        >
                            {m.text}
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="flex justify-start">
                        <div className="rounded-2xl rounded-bl-sm border border-white/10 bg-white/[0.04] px-3.5 py-2 text-sm text-white/40">
                            Thinking...
                        </div>
                    </div>
                )}
            </div>

            {/* Input row */}
            <form onSubmit={handleSend} className="flex gap-2 border-t border-white/10 p-3">
                <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about training, drills, technique..."
                    className="min-w-0 flex-1 rounded-lg border border-white/10 bg-[#07090F] px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/25 focus:border-[#E11D1D]"
                />
                <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="rounded-lg bg-[#E11D1D] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#FF2A2A] disabled:opacity-40"
                >
                    Send
                </button>
            </form>
        </div>
    );
};

export default AiChat;
