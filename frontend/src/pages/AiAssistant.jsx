// AiAssistant.jsx
// Chat-style interface for the AI Training Assistant. The conversation lives
// only in component state (not saved to the database); it's a lightweight
// helper, not a saved chat history. Each question is sent to /ai/ask, which
// adds the user's sport and skill level as context on the backend.
// Responsive: the chat area fills the screen height on mobile and is a
// fixed-width centred panel on larger screens.

import { useState, useRef, useEffect } from 'react';
import API from '../api/axios';

const AiAssistant = () => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: "Hi! I'm your AI training assistant. Ask me about drills, technique, recovery, or anything training-related.",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  // Keep the newest message in view
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

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
    <div className="max-w-2xl mx-auto px-4 py-4 sm:py-10 flex flex-col h-[calc(100vh-80px)] sm:h-[80vh]">
      <div className="mb-4 border-l-4 border-teal pl-4">
        <h1 className="font-display text-xl sm:text-2xl text-ink">AI TRAINING ASSISTANT</h1>
        <p className="text-xs sm:text-sm text-stone mt-1">Quick guidance on drills, technique and recovery</p>
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto border border-ink/10 bg-white p-3 sm:p-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] sm:max-w-[75%] px-3 py-2 text-xs sm:text-sm whitespace-pre-wrap break-words ${
                m.role === 'user'
                  ? 'bg-signal text-white'
                  : 'bg-paper border border-ink/10 text-ink'
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-paper border border-ink/10 text-stone px-3 py-2 text-xs sm:text-sm">
              Thinking...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input row */}
      <form onSubmit={handleSend} className="flex gap-2 mt-3 sm:mt-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about training, drills, technique..."
          className="flex-1 min-w-0 border border-ink/15 px-3 py-2.5 text-sm focus:outline-none focus:border-teal"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-teal text-white px-4 sm:px-6 text-sm font-semibold hover:bg-teal/90 disabled:opacity-40"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default AiAssistant;