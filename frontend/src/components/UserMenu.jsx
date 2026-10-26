// UserMenu.jsx
// Avatar button in the top bar (phones and tablets; desktop has the user card
// in the sidebar) that opens the account dropdown (AccountMenu). Closes on
// outside click, Escape, or after choosing an item.

import { useState, useRef, useCallback } from 'react';
import { ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import useDismiss from '../hooks/useDismiss';
import Avatar from './Avatar';
import AccountMenu from './AccountMenu';

const UserMenu = () => {
    const { user } = useAuth();
    const [open, setOpen] = useState(false);
    const wrapperRef = useRef(null);

    const close = useCallback(() => setOpen(false), []);
    useDismiss(wrapperRef, open, close);

    return (
        <div ref={wrapperRef} className="relative">
            <button
                onClick={() => setOpen(!open)}
                aria-label="Account menu"
                aria-haspopup="menu"
                aria-expanded={open}
                className="nav-glass flex items-center gap-1.5 rounded-full py-1 pl-1 pr-2"
            >
                <Avatar name={user.name} photo={user.profilePhoto} className="h-9 w-9 text-xs" />
                <ChevronDown size={16} className={`text-ink transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && <AccountMenu onClose={close} className="absolute right-0 top-full mt-3" />}
        </div>
    );
};

export default UserMenu;
