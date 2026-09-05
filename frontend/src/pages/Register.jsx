import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'learner',
    });
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const res = await API.post('/auth/register', formData);
            login(res.data);
            navigate('/discover');
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong');
        }
    };

    return (
        <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#05070D] px-4 py-8 sm:px-6 sm:py-12">

            <div className="pointer-events-none absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-600/10 blur-[100px] sm:h-[600px] sm:w-[600px] sm:blur-[160px]" />

            <div className="pointer-events-none absolute left-[8%] top-0 h-full border-l border-white/[0.04] sm:left-[15%]" />
            <div className="pointer-events-none absolute left-1/2 top-0 h-full border-l border-red-500/[0.05]" />
            <div className="pointer-events-none absolute right-[8%] top-0 h-full border-l border-white/[0.04] sm:right-[15%]" />

            <div className="relative w-full max-w-md">

                <div className="mb-7 border-l-4 border-[#E21B23] pl-4 sm:mb-10 sm:pl-5">

                    <p className="mb-2 text-[8px] font-bold uppercase tracking-[0.3em] text-[#FF2A2A] sm:mb-3 sm:text-[10px] sm:tracking-[0.4em]">
                        ARENAX / NEW USER
                    </p>

                    <h1 className="text-3xl font-black uppercase tracking-tight text-white sm:text-4xl md:text-5xl">
                        JOIN ARENAX
                    </h1>

                    <p className="mt-2 text-xs text-[#8B95A5] sm:mt-3 sm:text-sm">
                        Find your coach. Track your game.
                    </p>

                </div>

                {error && (
                    <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs leading-5 text-red-400 sm:mb-5 sm:px-5 sm:text-sm">
                        {error}
                    </div>
                )}

                <form
                    onSubmit={handleSubmit}
                    className="rounded-xl border border-white/10 bg-[#071426]/80 p-4 backdrop-blur-md sm:p-6 md:p-8"
                >

                    <div className="space-y-5 sm:space-y-7">

                        <div>
                            <label className="mb-2 block text-[8px] font-bold uppercase tracking-[0.25em] text-[#8B95A5] sm:mb-3 sm:text-[10px] sm:tracking-[0.3em]">
                                01 — Full Name
                            </label>

                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                className="w-full min-w-0 rounded-lg border border-white/10 bg-[#05070D] px-3 py-3 text-xs text-white outline-none transition-all focus:border-[#E21B23] sm:px-5 sm:py-4 sm:text-sm"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-[8px] font-bold uppercase tracking-[0.25em] text-[#8B95A5] sm:mb-3 sm:text-[10px] sm:tracking-[0.3em]">
                                02 — Email
                            </label>

                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className="w-full min-w-0 rounded-lg border border-white/10 bg-[#05070D] px-3 py-3 text-xs text-white outline-none transition-all focus:border-[#E21B23] sm:px-5 sm:py-4 sm:text-sm"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-[8px] font-bold uppercase tracking-[0.25em] text-[#8B95A5] sm:mb-3 sm:text-[10px] sm:tracking-[0.3em]">
                                03 — Password
                            </label>

                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                className="w-full min-w-0 rounded-lg border border-white/10 bg-[#05070D] px-3 py-3 text-xs text-white outline-none transition-all focus:border-[#E21B23] sm:px-5 sm:py-4 sm:text-sm"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-[8px] font-bold uppercase tracking-[0.25em] text-[#8B95A5] sm:mb-3 sm:text-[10px] sm:tracking-[0.3em]">
                                04 — Joining As
                            </label>

                            <div className="grid grid-cols-2 gap-2">

                                {["learner", "coach"].map((r) => (
                                    <label
                                        key={r}
                                        className={`cursor-pointer rounded-lg border px-3 py-3 text-center text-[10px] font-bold uppercase tracking-[0.1em] transition-all duration-300 sm:px-4 sm:py-4 sm:text-xs sm:tracking-[0.15em] ${formData.role === r
                                                ? "border-[#E21B23] bg-[#E21B23] text-white shadow-[0_0_20px_rgba(226,27,35,0.2)]"
                                                : "border-white/10 bg-[#05070D] text-white/40 hover:border-white/30 hover:text-white"
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name="role"
                                            value={r}
                                            checked={formData.role === r}
                                            onChange={handleChange}
                                            className="hidden"
                                        />

                                        {r === "learner" ? "Learner" : "Coach"}
                                    </label>
                                ))}

                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full rounded-lg bg-[#E21B23] py-3.5 text-[10px] font-black uppercase tracking-[0.18em] text-white transition-all duration-300 hover:bg-[#FF2A2A] hover:shadow-[0_0_30px_rgba(226,27,35,0.3)] active:scale-[0.98] sm:py-4 sm:text-xs sm:tracking-[0.2em]"
                        >
                            Create Account
                        </button>

                    </div>
                </form>

            </div>
        </div>
    );
};

export default Register;