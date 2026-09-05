import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

const UserProfileView = () => {
    const { userId } = useParams();
    const { user: currentUser } = useAuth();

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
        <div className="relative min-h-screen w-full overflow-hidden bg-[#05070D] text-white">

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

            <div className="relative mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 sm:py-10">

                {/* Profile Header */}
                {profileUser && (
                    <div className="mb-6 flex min-w-0 items-center gap-3 border-l-4 border-[#E21B23] pl-4 sm:gap-4">

                        <img
                            src={
                                profileUser.profilePhoto ||
                                "https://placehold.co/72x72?text=?"
                            }
                            alt={profileUser.name}
                            className="h-[60px] w-[60px] shrink-0 rounded-xl border border-white/10 object-cover sm:h-[72px] sm:w-[72px]"
                        />

                        <div className="min-w-0">
                            <h1 className="break-words text-xl font-black uppercase tracking-tight text-white sm:text-2xl">
                                {profileUser.name}
                            </h1>

                            <p className="mt-1 break-words text-[10px] uppercase tracking-[0.12em] text-[#FF2A2A] sm:text-sm">
                                {profileUser.sport} · {profileUser.location}
                            </p>
                        </div>

                    </div>
                )}

                {/* Heading */}
                <div className="mb-7 border-l-4 border-[#E21B23] pl-4 sm:mb-8">

                    <p className="mb-2 text-[8px] font-bold uppercase tracking-[0.3em] text-[#FF2A2A] sm:text-[9px] sm:tracking-[0.4em]">
                        ARENAX / COMMUNITY
                    </p>

                    <h1 className="text-3xl font-black uppercase tracking-tight text-white sm:text-4xl">
                        ENDORSEMENTS
                    </h1>

                </div>

                {/* Endorse Form */}
                {currentUser._id !== userId && (
                    <form
                        onSubmit={handleEndorse}
                        className="mb-7 space-y-3 rounded-xl border border-white/10 bg-[#071426]/70 p-4 backdrop-blur-md sm:mb-8 sm:p-5"
                    >

                        <h3 className="text-base font-black uppercase tracking-wide text-white sm:text-lg">
                            Give an endorsement
                        </h3>

                        <input
                            placeholder="Skill (e.g. Fast bowling)"
                            value={skill}
                            onChange={(e) => setSkill(e.target.value)}
                            required
                            className="w-full min-w-0 rounded-lg border border-white/10 bg-[#05070D] px-3 py-3 text-xs text-white outline-none transition-all focus:border-[#E21B23] sm:px-4 sm:text-sm"
                        />

                        <textarea
                            placeholder="Note (optional)"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            rows={3}
                            className="w-full min-w-0 resize-none rounded-lg border border-white/10 bg-[#05070D] px-3 py-3 text-xs leading-5 text-white outline-none transition-all focus:border-[#E21B23] sm:px-4 sm:text-sm"
                        />

                        <button
                            type="submit"
                            className="w-full rounded-lg bg-[#E21B23] px-5 py-3 text-[10px] font-black uppercase tracking-[0.15em] text-white transition-all duration-300 hover:bg-[#FF2A2A] hover:shadow-[0_0_25px_rgba(226,27,35,0.25)] active:scale-[0.97] sm:w-auto sm:text-xs"
                        >
                            Endorse
                        </button>

                    </form>
                )}

                {/* Endorsements */}
                <div className="space-y-3">

                    {endorsements.length === 0 ? (

                        <div className="rounded-xl border border-white/10 bg-[#071426]/50 px-4 py-10 text-center sm:px-6">
                            <p className="text-xs text-[#8B95A5] sm:text-sm">
                                No endorsements yet.
                            </p>
                        </div>

                    ) : (

                        endorsements.map((e) => (

                            <div
                                key={e._id}
                                className="relative overflow-hidden rounded-xl border border-white/10 bg-[#071426]/70 p-4 transition-all duration-300 hover:border-[#E21B23]/40 sm:p-5"
                            >

                                {/* Red accent */}
                                <div className="absolute left-0 top-0 h-full w-1 bg-[#E21B23]" />

                                <p className="break-words text-sm font-bold uppercase tracking-wide text-white sm:text-base">
                                    {e.skill}
                                </p>

                                {e.note && (
                                    <p className="mt-1 break-words text-xs leading-5 text-white/60 sm:text-sm">
                                        {e.note}
                                    </p>
                                )}

                                <p className="mt-2 break-words text-[9px] uppercase tracking-[0.12em] text-[#8B95A5] sm:text-xs">
                                    — {e.endorser?.name} ({e.endorser?.sport})
                                </p>

                            </div>

                        ))

                    )}

                </div>

            </div>
        </div>
    );
};

export default UserProfileView;