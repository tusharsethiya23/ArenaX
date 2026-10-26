// MessagesButton.jsx
// Navbar chat button next to the notification bell (like Instagram's): opens
// the Messages inbox. The badge counts how many people have sent you messages
// you haven't read yet, not the number of messages. Tinted while you're in
// Messages.

import { NavLink } from 'react-router-dom';
import { Send } from 'lucide-react';
import useInbox from '../hooks/useInbox';

const MessagesButton = () => {
    const { unreadChats } = useInbox();
    const label = unreadChats
        ? `Messages (${unreadChats} ${unreadChats === 1 ? 'person' : 'people'} with unread messages)`
        : 'Messages';

    return (
        <NavLink
            to="/messages"
            aria-label={label}
            title="Messages"
            className={({ isActive }) =>
                `nav-glass relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors ${isActive ? 'text-brand' : 'text-ink hover:text-brand'}`
            }
        >
            <Send size={18} strokeWidth={1.8} className="-translate-x-px translate-y-px" />
            {unreadChats > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-like px-1 text-[11px] font-bold leading-none text-white ring-2 ring-smoke-side">
                    {unreadChats > 9 ? '9+' : unreadChats}
                </span>
            )}
        </NavLink>
    );
};

export default MessagesButton;
