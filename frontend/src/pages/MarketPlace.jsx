import { useState, useEffect } from 'react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

const Marketplace = () => {
    const { user } = useAuth();
    const [content, setContent] = useState([]);
    const [form, setForm] = useState({ title: '', description: '', price: '', fileLink: '', type: 'drill' });

    const fetchContent = async () => {
        const res = await API.get('/content');
        setContent(res.data);
    };

    useEffect(() => {
        fetchContent();
    }, []);

    const handleUpload = async (e) => {
        e.preventDefault();
        try {
            await API.post('/content', form);
            setForm({ title: '', description: '', price: '', fileLink: '', type: 'drill' });
            fetchContent();
        } catch (err) {
            alert(err.response?.data?.message || 'Something went wrong');
        }
    };

    const handleBuy = async (id) => {
        try {
            await API.post(`/content/${id}/purchase`);
            alert('Purchased!');
        } catch (err) {
            alert(err.response?.data?.message || 'Something went wrong');
        }
    };

    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-[#05070D] text-white">

            {/* Background layer */}
            <div className="absolute inset-0 -z-0 bg-[#05070D]" />

            {/* Red glow */}
            <div className="pointer-events-none absolute left-1/2 top-0 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-[#E21B23]/10 blur-[120px] sm:h-[500px] sm:w-[500px] sm:blur-[150px]" />

            {/* Background grid */}
            <div className="pointer-events-none absolute inset-0">

                <div className="absolute left-[8%] top-0 h-full border-l border-white/[0.035] sm:left-[15%]" />

                <div className="absolute left-1/2 top-0 h-full border-l border-[#E21B23]/[0.04]" />

                <div className="absolute right-[8%] top-0 h-full border-l border-white/[0.035] sm:right-[15%]" />

                <div className="absolute left-0 top-[25%] w-full border-t border-white/[0.025]" />

                <div className="absolute left-0 top-[75%] w-full border-t border-white/[0.025]" />

            </div>


            {/* Main content */}
            <div className="relative z-10 mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">

                {/* Header */}
                <div className="mb-7 border-l-4 border-[#E21B23] pl-4 sm:mb-8 sm:pl-5">

                    <p className="mb-2 text-[8px] font-bold uppercase tracking-[0.3em] text-[#FF2A2A] sm:mb-2 sm:text-[9px] sm:tracking-[0.4em]">
                        ARENAX / TRAINING
                    </p>

                    <h1 className="text-2xl font-black uppercase tracking-tight text-white sm:text-3xl md:text-4xl">
                        TRAINING MARKETPLACE
                    </h1>

                    <p className="mt-2 text-xs leading-5 text-[#8B95A5] sm:text-sm">
                        Drills, plans & video courses from coaches
                    </p>

                </div>


                {/* ================= COACH UPLOAD ================= */}

                {user.role === "coach" && (
                    <form
                        onSubmit={handleUpload}
                        className="relative mb-8 overflow-hidden rounded-xl border border-white/10 bg-[#071426] p-4 shadow-[0_10px_40px_rgba(0,0,0,0.35)] sm:mb-10 sm:p-6"
                    >

                        {/* Red accent */}
                        <div className="absolute left-0 top-0 h-full w-1 bg-[#E21B23]" />

                        <h3 className="mb-4 text-base font-black uppercase tracking-wide text-white sm:mb-5 sm:text-lg">
                            List New Content
                        </h3>

                        <div className="space-y-4">

                            {/* Title */}
                            <div>
                                <label className="mb-2 block text-[8px] font-bold uppercase tracking-[0.25em] text-[#8B95A5] sm:text-[9px] sm:tracking-[0.3em]">
                                    Title
                                </label>

                                <input
                                    placeholder="Enter title"
                                    value={form.title}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            title: e.target.value
                                        })
                                    }
                                    required
                                    className="w-full min-w-0 rounded-lg border border-white/10 bg-[#05070D] px-3 py-3 text-xs text-white outline-none placeholder:text-white/20 focus:border-[#E21B23] sm:px-4 sm:py-3 sm:text-sm"
                                />
                            </div>


                            {/* Description */}
                            <div>
                                <label className="mb-2 block text-[8px] font-bold uppercase tracking-[0.25em] text-[#8B95A5] sm:text-[9px] sm:tracking-[0.3em]">
                                    Description
                                </label>

                                <textarea
                                    placeholder="Describe your content"
                                    value={form.description}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            description: e.target.value
                                        })
                                    }
                                    rows={3}
                                    className="w-full min-w-0 resize-none rounded-lg border border-white/10 bg-[#05070D] px-3 py-3 text-xs text-white outline-none placeholder:text-white/20 focus:border-[#E21B23] sm:px-4 sm:text-sm"
                                />
                            </div>


                            {/* File / video link */}
                            <div>
                                <label className="mb-2 block text-[8px] font-bold uppercase tracking-[0.25em] text-[#8B95A5] sm:text-[9px] sm:tracking-[0.3em]">
                                    File / Video Link
                                </label>

                                <input
                                    placeholder="Paste file or video link"
                                    value={form.fileLink}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            fileLink: e.target.value
                                        })
                                    }
                                    required
                                    className="w-full min-w-0 rounded-lg border border-white/10 bg-[#05070D] px-3 py-3 text-xs text-white outline-none placeholder:text-white/20 focus:border-[#E21B23] sm:px-4 sm:py-3 sm:text-sm"
                                />
                            </div>


                            {/* Price + Type */}
                            <div className="grid gap-4 sm:grid-cols-2">

                                <div className="min-w-0">
                                    <label className="mb-2 block text-[8px] font-bold uppercase tracking-[0.25em] text-[#8B95A5] sm:text-[9px] sm:tracking-[0.3em]">
                                        Price (₹)
                                    </label>

                                    <input
                                        type="number"
                                        placeholder="Price"
                                        value={form.price}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                price: e.target.value
                                            })
                                        }
                                        required
                                        className="w-full min-w-0 rounded-lg border border-white/10 bg-[#05070D] px-3 py-3 text-xs text-white outline-none placeholder:text-white/20 focus:border-[#E21B23] sm:px-4 sm:text-sm"
                                    />
                                </div>


                                <div className="min-w-0">
                                    <label className="mb-2 block text-[8px] font-bold uppercase tracking-[0.25em] text-[#8B95A5] sm:text-[9px] sm:tracking-[0.3em]">
                                        Type
                                    </label>

                                    <select
                                        value={form.type}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                type: e.target.value
                                            })
                                        }
                                        className="w-full min-w-0 rounded-lg border border-white/10 bg-[#05070D] px-3 py-3 text-xs text-white outline-none focus:border-[#E21B23] sm:px-4 sm:text-sm"
                                    >
                                        <option value="drill">Drill</option>
                                        <option value="training_plan">Training Plan</option>
                                        <option value="video_course">Video Course</option>
                                    </select>
                                </div>

                            </div>


                            {/* Submit */}
                            <button
                                type="submit"
                                className="w-full rounded-lg bg-[#E21B23] px-5 py-3 text-[10px] font-black uppercase tracking-[0.15em] text-white transition-all duration-300 hover:bg-[#FF2A2A] hover:shadow-[0_0_25px_rgba(226,27,35,0.25)] active:scale-[0.98] sm:w-auto sm:px-6 sm:text-xs sm:tracking-[0.18em]"
                            >
                                List Content
                            </button>

                        </div>

                    </form>
                )}


                {/* ================= AVAILABLE CONTENT ================= */}

                <div className="mb-4 flex items-center gap-3 sm:mb-5 sm:gap-4">

                    <h2 className="shrink-0 text-xs font-black uppercase tracking-[0.15em] text-white sm:text-sm sm:tracking-[0.2em]">
                        Available Content
                    </h2>

                    <div className="h-px flex-1 bg-white/10" />

                </div>


                {/* Content cards */}
                <div className="grid gap-4 sm:grid-cols-2">

                    {content.map((c) => (

                        <div
                            key={c._id}
                            className="relative overflow-hidden rounded-xl border border-white/10 bg-[#071426] p-4 shadow-[0_10px_35px_rgba(0,0,0,0.3)] transition-all duration-300 hover:border-[#E21B23]/50 sm:p-5"
                        >

                            {/* Red accent */}
                            <div className="absolute left-0 top-0 h-full w-1 bg-[#E21B23]" />


                            {/* Title + price */}
                            <div className="flex min-w-0 items-start justify-between gap-3">

                                <div className="min-w-0">

                                    <h3 className="break-words text-base font-black uppercase tracking-wide text-white sm:text-lg">
                                        {c.title}
                                    </h3>

                                    <p className="mt-1 break-words text-[10px] font-medium uppercase tracking-[0.1em] text-[#FF2A2A] sm:text-xs sm:tracking-[0.12em]">
                                        {c.coach?.name}
                                    </p>

                                </div>

                                <span className="shrink-0 text-base font-black text-white sm:text-lg">
                                    ₹{c.price}
                                </span>

                            </div>


                            {/* Description */}
                            <p className="mt-4 text-xs leading-5 text-white/50 sm:text-sm sm:leading-6">
                                {c.description}
                            </p>


                            {/* Bottom */}
                            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">

                                <span className="text-[8px] font-bold uppercase tracking-[0.15em] text-[#8B95A5] sm:text-[9px] sm:tracking-[0.2em]">
                                    {c.type?.replace("_", " ")}
                                </span>


                                {user.role === "learner" && (
                                    <button
                                        onClick={() => handleBuy(c._id)}
                                        className="shrink-0 rounded-lg border border-[#E21B23] px-4 py-2 text-[9px] font-black uppercase tracking-[0.12em] text-[#FF2A2A] transition-all duration-300 hover:bg-[#E21B23] hover:text-white active:scale-[0.97] sm:px-5 sm:text-[10px] sm:tracking-[0.15em]"
                                    >
                                        Buy
                                    </button>
                                )}

                            </div>

                        </div>

                    ))}

                </div>


                {/* Footer */}
                <div className="mt-8 flex flex-col gap-2 border-t border-white/10 pt-4 text-[7px] uppercase tracking-[0.25em] text-white/20 sm:mt-10 sm:flex-row sm:items-center sm:justify-between sm:text-[8px] sm:tracking-[0.3em]">
                    <span>ARENAX</span>
                    <span>TRAINING / MARKETPLACE</span>
                </div>

            </div>

        </div>
    );
};

export default Marketplace;