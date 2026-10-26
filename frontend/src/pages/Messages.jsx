// Messages.jsx
// Inbox (route: /messages): one row per person you've messaged with, newest
// first, showing the latest message and an unread count. Rows open the
// conversation (/messages/:userId). Start a new chat from the Message button
// on the profile or card of someone you follow.

import { Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import Avatar from '../components/Avatar';
import useInbox from '../hooks/useInbox';
import { timeAgo } from '../utils/format';

const Messages = () => {
    const { conversations, loaded } = useInbox();

    return (
        <div className="page max-w-2xl">
            <h1 className="text-3xl font-extrabold tracking-tight">Messages</h1>
            <p className="mt-1 text-sm text-muted">Chat with people you follow or who follow you.</p>

            <section className="card mt-6 p-2 sm:p-2">
                {!loaded ? (
                    <p className="empty-state">Loading messages...</p>
                ) : conversations.length === 0 ? (
                    <div className="flex flex-col items-center px-6 py-12 text-center">
                        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-data-blue/15 text-data-blue">
                            <MessageCircle size={24} />
                        </span>
                        <p className="mt-4 font-semibold">No messages yet</p>
                        <p className="mt-1 max-w-xs text-sm text-muted">
                            Open the profile of someone you follow and tap <b className="text-ink">Message</b> to start a chat.
                        </p>
                        <Link to="/discover" className="btn btn-dark mt-5">Find people</Link>
                    </div>
                ) : (
                    <ul>
                        {conversations.map(({ user, lastMessage, unread }) => (
                            <li key={user._id}>
                                <Link to={`/messages/${user._id}`} className="flex items-center gap-3 rounded-2xl p-3 transition-colors hover:bg-canvas">
                                    <Avatar name={user.name} photo={user.profilePhoto} pastel className="h-12 w-12 text-sm" />
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-baseline justify-between gap-3">
                                            <p className={`truncate ${unread ? 'font-bold' : 'font-semibold'}`}>{user.name}</p>
                                            <time className="shrink-0 text-xs text-muted" dateTime={lastMessage.createdAt}>{timeAgo(lastMessage.createdAt)}</time>
                                        </div>
                                        <div className="flex items-center justify-between gap-3">
                                            <p className={`truncate text-sm ${unread ? 'text-ink' : 'text-muted'}`}>
                                                {lastMessage.mine && <span className="text-muted">You: </span>}
                                                {lastMessage.text}
                                            </p>
                                            {unread > 0 && (
                                                <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-like px-1.5 text-[11px] font-bold text-white">
                                                    {unread > 99 ? '99+' : unread}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
};

export default Messages;
