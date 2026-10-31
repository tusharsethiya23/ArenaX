// DealChat.jsx
// Chat between a brand and a coach/athlete on an accepted deal
// (/deals/:dealId/chat). Works for both kinds of login: the brand (brand
// token) and the talent (user token). History loads over REST; new messages
// arrive live through the deal's private Socket.io room ("deal:<id>"), which
// the server only lets the two of them join.

import { useState, useEffect, useRef } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useBrandAuth } from '../context/BrandAuthContext';
import Avatar from '../components/Avatar';
import socket from '../socket';
import { toastError } from '../utils/dialogs';

const DealChat = () => {
    const { dealId } = useParams();
    const { user } = useAuth();
    const { brand } = useBrandAuth();
    const isBrand = !user && !!brand;

    const [deal, setDeal] = useState(null);
    const [messages, setMessages] = useState([]);
    const [error, setError] = useState('');
    const [text, setText] = useState('');
    const [sending, setSending] = useState(false);
    const bottomRef = useRef(null);

    useEffect(() => {
        if (!user && !brand) return;
        API.get(`/deals/${dealId}/messages`)
            .then((res) => { setDeal(res.data.deal); setMessages(res.data.messages); })
            .catch((err) => setError(err.response?.data?.message || 'Could not open this chat'));

        // Players are already connected (RealtimeConnection); a brand connects here
        const connectedHere = !socket.connected && !user;
        if (connectedHere) socket.connect();
        // Join the deal's room now and after any reconnect (rooms are lost on reconnect)
        const join = () => socket.emit('joinDealRoom', dealId);
        if (socket.connected) join();
        socket.on('connect', join);

        // The sender gets its own message back too: skip ones already shown
        const onMessage = (message) => {
            if (String(message.deal) !== String(dealId)) return;
            setMessages((prev) => (prev.some((m) => m._id === message._id) ? prev : [...prev, message]));
        };
        socket.on('dealMessage', onMessage);

        return () => {
            socket.off('connect', join);
            socket.off('dealMessage', onMessage);
            if (connectedHere) socket.disconnect();
        };
    }, [dealId, user, brand]);

    // Keep the newest message in view
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    if (!user && !brand) return <Navigate to="/login" />;

    const handleSend = async (e) => {
        e.preventDefault();
        if (!text.trim() || sending) return;
        setSending(true);
        try {
            const res = await API.post(`/deals/${dealId}/messages`, { text });
            setMessages((prev) => (prev.some((m) => m._id === res.data._id) ? prev : [...prev, res.data]));
            setText('');
        } catch (err) {
            toastError(err);
        } finally {
            setSending(false);
        }
    };

    const backTo = isBrand ? '/brand/dashboard' : '/deals';
    // The other side's name and details for the header
    const other = isBrand
        ? { name: deal?.talent?.name, photo: deal?.talent?.profilePhoto, detail: [deal?.talent?.role === 'learner' ? 'Athlete' : 'Coach', deal?.talent?.sport].filter(Boolean).join(' · ') }
        : { name: deal?.brand?.companyName, detail: deal?.brand?.industry };

    return (
        <div className="mx-auto flex h-[calc(100dvh-80px-4rem)] w-full max-w-3xl flex-col px-4 pb-4 pt-4 sm:px-6 md:h-[calc(100dvh-80px)] md:pb-28">
            <div className="mb-4 flex items-center gap-3">
                <Link to={backTo} aria-label="Back" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface">
                    <ArrowLeft size={18} />
                </Link>
                {deal && <Avatar name={other.name || '?'} photo={other.photo} pastel className="h-10 w-10 text-sm" />}
                <div className="min-w-0">
                    <h1 className="truncate text-xl font-extrabold tracking-tight">{deal ? other.name || 'Deleted account' : 'Chat'}</h1>
                    {other.detail && <p className="truncate text-sm text-muted">{other.detail}</p>}
                </div>
            </div>

            {error ? (
                <p className="empty-state">{error}</p>
            ) : (
                <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-surface">
                    {/* The accepted offer this chat is about */}
                    {deal && (
                        <div className="border-b border-line px-4 py-3 text-sm sm:px-5">
                            <span className="badge mr-2 bg-ok/15 text-ok">Accepted offer</span>
                            <span className="text-ink/80">{deal.message}</span>
                        </div>
                    )}

                    <div className="flex-1 space-y-3 overflow-y-auto p-4 sm:p-5">
                        {deal && messages.length === 0 && (
                            <p className="py-10 text-center text-sm text-muted">No messages yet. Agree the details of the deal here.</p>
                        )}
                        {messages.map((m) => {
                            const isMine = m.fromBrand === isBrand;
                            return (
                                <div key={m._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[75%] whitespace-pre-wrap break-words rounded-3xl px-4 py-2.5 text-sm ${isMine ? 'rounded-br-md bg-ink text-on-ink' : 'rounded-bl-md bg-canvas text-ink'}`}>
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
                            aria-label="Message"
                            maxLength={2000}
                            className="input rounded-full"
                        />
                        <button type="submit" disabled={!deal || sending} className="btn btn-lime">
                            Send
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default DealChat;
