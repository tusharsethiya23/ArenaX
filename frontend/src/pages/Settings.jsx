// Settings.jsx
// Account settings (route: /settings, from the avatar menu). Holds what used
// to be the bottom half of the Profile page: editing profile details and
// permanently deleting the account.

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

const labelClass = 'mb-2 block text-[8px] font-bold uppercase tracking-[0.25em] text-[#8B95A5] sm:text-[9px] sm:tracking-[0.3em]';
const inputClass = 'w-full min-w-0 rounded-lg border border-white/10 bg-[#05070D] px-3 py-3 text-xs text-white outline-none transition-all duration-300 focus:border-[#E21B23] focus:shadow-[0_0_20px_rgba(226,27,35,0.1)] sm:px-4 sm:text-sm';

const Settings = () => {
    const { user, login, logout } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        bio: user.bio || '',
        location: user.location || '',
        sport: user.sport || '',
        pricePerSession: user.pricePerSession || '',
    });
    const [message, setMessage] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await API.put('/users/profile', formData);
            login({ ...user, ...res.data, token: localStorage.getItem('token') });
            setMessage('Profile updated!');
        } catch (err) {
            setMessage(err.response?.data?.message || 'Something went wrong');
        }
    };

    // Handles permanent account deletion after user confirmation
    const handleDeleteAccount = async () => {
        const confirmed = window.confirm(
            'Are you sure you want to delete your account? This cannot be undone.'
        );
        if (!confirmed) return;

        try {
            await API.delete('/users/profile');
            logout(); // clear local auth state
            navigate('/register'); // send them back to the landing/register page
        } catch (err) {
            alert(err.response?.data?.message || 'Something went wrong');
        }
    };

    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-[#05070D]">

            {/* Background glow */}
            <div className="pointer-events-none absolute left-1/2 top-10 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-red-600/10 blur-[120px] sm:top-20 sm:h-[500px] sm:w-[500px] sm:blur-[150px]" />

            <div className="relative mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">

                {/* Heading */}
                <div className="mb-6 border-l-4 border-[#E21B23] pl-4 sm:mb-8 sm:pl-5">
                    <p className="mb-2 text-[8px] font-bold uppercase tracking-[0.3em] text-[#FF2A2A] sm:text-[9px] sm:tracking-[0.4em]">
                        ARENAX / SETTINGS
                    </p>
                    <h1 className="text-3xl font-black uppercase tracking-tight text-white sm:text-4xl">
                        SETTINGS
                    </h1>
                </div>

                {/* Message */}
                {message && (
                    <div className="mb-5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs leading-5 text-red-400 sm:mb-6 sm:px-5 sm:text-sm">
                        {message}
                    </div>
                )}

                {/* ================= EDIT DETAILS ================= */}
                <form
                    onSubmit={handleSubmit}
                    className="rounded-xl border border-white/10 bg-[#071426]/70 p-4 backdrop-blur-md sm:p-6"
                >
                    <h2 className="mb-5 text-base font-black uppercase tracking-wide text-white sm:text-lg">
                        Edit Details
                    </h2>

                    <div className="space-y-4 sm:space-y-5">
                        <div>
                            <label className={labelClass}>Bio</label>
                            <textarea
                                name="bio"
                                value={formData.bio}
                                onChange={handleChange}
                                rows={3}
                                className={`${inputClass} resize-none leading-5 sm:leading-6`}
                            />
                        </div>

                        <div>
                            <label className={labelClass}>Location</label>
                            <input type="text" name="location" value={formData.location} onChange={handleChange} className={inputClass} />
                        </div>

                        {/* Coaches set the sport they teach; learners set their preferred sport */}
                        {(user.role === 'coach' || user.role === 'learner') && (
                            <div>
                                <label className={labelClass}>{user.role === 'coach' ? 'Sport' : 'Preferred Sport'}</label>
                                <input
                                    type="text"
                                    name="sport"
                                    value={formData.sport}
                                    onChange={handleChange}
                                    placeholder="e.g. Cricket"
                                    className={`${inputClass} placeholder:text-white/20`}
                                />
                            </div>
                        )}

                        {user.role === 'coach' && (
                            <div>
                                <label className={labelClass}>Price Per Session (₹)</label>
                                <input type="number" name="pricePerSession" value={formData.pricePerSession} onChange={handleChange} className={inputClass} />
                            </div>
                        )}

                        <button
                            type="submit"
                            className="mt-1 w-full rounded-lg bg-[#E21B23] py-3 text-[10px] font-black uppercase tracking-[0.18em] text-white transition-all duration-300 hover:bg-[#FF2A2A] hover:shadow-[0_0_30px_rgba(226,27,35,0.25)] active:scale-[0.98] sm:mt-2 sm:py-3.5 sm:text-xs sm:tracking-[0.2em]"
                        >
                            Save Changes
                        </button>
                    </div>
                </form>

                {/* ================= DANGER ZONE ================= */}
                <div className="mt-8 rounded-xl border border-red-500/30 bg-red-500/[0.04] p-4 sm:p-6">
                    <h2 className="mb-2 text-sm font-black uppercase tracking-wide text-[#FF2A2A]">Danger Zone</h2>
                    <p className="mb-4 text-xs text-white/50 sm:text-sm">
                        Deleting your account is permanent and cannot be undone.
                    </p>
                    <button
                        onClick={handleDeleteAccount}
                        className="rounded-lg border border-[#E21B23] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#FF2A2A] transition-colors hover:bg-[#E21B23] hover:text-white"
                    >
                        Delete my account
                    </button>
                </div>

            </div>
        </div>
    );
};

export default Settings;
