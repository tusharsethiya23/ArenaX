// Profile.jsx
// The logged-in user's own profile (route: /profile).
// Tabs (driven by ?tab= so the avatar menu can link straight to one):
//   - Profile: photo (pick an image, adjust it in PhotoCropper, then upload) + current details
//   - Stats (coaches only, /profile?tab=stats): performance stats, replaces /analytics
// Editing details and deleting the account live on /settings.

import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Camera, ArrowUpRight } from 'lucide-react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import StatsPanel from '../components/StatsPanel';
import Portfolio from '../components/portfolio/Portfolio';
import FollowCounts from '../components/FollowCounts';
import useFollow from '../hooks/useFollow';
import PhotoCropper from '../components/PhotoCropper';
import { toast, toastError } from '../utils/dialogs';

const Profile = () => {
    const { user, login } = useAuth();
    const [photoFile, setPhotoFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();
    const follow = useFollow(user._id);

    const tabs = [
        { id: 'profile', label: 'Profile' },
        user.role !== 'admin' && { id: 'portfolio', label: 'Portfolio' },
        user.role === 'coach' && { id: 'stats', label: 'Stats' },
    ].filter(Boolean);
    // Unknown or not-allowed ?tab values fall back to the profile tab
    const activeTab = tabs.some((t) => t.id === searchParams.get('tab')) ? searchParams.get('tab') : 'profile';

    // A picked image opens the cropper (photoFile set); the input is cleared so
    // picking the same file again still works
    const pickPhoto = (e) => {
        const file = e.target.files[0];
        e.target.value = '';
        if (!file) return;
        if (!file.type.startsWith('image/')) return toast('Please choose an image file (JPG, PNG...).', 'error');
        if (file.size > 20 * 1024 * 1024) return toast('That image is over 20 MB. Please choose a smaller one.', 'error');
        setPhotoFile(file);
    };

    // Uploads the cropped photo from PhotoCropper
    const uploadPhoto = async (cropped) => {
        setUploading(true);
        const formDataObj = new FormData();
        formDataObj.append('photo', cropped);

        try {
            const res = await API.post('/users/profile/photo', formDataObj, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            login({ ...user, profilePhoto: res.data.profilePhoto, token: localStorage.getItem('token') });
            setPhotoFile(null);
            toast('Profile photo updated', 'success');
        } catch (err) {
            toastError(err, 'Upload failed');
        }
        setUploading(false);
    };

    // Rows shown in the details card, per role
    const details = [
        { label: 'Email', value: user.email },
        { label: 'Location', value: user.location },
        ...(user.role === 'coach'
            ? [
                { label: 'Sport', value: user.sport },
                { label: 'Price per session', value: user.pricePerSession ? `₹${user.pricePerSession}` : '' },
                { label: 'Skill level taught', value: user.skillLevelTaught },
            ]
            : user.role === 'learner'
                ? [
                    { label: 'Preferred sport', value: user.sport },
                    { label: 'Goals', value: user.goals },
                    { label: 'Skill level', value: user.skillLevel },
                ]
                : []),
    ];

    return (
        <div className="page max-w-4xl space-y-6">

            {/* ================= HEADER CARD ================= */}
            <section className="card flex flex-col gap-6 sm:flex-row sm:items-center">
                <Avatar name={user.name} photo={user.profilePhoto} className="h-24 w-24 text-3xl" />

                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-3xl font-extrabold tracking-tight">{user.name}</h1>
                        <span className="badge bg-white capitalize text-on-ink">{user.role}</span>
                    </div>
                    {user.bio && <p className="mt-2 text-sm text-ink/80">{user.bio}</p>}
                    <FollowCounts userId={user._id} followers={follow.followers} following={follow.following} className="mt-3" />

                    <div className="mt-4 flex flex-wrap gap-2">
                        <Link to={`/profile-view/${user._id}`} className="btn btn-soft">
                            Public profile <ArrowUpRight size={16} />
                        </Link>
                        <Link to="/settings" className="btn btn-soft">Edit details</Link>
                    </div>
                </div>
            </section>

            {/* Tabs (only shown when there's more than one) */}
            {tabs.length > 1 && (
                <div className="flex gap-2">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setSearchParams(tab.id === 'profile' ? {} : { tab: tab.id })}
                            className={`chip ${activeTab === tab.id ? 'chip-active' : ''}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            )}

            {activeTab === 'stats' ? (
                <StatsPanel />
            ) : activeTab === 'portfolio' ? (
                <Portfolio userId={user._id} isOwn role={user.role} />
            ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,1fr)_300px]">

                    {/* ================= DETAILS ================= */}
                    <section className="card">
                        <h2 className="mb-4 text-lg font-bold tracking-tight">Details</h2>
                        <dl className="divide-y divide-line">
                            {details.map((d) => (
                                <div key={d.label} className="flex justify-between gap-4 py-3 text-sm">
                                    <dt className="text-muted">{d.label}</dt>
                                    <dd className="min-w-0 break-words text-right font-medium">{d.value || '—'}</dd>
                                </div>
                            ))}
                        </dl>
                    </section>

                    {/* ================= PHOTO ================= */}
                    <section className="card h-fit">
                        <h2 className="mb-4 text-lg font-bold tracking-tight">Profile photo</h2>
                        <div className="flex flex-col items-center gap-3">
                            <Avatar name={user.name} photo={user.profilePhoto} className="h-28 w-28 text-4xl" />
                            <p className="text-center text-xs text-muted">You can drag and zoom to adjust it before saving.</p>
                        </div>
                        <label className="btn btn-soft mt-4 w-full cursor-pointer focus-within:ring-2 focus-within:ring-accent">
                            <Camera size={17} className="text-accent" />
                            {user.profilePhoto ? 'Change photo' : 'Choose a photo'}
                            <input type="file" accept="image/*" onChange={pickPhoto} className="sr-only" />
                        </label>
                    </section>
                </div>
            )}

            {/* Adjust the picked photo, then upload it */}
            {photoFile && (
                <PhotoCropper
                    file={photoFile}
                    saving={uploading}
                    onCancel={() => setPhotoFile(null)}
                    onSave={uploadPhoto}
                />
            )}
        </div>
    );
};

export default Profile;
