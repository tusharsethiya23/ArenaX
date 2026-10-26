// MessageButton.jsx
// Opens the direct-message conversation with a user. `compact` is a round
// icon-only button for tight spots (cards, post headers); otherwise a pill
// with the word "Message".

import { Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { canAccess } from '../utils/access';

const MessageButton = ({ userId, name, compact = false, className = '' }) => {
    const { user } = useAuth();
    if (!canAccess(user, 'directMessages')) return null;
    return (
        <Link
            to={`/messages/${userId}`}
            aria-label={`Message ${name}`}
            title={`Message ${name}`}
            className={compact
                ? `flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-canvas text-data-blue transition-colors hover:bg-data-blue/15 sm:h-10 sm:w-10 ${className}`
                : `btn btn-soft ${className}`}
        >
            <MessageCircle size={compact ? 17 : 16} className="text-data-blue" />
            {!compact && 'Message'}
        </Link>
    );
};

export default MessageButton;
