// FollowListModal.jsx
// Popup listing someone's followers or the people they follow. Each row links
// to that person's profile. Closes on outside click, Escape, or the X.

import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import API from '../api/axios';
import useDismiss from '../hooks/useDismiss';
import Avatar from './Avatar';

const FollowListModal = ({ userId, type, onClose }) => {
    const [people, setPeople] = useState(null);
    const [error, setError] = useState('');
    const cardRef = useRef(null);

    const close = useCallback(() => onClose(), [onClose]);
    useDismiss(cardRef, true, close);

    useEffect(() => {
        API.get(`/follows/${userId}/${type}`)
            .then((res) => setPeople(res.data))
            .catch((err) => setError(err.response?.data?.message || 'Could not load the list'));
    }, [userId, type]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4 backdrop-blur-sm">
            <div ref={cardRef} role="dialog" aria-label={type === 'followers' ? 'Followers' : 'Following'} className="flex max-h-[70vh] w-full max-w-sm flex-col overflow-hidden rounded-[28px] bg-surface">
                <div className="flex items-center justify-between border-b border-line px-5 py-4">
                    <h2 className="text-lg font-bold capitalize">{type}</h2>
                    <button onClick={close} aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-canvas hover:text-ink">
                        <X size={18} />
                    </button>
                </div>

                <div className="overflow-y-auto p-2">
                    {error && <p className="alert-error m-3">{error}</p>}
                    {!error && people === null && <p className="py-8 text-center text-sm text-muted">Loading...</p>}
                    {people?.length === 0 && (
                        <p className="py-8 text-center text-sm text-muted">
                            {type === 'followers' ? 'No followers yet.' : 'Not following anyone yet.'}
                        </p>
                    )}
                    {people?.map(({ user }) => (
                        <Link
                            key={user._id}
                            to={`/profile-view/${user._id}`}
                            onClick={close}
                            className="flex items-center gap-3 rounded-2xl p-3 transition-colors hover:bg-canvas"
                        >
                            <Avatar name={user.name} photo={user.profilePhoto} />
                            <div className="min-w-0">
                                <p className="truncate font-semibold">{user.name}</p>
                                <p className="truncate text-sm capitalize text-muted">
                                    {[user.role, user.sport].filter(Boolean).join(' · ')}
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default FollowListModal;
