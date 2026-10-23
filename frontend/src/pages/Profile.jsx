// Profile.jsx
// The logged-in user's own profile (route: /profile).
// Tabs (driven by ?tab= so the avatar menu can link straight to one):
//   - Profile: photo upload + current details
//   - Stats (coaches only, /profile?tab=stats): performance stats, replaces /analytics
// Editing details and deleting the account live on /settings.

import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import StatsPanel from '../components/StatsPanel';

const Profile = () => {
    const { user, login } = useAuth();
    const [photoFile, setPhotoFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();

    const tabs = [
        { id: 'profile', label: 'Profile' },
        user.role === 'coach' && { id: 'stats', label: 'Stats' },
    ].filter(Boolean);
    // Unknown or not-allowed ?tab values fall back to the profile tab
    const activeTab = tabs.some((t) => t.id === searchParams.get('tab')) ? searchParams.get('tab') : 'profile';

    const handlePhotoUpload = async (e) => {
        e.preventDefault();
        if (!photoFile) return;

        setUploading(true);
        const formDataObj = new FormData();
        formDataObj.append('photo', photoFile);

        try {
            const res = await API.post('/users/profile/photo', formDataObj, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            login({ ...user, profilePhoto: res.data.profilePhoto, token: localStorage.getItem('token') });
            setPhotoFile(null);
        } catch (err) {
            alert(err.response?.data?.message || 'Upload failed');
        }
        setUploading(false);
    };

    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-[#05070D]">

            {/* Background glow */}
            <div className="pointer-events-none absolute left-1/2 top-10 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-red-600/10 blur-[120px] sm:top-20 sm:h-[500px] sm:w-[500px] sm:blur-[150px]" />

            {/* Background grid */}
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-[8%] top-0 h-full border-l border-white/[0.035] sm:left-[15%]" />
                <div className="absolute left-1/2 top-0 h-full border-l border-red-500/[0.04]" />
                <div className="absolute right-[8%] top-0 h-full border-l border-white/[0.035] sm:right-[15%]" />

                <div className="absolute left-0 top-[25%] w-full border-t border-white/[0.025]" />
                <div className="absolute left-0 top-[75%] w-full border-t border-white/[0.025]" />
            </div>

            <div className="relative mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">

                {/* Heading */}
                <div className="mb-6 border-l-4 border-[#E21B23] pl-4 sm:mb-8 sm:pl-5">

                    <p className="mb-2 text-[8px] font-bold uppercase tracking-[0.3em] text-[#FF2A2A] sm:text-[9px] sm:tracking-[0.4em]">
                        ARENAX / PROFILE
                    </p>

                    <h1 className="text-3xl font-black uppercase tracking-tight text-white sm:text-4xl">
                        MY PROFILE
                    </h1>

                </div>

                {/* Tabs (only shown when there's more than one) */}
                {tabs.length > 1 && (
                    <div className="mb-6 flex gap-6 border-b border-white/10 sm:mb-8">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setSearchParams(tab.id === 'profile' ? {} : { tab: tab.id })}
                                className={`relative pb-3 text-sm uppercase tracking-wider transition-colors ${
                                    activeTab === tab.id ? 'text-white' : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                {tab.label}
                                {activeTab === tab.id && <span className="absolute inset-x-0 -bottom-px h-0.5 bg-[#E11D1D]" />}
                            </button>
                        ))}
                    </div>
                )}

                {activeTab === 'stats' ? (
                    <StatsPanel />
                ) : (
                    <>
                        {/* Profile photo section */}
                        <div className="relative mb-5 flex flex-col gap-4 overflow-hidden rounded-xl border border-white/10 bg-[#071426] p-4 shadow-[0_10px_35px_rgba(0,0,0,0.3)] sm:mb-6 sm:flex-row sm:items-center sm:gap-5 sm:p-5">

                            {/* Red accent */}
                            <div className="absolute left-0 top-0 h-full w-1 bg-[#E21B23]" />

                            {/* Profile photo */}
                            <img
                                src={
                                    user.profilePhoto ||
                                    "https://via.placeholder.com/80x80?text=No+Photo"
                                }
                                alt="Profile"
                                className="h-20 w-20 shrink-0 rounded-xl border border-white/10 object-cover"
                            />

                            <div className="min-w-0 flex-1">

                                {/* Label */}
                                <p className="mb-2 text-[8px] font-bold uppercase tracking-[0.25em] text-[#8B95A5] sm:text-[9px] sm:tracking-[0.3em]">
                                    Profile Photo
                                </p>

                                {/* File input */}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setPhotoFile(e.target.files[0])}
                                    className="mb-3 block w-full min-w-0 text-[10px] text-white/50 file:mr-2 file:border-0 file:bg-[#05070D] file:px-3 file:py-2 file:text-[9px] file:font-bold file:uppercase file:tracking-[0.1em] file:text-white/70 file:transition-colors hover:file:bg-[#E21B23] hover:file:text-white sm:text-xs sm:file:mr-3 sm:file:text-[10px] sm:file:tracking-[0.12em]"
                                />

                                {/* Upload button */}
                                <button
                                    onClick={handlePhotoUpload}
                                    disabled={!photoFile || uploading}
                                    className="w-full rounded-lg border border-[#E21B23] bg-[#E21B23] px-4 py-2 text-[9px] font-black uppercase tracking-[0.12em] text-white transition-all duration-300 hover:bg-[#FF2A2A] hover:shadow-[0_0_20px_rgba(226,27,35,0.25)] disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:text-[10px] sm:tracking-[0.15em]"
                                >
                                    {uploading ? "Uploading..." : "Upload Photo"}
                                </button>

                            </div>

                        </div>

                        {/* Current profile summary */}
                        <div className="mb-6 rounded-xl border border-white/10 bg-[#071426]/70 p-4 backdrop-blur-md sm:mb-8 sm:p-6">

                            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4 sm:mb-5">

                                <h3 className="text-base font-black uppercase tracking-wide text-white sm:text-lg">
                                    Current Details
                                </h3>

                                <span className="shrink-0 border border-red-500/40 px-3 py-1 text-[8px] font-bold uppercase tracking-[0.15em] text-[#FF2A2A] sm:text-[9px] sm:tracking-[0.2em]">
                                    {user.role}
                                </span>

                            </div>

                            <div className="space-y-3 text-xs leading-5 sm:text-sm">

                                <p className="break-words">
                                    <span className="text-[#8B95A5]">Name: </span>
                                    <span className="text-white">{user.name}</span>
                                </p>

                                <p className="break-words">
                                    <span className="text-[#8B95A5]">Email: </span>
                                    <span className="text-white">{user.email}</span>
                                </p>

                                <p className="break-words">
                                    <span className="text-[#8B95A5]">Bio: </span>
                                    <span className="text-white">{user.bio || "—"}</span>
                                </p>

                                <p className="break-words">
                                    <span className="text-[#8B95A5]">Location: </span>
                                    <span className="text-white">{user.location || "—"}</span>
                                </p>

                                {user.role === "coach" && (
                                    <>
                                        <p className="break-words">
                                            <span className="text-[#8B95A5]">Sport: </span>
                                            <span className="text-white">
                                                {user.sport || "—"}
                                            </span>
                                        </p>

                                        <p className="break-words">
                                            <span className="text-[#8B95A5]">Price/session: </span>
                                            <span className="text-white">
                                                {user.pricePerSession
                                                    ? `₹${user.pricePerSession}`
                                                    : "—"}
                                            </span>
                                        </p>

                                        <p className="break-words">
                                            <span className="text-[#8B95A5]">Skill level taught: </span>
                                            <span className="text-white">
                                                {user.skillLevelTaught || "—"}
                                            </span>
                                        </p>
                                    </>
                                )}

                                {user.role === "learner" && (
                                    <>
                                        <p className="break-words">
                                            <span className="text-[#8B95A5]">Preferred sport: </span>
                                            <span className="text-white">
                                                {user.sport || "—"}
                                            </span>
                                        </p>

                                        <p className="break-words">
                                            <span className="text-[#8B95A5]">Goals: </span>
                                            <span className="text-white">
                                                {user.goals || "—"}
                                            </span>
                                        </p>

                                        <p className="break-words">
                                            <span className="text-[#8B95A5]">Skill level: </span>
                                            <span className="text-white">
                                                {user.skillLevel || "—"}
                                            </span>
                                        </p>
                                    </>
                                )}

                            </div>

                            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 sm:mt-6">
                                {/* Public profile */}
                                <Link
                                    to={`/profile-view/${user._id}`}
                                    className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#FF2A2A] transition-colors hover:text-white sm:text-xs sm:tracking-[0.12em]"
                                >
                                    View my public profile
                                    <span className="ml-2">→</span>
                                </Link>

                                {/* Editing moved to Settings */}
                                <Link
                                    to="/settings"
                                    className="text-[10px] font-bold uppercase tracking-[0.1em] text-white/60 transition-colors hover:text-white sm:text-xs sm:tracking-[0.12em]"
                                >
                                    Edit details
                                    <span className="ml-2">→</span>
                                </Link>
                            </div>

                        </div>
                    </>
                )}

                {/* Footer detail */}
                <div className="mt-6 flex flex-col gap-2 border-t border-white/10 pt-4 text-[7px] uppercase tracking-[0.25em] text-white/20 sm:mt-8 sm:flex-row sm:items-center sm:justify-between sm:text-[8px] sm:tracking-[0.3em]">
                    <span>ARENAX</span>
                    <span>PROFILE / 01</span>
                </div>

            </div>
        </div>
    );
};

export default Profile;
