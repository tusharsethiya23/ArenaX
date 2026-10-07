// Chat.jsx
// Real-time chat for a specific confirmed booking, using Socket.io for
// instant message delivery. Falls back to REST (sendMessage API) to
// persist each message in the database.

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
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
    <div className="max-w-2xl mx-auto px-4 py-10 flex flex-col h-[80vh]">
      <div className="mb-4 border-l-4 border-signal pl-4">
        <h1 className="font-display text-2xl text-ink">CHAT</h1>
      </div>

      <div className="flex-1 overflow-y-auto border border-ink/10 bg-white p-4 space-y-3">
        {messages.map((m, i) => {
          const isMine = m.sender?._id === user._id || m.sender === user._id;
          return (
            <div key={i} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] px-3 py-2 text-sm ${isMine ? 'bg-signal text-white' : 'bg-paper border border-ink/10 text-ink'}`}>
                {m.text}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex gap-2 mt-4">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 border border-ink/15 px-3 py-2.5 focus:outline-none focus:border-signal"
        />
        <button type="submit" className="bg-signal text-white px-5 font-semibold hover:bg-signal/90">
          Send
        </button>
      </form>
    </div>
  );
};

export default Chat;