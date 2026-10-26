// DirectChat.jsx
// One direct-message conversation (route: /messages/:userId). Loads the
// history (which marks their messages as read), shows new messages live
// (RealtimeConnection relays them as the "arenax:dm" window event), and sends
// with Enter or the send button. If neither of you follows the other, the
// history stays visible but the box explains why you can't send.
// Opened from "Contact seller" (?listing=<id>), it shows the item at the top
// and sends it with your messages, which is what allows the chat.

import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Send, Tag } from 'lucide-react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import { refreshSharedResource } from '../hooks/useSharedResource';
import { toastError } from '../utils/dialogs';

const dayLabel = (date) => {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
};
const timeLabel = (date) => new Date(date).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

const DirectChat = () => {
    const { userId } = useParams();
    const [searchParams] = useSearchParams();
    const listingId = searchParams.get('listing');
    const { user } = useAuth();
    const [chat, setChat] = useState(null); // { user, canMessage, messages }
    const [error, setError] = useState('');
    const [text, setText] = useState('');
    const [sending, setSending] = useState(false);
    const bottomRef = useRef(null);

    const load = useCallback(() => API.get(`/dm/${userId}${listingId ? `?listing=${listingId}` : ''}`)
        .then((res) => {
            setChat(res.data);
            refreshSharedResource('/dm'); // their messages are read now
        })
        .catch((err) => setError(err.response?.data?.message || 'Could not open this chat')), [userId, listingId]);

    useEffect(() => {
        load();
    }, [load]);

    // New messages in this conversation, from either side (including my other tabs)
    useEffect(() => {
        const onDm = ({ detail: m }) => {
            const inThisChat = [String(m.from), String(m.to)].includes(String(userId));
            if (!inThisChat) return;
            setChat((c) => (c && !c.messages.some((x) => x._id === m._id) ? { ...c, messages: [...c.messages, m] } : c));
            if (String(m.from) === String(userId)) API.get(`/dm/${userId}`).then(() => refreshSharedResource('/dm')).catch(() => {});
        };
        window.addEventListener('arenax:dm', onDm);
        return () => window.removeEventListener('arenax:dm', onDm);
    }, [userId]);

    // Keep the newest message in view
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ block: 'end' });
    }, [chat?.messages.length]);

    const send = async (e) => {
        e.preventDefault();
        const body = text.trim();
        if (!body || sending) return;
        setSending(true);
        try {
            const res = await API.post(`/dm/${userId}`, { text: body, ...(chat.listing && { listing: chat.listing._id }) });
            setChat((c) => (c.messages.some((x) => x._id === res.data._id) ? c : { ...c, messages: [...c.messages, res.data] }));
            setText('');
        } catch (err) {
            toastError(err);
        }
        setSending(false);
    };

    if (error) {
        return (
            <div className="page max-w-3xl">
                <p className="alert-error">{error}</p>
                <Link to="/messages" className="btn btn-soft mt-4">Back to messages</Link>
            </div>
        );
    }

    const other = chat?.user;

    return (
        <div className="mx-auto flex h-[calc(100dvh-80px-4rem)] w-full max-w-3xl flex-col px-4 pb-4 pt-4 sm:px-6 md:h-[calc(100dvh-80px)] md:pb-8">
            {/* ---------- Header ---------- */}
            <div className="mb-4 flex items-center gap-3">
                <Link to="/messages" aria-label="Back to messages" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface">
                    <ArrowLeft size={18} />
                </Link>
                {other ? (
                    <Link to={`/profile-view/${other._id}`} className="flex min-w-0 items-center gap-3 rounded-full pr-3 transition-colors hover:bg-canvas">
                        <Avatar name={other.name} photo={other.profilePhoto} pastel className="h-11 w-11 text-sm" />
                        <span className="min-w-0">
                            <span className="block truncate text-lg font-bold leading-tight">{other.name}</span>
                            <span className="block truncate text-xs capitalize text-muted">
                                {[other.role === 'learner' ? 'athlete' : other.role, other.sport].filter(Boolean).join(' · ')}
                            </span>
                        </span>
                    </Link>
                ) : (
                    <span className="h-11 w-40 animate-pulse rounded-full bg-canvas" />
                )}
            </div>

            {/* ---------- Messages ---------- */}
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[28px] bg-surface">
                {/* The marketplace item this chat is about ("Contact seller") */}
                {chat?.listing && (
                    <Link to="/marketplace" className="flex items-center gap-3 border-b border-line px-4 py-3 transition-colors hover:bg-canvas">
                        {chat.listing.photo && <img src={chat.listing.photo} alt="" className="h-11 w-11 shrink-0 rounded-xl object-cover" />}
                        <span className="min-w-0">
                            <span className="flex items-center gap-1.5 text-xs text-muted"><Tag size={12} className="text-data-mint" /> Asking about</span>
                            <span className="block truncate text-sm font-semibold">{chat.listing.title}</span>
                        </span>
                    </Link>
                )}
                <div className="flex-1 overflow-y-auto p-4 sm:p-5" aria-live="polite">
                    {!chat ? (
                        <p className="py-10 text-center text-sm text-muted">Loading chat...</p>
                    ) : chat.messages.length === 0 ? (
                        <p className="py-10 text-center text-sm text-muted">No messages yet. Say hello to {other.name.split(' ')[0]}!</p>
                    ) : (
                        <div className="space-y-1.5">
                            {chat.messages.map((m, i) => {
                                const mine = String(m.from) === String(user._id);
                                const prev = chat.messages[i - 1];
                                const newDay = !prev || new Date(prev.createdAt).toDateString() !== new Date(m.createdAt).toDateString();
                                return (
                                    <div key={m._id}>
                                        {newDay && (
                                            <p className="py-3 text-center text-xs font-semibold text-muted">{dayLabel(m.createdAt)}</p>
                                        )}
                                        <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[78%] rounded-3xl px-4 py-2 text-sm ${mine ? 'rounded-br-md bg-white text-on-ink' : 'rounded-bl-md bg-canvas text-ink'}`}>
                                                {m.listing && (
                                                    <p className={`mb-1 flex items-center gap-1 text-[11px] font-semibold ${mine ? 'text-on-ink/70' : 'text-data-mint'}`}>
                                                        <Tag size={11} /> {m.listing.title}
                                                    </p>
                                                )}
                                                <p className="whitespace-pre-wrap break-words">{m.text}</p>
                                                <p className={`mt-0.5 text-right text-[10px] ${mine ? 'text-on-ink/60' : 'text-muted'}`}>
                                                    {timeLabel(m.createdAt)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    <div ref={bottomRef} />
                </div>

                {/* ---------- Composer ---------- */}
                {chat && !chat.canMessage ? (
                    <p className="border-t border-line px-5 py-4 text-center text-sm text-muted">
                        You can message people you follow or who follow you. Follow {other.name.split(' ')[0]} to send a message.
                    </p>
                ) : (
                    <form onSubmit={send} className="flex items-end gap-2 border-t border-line p-3">
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) send(e); }}
                            placeholder="Write a message..."
                            aria-label="Message"
                            rows={1}
                            maxLength={2000}
                            disabled={!chat}
                            className="input max-h-32 min-h-[46px] resize-none rounded-3xl py-3"
                        />
                        <button type="submit" disabled={!text.trim() || sending || !chat} aria-label="Send" className="btn btn-dark h-[46px] w-[46px] shrink-0 p-0">
                            <Send size={18} />
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default DirectChat;
