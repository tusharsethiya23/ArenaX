// FollowListModal.jsx
// Popup listing someone's followers or the people they follow. Each row links
// to that person's profile. Uses the shared Modal (Escape, backdrop click, X).

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';
import Avatar from './Avatar';
import Modal from './Modal';

const FollowListModal = ({ userId, type, onClose }) => {
    const [people, setPeople] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        API.get(`/follows/${userId}/${type}`)
            .then((res) => setPeople(res.data))
            .catch((err) => setError(err.response?.data?.message || 'Could not load the list'));
    }, [userId, type]);

    return (
        <Modal title={type === 'followers' ? 'Followers' : 'Following'} onClose={onClose}>
            <div className="-mx-3">
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
                        onClick={onClose}
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
        </Modal>
    );
};

export default FollowListModal;
