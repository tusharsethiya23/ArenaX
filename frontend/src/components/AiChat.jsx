// AiChat.jsx
// The AI coach conversation (message list + input), shared by the
// /ai-assistant page and the floating chat panel. The conversation lives only
// in component state (not saved to the database). Each question is sent to
// /ai/ask with the recent messages for context; the backend adds the user's
// sport, level and (for athletes) their Athlete DNA.
// Fills whatever height its parent gives it.

import { useState, useRef, useEffect } from 'react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

const MAX_LENGTH = 1000; // keep in sync with Backend/controllers/ai.controller.js
const HISTORY = 10;

// Starter questions shown on an empty chat
const SUGGESTIONS = {
    learner: [
        'Build me a plan for my biggest gap',
        'What should I eat before a match?',
        'How do I stay calm under pressure?',
    ],
    coach: [
        'Plan a 60-minute session for beginners',
        'Drills to improve a player\'s footwork',
        'How do I keep young athletes motivated?',
    ],
};

// Minimal, safe markdown: **bold**, "- " / "1. " lists, paragraphs.
// Builds React elements (never HTML strings), so replies can't inject markup.
const renderInline = (text) =>
    text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
        part.startsWith('**') && part.endsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong> : part.replace(/\*/g, '')
    );

const Markdown = ({ text }) => {
    const blocks = [];
    for (const line of text.split('\n')) {
        const bullet = line.match(/^\s*(?:[-*•]|\d+[.)])\s+(.*)$/);
        const last = blocks.at(-1);
        if (bullet) {
            if (last?.type === 'list') last.items.push(bullet[1]);
            else blocks.push({ type: 'list', ordered: /^\s*\d/.test(line), items: [bullet[1]] });
        } else if (line.trim()) {
            blocks.push({ type: 'p', text: line.replace(/^#+\s*/, '') });
        }
    }
    return (
        <div className="space-y-2">
            {blocks.map((b, i) => {
                if (b.type === 'p') return <p key={i}>{renderInline(b.text)}</p>;
                const List = b.ordered ? 'ol' : 'ul';
                return (
                    <List key={i} className={`space-y-1 pl-5 ${b.ordered ? 'list-decimal' : 'list-disc'}`}>
                        {b.items.map((item, j) => <li key={j}>{renderInline(item)}</li>)}
                    </List>
                );
            })}
        </div>
    );
};

const AiChat = ({ active = true }) => {
    const { user } = useAuth();
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            text: user?.role === 'coach'
                ? "Hi! I'm your AI coaching assistant. Ask me about session plans, drills or player development."
                : "Hi! I'm your AI coach. I know your sport and your Athlete DNA, so ask me about drills, your plan, recovery or mindset.",
            intro: true,
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

    const ask = async (question) => {
        if (!question || loading) return;
        // Earlier real turns (not the intro or error notices) go along for context
        const history = messages.filter((m) => !m.intro && !m.error).slice(-HISTORY).map(({ role, text }) => ({ role, text }));

        setMessages((prev) => [...prev, { role: 'user', text: question }]);
        setInput('');
        setLoading(true);

        try {
            const res = await API.post('/ai/ask', { message: question, history });
            setMessages((prev) => [...prev, { role: 'assistant', text: res.data.reply }]);
        } catch (err) {
            // Show the server's message if there is one, so problems are visible
            const reason = err.response?.data?.message || "Couldn't reach the AI coach. Please try again.";
            setMessages((prev) => [...prev, { role: 'assistant', text: reason, error: true }]);
        }
        setLoading(false);
    };

    const handleSend = (e) => {
        e.preventDefault();
        ask(input.trim());
    };

    const showSuggestions = messages.length === 1 && !loading;

    return (
        <div className="flex h-full min-h-0 flex-col">
            {/* Message list */}
            <div ref={listRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3 sm:p-4" aria-live="polite">
                {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div
                            className={`max-w-[85%] break-words rounded-3xl px-4 py-2.5 text-sm leading-6 ${
                                m.role === 'user'
                                    ? 'whitespace-pre-wrap rounded-br-md bg-ink text-on-ink'
                                    : m.error ? 'rounded-bl-md bg-danger/10 text-danger' : 'rounded-bl-md bg-canvas text-ink'
                            }`}
                        >
                            {m.role === 'user' ? m.text : <Markdown text={m.text} />}
                        </div>
                    </div>
                ))}

                {showSuggestions && (
                    <div className="flex flex-wrap gap-2 pt-1">
                        {(SUGGESTIONS[user?.role] || SUGGESTIONS.learner).map((s) => (
                            <button key={s} onClick={() => ask(s)} className="rounded-full border border-line px-3 py-1.5 text-left text-xs font-medium transition-colors hover:border-ink">
                                {s}
                            </button>
                        ))}
                    </div>
                )}

                {loading && (
                    <div className="flex justify-start">
                        <div className="rounded-3xl rounded-bl-md bg-canvas px-4 py-2.5 text-sm text-muted">
                            Thinking...
                        </div>
                    </div>
                )}
            </div>

            {/* Input row */}
            <form onSubmit={handleSend} className="flex gap-2 border-t border-line p-3">
                <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    maxLength={MAX_LENGTH}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about training, drills, technique..."
                    aria-label="Ask the AI coach"
                    className="input rounded-full"
                />
                <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="btn btn-lime"
                >
                    Send
                </button>
            </form>
        </div>
    );
};

export default AiChat;
