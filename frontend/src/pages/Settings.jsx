// Settings.jsx
// Account settings (route: /settings, from the avatar menu): editing profile
// details and permanently deleting the account.

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';

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
    const [messageIsError, setMessageIsError] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await API.put('/users/profile', formData);
            login({ ...user, ...res.data, token: localStorage.getItem('token') });
            setMessage('Profile updated!');
            setMessageIsError(false);
        } catch (err) {
            setMessage(err.response?.data?.message || 'Something went wrong');
            setMessageIsError(true);
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
        <div className="page max-w-3xl">
            <PageHeader title="Settings" subtitle="Manage your profile and account" />

            {message && <div className={`mb-5 ${messageIsError ? 'alert-error' : 'alert-success'}`}>{message}</div>}

            {/* ================= EDIT DETAILS ================= */}
            <form onSubmit={handleSubmit} className="card space-y-4">
                <h2 className="text-lg font-bold tracking-tight">Edit details</h2>

                <div>
                    <label className="label">Bio</label>
                    <textarea name="bio" value={formData.bio} onChange={handleChange} rows={3} className="input resize-none" />
                </div>

                <div>
                    <label className="label">Location</label>
                    <input type="text" name="location" value={formData.location} onChange={handleChange} className="input" />
                </div>

                {/* Coaches set the sport they teach; learners set their preferred sport */}
                {(user.role === 'coach' || user.role === 'learner') && (
                    <div>
                        <label className="label">{user.role === 'coach' ? 'Sport' : 'Preferred sport'}</label>
                        <input type="text" name="sport" value={formData.sport} onChange={handleChange} placeholder="e.g. Cricket" className="input" />
                    </div>
                )}

                {user.role === 'coach' && (
                    <div>
                        <label className="label">Price per session (₹)</label>
                        <input type="number" name="pricePerSession" value={formData.pricePerSession} onChange={handleChange} className="input" />
                    </div>
                )}

                <button type="submit" className="btn btn-dark px-8">
                    Save changes
                </button>
            </form>

            {/* ================= DANGER ZONE ================= */}
            <section className="card mt-6">
                <h2 className="text-lg font-bold tracking-tight text-danger">Danger zone</h2>
                <p className="mb-4 mt-1 text-sm text-muted">
                    Deleting your account is permanent and cannot be undone.
                </p>
                <button onClick={handleDeleteAccount} className="btn btn-danger">
                    Delete my account
                </button>
            </section>
        </div>
    );
};

export default Settings;
