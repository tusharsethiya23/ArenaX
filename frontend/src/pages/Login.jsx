import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

const Login = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
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
            const res = await API.post('/auth/login', formData);
            login(res.data);
            navigate('/discover');
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong');
        }
    };

    return (
        <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#05070D] px-4 py-8 sm:px-6">

            {/* Red glow */}
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-600/10 blur-[100px] sm:h-[500px] sm:w-[500px] sm:blur-[140px]" />

            {/* Background grid */}
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-[8%] top-0 h-full border-l border-white/[0.035] sm:left-[15%]" />
                <div className="absolute left-1/2 top-0 h-full border-l border-red-500/[0.04]" />
                <div className="absolute right-[8%] top-0 h-full border-l border-white/[0.035] sm:right-[15%]" />

                <div className="absolute left-0 top-[20%] w-full border-t border-white/[0.025]" />
                <div className="absolute bottom-[20%] left-0 w-full border-t border-white/[0.025]" />
            </div>

            {/* Login container */}
            <div className="relative w-full max-w-md">

                {/* Logo */}
                <div className="mb-6 text-center sm:mb-7">
                    <Link
                        to="/"
                        className="text-xs font-black uppercase tracking-[0.35em] text-[#FF2A2A] sm:text-sm sm:tracking-[0.45em]"
                    >
                        ARENAX
                    </Link>
                </div>

                {/* Heading */}
                <div className="mb-6 border-l-4 border-[#E21B23] pl-4 sm:mb-7 sm:pl-5">

                    <p className="mb-2 text-[8px] font-bold uppercase tracking-[0.3em] text-[#8B95A5] sm:text-[9px] sm:tracking-[0.35em]">
                        ACCESS / 01
                    </p>

                    <h1 className="text-3xl font-black uppercase tracking-tight text-white sm:text-4xl">
                        LOGIN
                    </h1>

                    <p className="mt-2 text-[11px] leading-5 text-[#8B95A5] sm:text-xs">
                        Enter your credentials to continue.
                    </p>

                </div>

                {/* Error */}
                {error && (
                    <div className="mb-4 border border-red-500/30 bg-red-500/10 px-3 py-3 text-[11px] leading-5 text-red-400 sm:mb-5 sm:px-4 sm:text-xs">
                        {error}
                    </div>
                )}

                {/* Form */}
                <form
                    onSubmit={handleSubmit}
                    className="rounded-xl border border-white/10 bg-[#071426]/80 p-4 backdrop-blur-md sm:p-6"
                >

                    <div className="space-y-4 sm:space-y-5">

                        {/* Email */}
                        <div>
                            <label className="mb-2 block text-[8px] font-bold uppercase tracking-[0.25em] text-[#8B95A5] sm:text-[9px] sm:tracking-[0.3em]">
                                Email
                            </label>

                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="ENTER EMAIL"
                                required
                                className="w-full rounded-lg border border-white/10 bg-[#05070D] px-3 py-3 text-xs text-white outline-none transition-all duration-300 placeholder:text-white/20 focus:border-[#E21B23] focus:shadow-[0_0_20px_rgba(226,27,35,0.1)] sm:px-4 sm:py-3.5 sm:text-sm"
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label className="mb-2 block text-[8px] font-bold uppercase tracking-[0.25em] text-[#8B95A5] sm:text-[9px] sm:tracking-[0.3em]">
                                Password
                            </label>

                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="ENTER PASSWORD"
                                required
                                className="w-full rounded-lg border border-white/10 bg-[#05070D] px-3 py-3 text-xs text-white outline-none transition-all duration-300 placeholder:text-white/20 focus:border-[#E21B23] focus:shadow-[0_0_20px_rgba(226,27,35,0.1)] sm:px-4 sm:py-3.5 sm:text-sm"
                            />
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            className="w-full rounded-lg bg-[#E21B23] py-3 text-[10px] font-black uppercase tracking-[0.18em] text-white transition-all duration-300 hover:bg-[#FF2A2A] hover:shadow-[0_0_30px_rgba(226,27,35,0.3)] active:scale-[0.98] sm:py-3.5 sm:text-xs sm:tracking-[0.2em]"
                        >
                            Login
                        </button>

                    </div>

                </form>

                {/* Register */}
                <div className="mt-4 text-center sm:mt-5">
                    <p className="text-[11px] text-white/40 sm:text-xs">
                        Don't have an account?{" "}
                        <Link
                            to="/register"
                            className="font-bold uppercase tracking-wide text-[#FF2A2A] transition-colors hover:text-white"
                        >
                            Register
                        </Link>
                    </p>
                </div>

                {/* Bottom detail */}
                <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4 text-[7px] uppercase tracking-[0.25em] text-white/20 sm:mt-7 sm:text-[8px] sm:tracking-[0.3em]">
                    <span>ARENAX</span>
                    <span>SECURE ACCESS</span>
                </div>

            </div>
        </div>
    );
};

export default Login;