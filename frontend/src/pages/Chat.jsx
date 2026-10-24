// Chat.jsx
// Real-time chat for a specific confirmed booking, using Socket.io for
// instant message delivery. Falls back to REST (sendMessage API) to
// persist each message in the database.

import { useState, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import socket from '../socket';

const Chat = () => {
  const { bookingId } = useParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const bottomRef = useRef(null);

  // Load existing message history via REST, then connect socket for new ones
  useEffect(() => {
    API.get(`/messages/${bookingId}`).then((res) => setMessages(res.data));

    socket.connect();
    socket.emit('joinBookingRoom', bookingId);

    // When another user sends a message, add it to our list instantly
    socket.on('receiveMessage', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      socket.off('receiveMessage'); // stop listening when leaving this page
      socket.disconnect();
    };
  }, [bookingId]);

  // Auto-scroll to the latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    try {
      // Save to database via REST (so it persists and survives refresh)
      const res = await API.post('/messages', { bookingId, text });

      // Broadcast to the other person in real time
      socket.emit('sendMessage', { ...res.data, bookingId });

      // Show it in our own chat immediately too
      setMessages((prev) => [...prev, res.data]);
      setText('');
    } catch (err) {
      alert(err.response?.data?.message || 'Something went wrong');
    }
  };

  return (
    <div className="mx-auto flex h-[calc(100dvh-80px-4rem)] w-full max-w-3xl flex-col px-4 pb-4 pt-4 sm:px-6 md:h-[calc(100dvh-80px)] md:pb-28">
      <div className="mb-4 flex items-center gap-3">
        <Link to="/calendar" aria-label="Back to calendar" className="flex h-10 w-10 items-center justify-center rounded-full bg-surface">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-2xl font-extrabold tracking-tight">Chat</h1>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[28px] bg-surface">
        <div className="flex-1 space-y-3 overflow-y-auto p-4 sm:p-5">
          {messages.length === 0 && (
            <p className="py-10 text-center text-sm text-muted">No messages yet. Say hello!</p>
          )}
          {messages.map((m, i) => {
            const isMine = m.sender?._id === user._id || m.sender === user._id;
            return (
              <div key={i} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] whitespace-pre-wrap break-words rounded-3xl px-4 py-2.5 text-sm ${isMine ? 'rounded-br-md bg-ink text-white' : 'rounded-bl-md bg-canvas text-ink'}`}>
                  {m.text}
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSend} className="flex gap-2 border-t border-line p-3">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message..."
            className="input rounded-full"
          />
          <button type="submit" className="btn btn-lime">
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
