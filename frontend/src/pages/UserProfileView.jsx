// UserProfileView.jsx
// Someone's public profile (route: /profile-view/:userId): header with
// follower counts, Follow button and a Subscribe/Manage plan shortcut,
// endorsements received, and a form to endorse them (follow + endorse are
// hidden on your own profile).

import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import useSubscription from '../hooks/useSubscription';
import Avatar from '../components/Avatar';
import FollowButton from '../components/FollowButton';
import FollowCounts from '../components/FollowCounts';
import useFollow from '../hooks/useFollow';

const UserProfileView = () => {
    const { userId } = useParams();
    const { user: currentUser } = useAuth();
    const isPro = useSubscription();
    const follow = useFollow(userId);
    const isOwnProfile = currentUser._id === userId;

    const [endorsements, setEndorsements] = useState([]);
    const [profileUser, setProfileUser] = useState(null);
    const [skill, setSkill] = useState('');
    const [note, setNote] = useState('');

    const fetchEndorsements = async () => {
        const res = await API.get(`/endorsements/${userId}`);
        setEndorsements(res.data);
    };

    const fetchProfileUser = async () => {
        const res = await API.get(`/users/${userId}`);
        setProfileUser(res.data);
    };


    useEffect(() => {
        fetchEndorsements();
        fetchProfileUser()
    }, [userId]);

    const handleEndorse = async (e) => {
        e.preventDefault();
        try {
            await API.post('/endorsements', { endorsedUserId: userId, skill, note });
            setSkill('');
            setNote('');
            fetchEndorsements();
        } catch (err) {
            alert(err.response?.data?.message || 'Something went wrong');
        }
    };

    return (
        <div className="page max-w-4xl space-y-6">

            {/* ================= PROFILE HEADER ================= */}
            {profileUser && (
                <section className="card flex flex-col gap-5 sm:flex-row sm:items-center">
                    <Avatar name={profileUser.name} photo={profileUser.profilePhoto} className="h-20 w-20 text-2xl" />

                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="break-words text-3xl font-extrabold tracking-tight">{profileUser.name}</h1>
                            {profileUser.role && <span className="badge bg-canvas capitalize text-ink">{profileUser.role}</span>}
                        </div>
                        <p className="mt-1 text-sm text-muted">
                            {[profileUser.sport, profileUser.location].filter(Boolean).join(' · ')}
                        </p>
                        {profileUser.bio && <p className="mt-2 text-sm text-ink/80">{profileUser.bio}</p>}
                        <FollowCounts userId={userId} followers={follow.followers} following={follow.following} className="mt-3" />
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                        {/* Follow (not on your own profile) */}
                        {!isOwnProfile && follow.loaded && (
                            <FollowButton isFollowing={follow.isFollowing} onClick={follow.toggle} disabled={follow.busy} />
                        )}
                        {/* Shortcut to the user's own plan page (subscriptions are per-user plans) */}
                        <Link to="/subscription" className={`btn ${isPro ? 'btn-soft' : 'btn-lime'}`}>
                            {isPro ? 'Manage plan' : 'Subscribe'}
                        </Link>
                    </div>
                </section>
            )}

            <div className={`grid gap-6 ${currentUser._id !== userId ? 'md:grid-cols-[minmax(0,1fr)_320px]' : ''}`}>

                {/* ================= ENDORSEMENTS ================= */}
                <section>
                    <h2 className="section-title mb-4">Endorsements</h2>
                    {endorsements.length === 0 ? (
                        <p className="empty-state">No endorsements yet.</p>
                    ) : (
                        <div className="space-y-3">
                            {endorsements.map((e) => (
                                <div key={e._id} className="rounded-[28px] bg-surface p-5">
                                    <span className="badge bg-lime text-ink">{e.skill}</span>
                                    {e.note && <p className="mt-3 break-words text-sm leading-6">{e.note}</p>}
                                    <p className="mt-3 text-sm text-muted">
                                        {e.endorser?.name}{e.endorser?.sport ? ` · ${e.endorser.sport}` : ''}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* ================= ENDORSE FORM ================= */}
                {currentUser._id !== userId && (
                    <form onSubmit={handleEndorse} className="card h-fit space-y-3">
                        <h2 className="text-lg font-bold tracking-tight">Give an endorsement</h2>
                        <input
                            placeholder="Skill (e.g. Fast bowling)"
                            value={skill}
                            onChange={(e) => setSkill(e.target.value)}
                            required
                            className="input"
                        />
                        <textarea
                            placeholder="Note (optional)"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            rows={3}
                            className="input resize-none"
                        />
                        <button type="submit" className="btn btn-dark w-full">
                            Endorse
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default UserProfileView;
