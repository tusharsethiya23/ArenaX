// UserProfileView.jsx
// Someone's public profile (route: /profile-view/:userId).
//   Coaches: the CoachProfileCard (follow, slots and booking) on the left,
//            about + endorsements on the right
//   Others:  a header with follower counts and a Follow button,
//            then endorsements
// Follow, booking and endorsing are hidden on your own profile.

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Lock } from 'lucide-react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import FollowButton from '../components/FollowButton';
import MessageButton from '../components/MessageButton';
import FollowCounts from '../components/FollowCounts';
import CoachProfileCard from '../components/CoachProfileCard';
import Portfolio from '../components/portfolio/Portfolio';
import MatchCard from '../components/MatchCard';
import useFollow from '../hooks/useFollow';
import { toastError } from '../utils/dialogs';

const UserProfileView = () => {
    const { userId } = useParams();
    const { user: currentUser } = useAuth();
    const follow = useFollow(userId);
    const isOwnProfile = currentUser._id === userId;

    const [endorsements, setEndorsements] = useState([]);
    const [profileUser, setProfileUser] = useState(null);
    const [skill, setSkill] = useState('');
    const [note, setNote] = useState('');

    const fetchEndorsements = useCallback(
        () => API.get(`/endorsements/${userId}`).then((res) => setEndorsements(res.data)),
        [userId]
    );
    // Also used after booking, to refresh which slots are taken
    const fetchProfileUser = useCallback(
        () => API.get(`/users/${userId}`).then((res) => setProfileUser(res.data)),
        [userId]
    );

    useEffect(() => {
        fetchEndorsements().catch(console.error);
        fetchProfileUser().catch(console.error);
    }, [fetchEndorsements, fetchProfileUser]);

    const handleEndorse = async (e) => {
        e.preventDefault();
        try {
            await API.post('/endorsements', { endorsedUserId: userId, skill, note });
            setSkill('');
            setNote('');
            fetchEndorsements();
        } catch (err) {
            toastError(err);
        }
    };

    // Shortcut to the user's own plan page (subscriptions are per-user plans)
    // Private accounts: a lock badge, explaining why their posts may be hidden
    const privateBadge = profileUser?.isPrivate && (
        <span className="badge gap-1 bg-canvas text-muted" title="Only approved followers see their posts">
            <Lock size={12} /> Private
        </span>
    );

    const endorsementsSection = (
        <section>
            <h2 className="section-title mb-4">Endorsements</h2>
            {endorsements.length === 0 ? (
                <p className="empty-state">No endorsements yet.</p>
            ) : (
                <div className="space-y-3">
                    {endorsements.map((e) => (
                        <div key={e._id} className="rounded-[28px] bg-surface p-5">
                            <span className="badge bg-white text-on-ink">{e.skill}</span>
                            {e.note && <p className="mt-3 break-words text-sm leading-6">{e.note}</p>}
                            <p className="mt-3 text-sm text-muted">
                                {e.endorser?.name}{e.endorser?.sport ? ` · ${e.endorser.sport}` : ''}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );

    const endorseForm = !isOwnProfile && (
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
    );

    if (!profileUser) return <div className="page"><p className="empty-state">Loading profile...</p></div>;

    // ===================== COACH PROFILE =====================
    if (profileUser.role === 'coach') {
        return (
            <div className="page grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-[minmax(0,480px)_minmax(0,1fr)] lg:items-start">
                <div className="lg:sticky lg:top-24">
                    <CoachProfileCard
                        key={profileUser._id}
                        coach={profileUser}
                        follow={follow}
                        isOwn={isOwnProfile}
                        canBook={currentUser.role === 'learner' && !isOwnProfile}
                        onBooked={() => fetchProfileUser().catch(console.error)}
                    />
                </div>

                <div className="min-w-0 space-y-6">
                    {currentUser.role === 'learner' && !isOwnProfile && <MatchCard key={profileUser._id} coachId={profileUser._id} />}
                    <section className="card">
                        <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight">About {privateBadge}</h2>
                        <p className="mt-3 text-sm leading-6 text-ink/80">{profileUser.bio || 'No bio yet.'}</p>
                        <FollowCounts userId={userId} followers={follow.followers} following={follow.following} className="mt-4" />
                    </section>
                    <Portfolio key={userId} userId={userId} isOwn={isOwnProfile} role={profileUser.role} />
                    {endorsementsSection}
                    {endorseForm}
                </div>
            </div>
        );
    }

    // ===================== OTHER PROFILES =====================
    return (
        <div className="page max-w-4xl space-y-6">
            <section className="card flex flex-col gap-5 sm:flex-row sm:items-center">
                <Avatar name={profileUser.name} photo={profileUser.profilePhoto} className="h-20 w-20 text-2xl" />

                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <h1 className="break-words text-3xl font-extrabold tracking-tight">{profileUser.name}</h1>
                        {profileUser.role && <span className="badge bg-canvas capitalize text-ink">{profileUser.role}</span>}
                        {privateBadge}
                    </div>
                    <p className="mt-1 text-sm text-muted">
                        {[profileUser.sport, profileUser.location].filter(Boolean).join(' · ')}
                    </p>
                    {profileUser.bio && <p className="mt-2 text-sm text-ink/80">{profileUser.bio}</p>}
                    <FollowCounts userId={userId} followers={follow.followers} following={follow.following} className="mt-3" />
                </div>

                {!isOwnProfile && follow.loaded && (
                    <div className="flex shrink-0 flex-wrap gap-2">
                        {follow.isFollowing && <MessageButton userId={userId} name={profileUser.name} />}
                        <FollowButton isFollowing={follow.isFollowing} requested={follow.requested} onClick={follow.toggle} disabled={follow.busy} />
                    </div>
                )}
            </section>

            {profileUser.role !== 'admin' && <Portfolio key={userId} userId={userId} isOwn={isOwnProfile} role={profileUser.role} />}

            <div className={`grid grid-cols-1 gap-6 ${!isOwnProfile ? 'md:grid-cols-[minmax(0,1fr)_320px]' : ''}`}>
                {endorsementsSection}
                {endorseForm}
            </div>
        </div>
    );
};

export default UserProfileView;
