// RealtimeConnection.jsx
// Keeps the shared Socket.io connection open while someone is logged in
// (rendered once in App; logging out unmounts it and disconnects). On a new
// direct message it refreshes the inbox, tells an open conversation (the
// "arenax:dm" window event), and shows a toast unless that chat is on screen.
// Renders nothing.

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import socket from '../socket';
import { useAuth } from '../context/AuthContext';
import { refreshSharedResource } from '../hooks/useSharedResource';
import { toast } from '../utils/dialogs';

const RealtimeConnection = () => {
    const { user } = useAuth();
    const { pathname } = useLocation();

    useEffect(() => {
        socket.connect();
        return () => socket.disconnect();
    }, [user._id]);

    useEffect(() => {
        const onDm = (message) => {
            refreshSharedResource('/dm');
            window.dispatchEvent(new CustomEvent('arenax:dm', { detail: message }));
            const fromOther = String(message.from) !== String(user._id);
            if (fromOther && pathname !== `/messages/${message.from}`) {
                toast(`${message.fromUser?.name || 'Someone'}: ${message.text.length > 60 ? `${message.text.slice(0, 60)}…` : message.text}`, 'info');
            }
        };
        socket.on('dm', onDm);
        return () => socket.off('dm', onDm);
    }, [user._id, pathname]);

    return null;
};

export default RealtimeConnection;
