// MarketPlace.jsx
// Training content (drills, plans, video courses) listed by coaches.
// Coaches can list new content; learners can buy.

import { useState, useEffect } from 'react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';
import Select from '../components/Select';

const TYPE_LABELS = { drill: 'Drill', training_plan: 'Training plan', video_course: 'Video course' };

const Marketplace = () => {
    const { user } = useAuth();
    const [content, setContent] = useState([]);
    const [form, setForm] = useState({ title: '', description: '', price: '', fileLink: '', type: 'drill' });
    const [typeFilter, setTypeFilter] = useState('all');

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

    const visible = typeFilter === 'all' ? content : content.filter((c) => c.type === typeFilter);

    return (
        <div className="page">
            <PageHeader title="Marketplace" subtitle="Drills, plans and video courses from coaches" />

            <div className={user.role === 'coach' ? 'grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_380px]' : ''}>

                {/* ================= AVAILABLE CONTENT ================= */}
                <div className="min-w-0">
                    {/* Type filter chips */}
                    <div className="-mx-1 mb-5 flex gap-2 overflow-x-auto px-1 pb-1">
                        {['all', ...Object.keys(TYPE_LABELS)].map((t) => (
                            <button key={t} onClick={() => setTypeFilter(t)} className={`chip ${typeFilter === t ? 'chip-active' : ''}`}>
                                {t === 'all' ? 'All' : TYPE_LABELS[t]}
                            </button>
                        ))}
                    </div>

                    {visible.length === 0 ? (
                        <p className="empty-state">No content here yet.</p>
                    ) : (
                        <div className={`grid grid-cols-1 gap-5 sm:grid-cols-2 ${user.role === 'coach' ? '' : 'lg:grid-cols-3'}`}>
                            {visible.map((c) => (
                                <div key={c._id} className="flex flex-col rounded-[28px] bg-surface p-5">
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="badge bg-canvas text-ink">{TYPE_LABELS[c.type] || c.type}</span>
                                        <span className="text-xl font-extrabold tracking-tight">₹{c.price}</span>
                                    </div>

                                    <h3 className="mt-4 break-words text-lg font-bold tracking-tight">{c.title}</h3>
                                    <p className="text-sm text-muted">by {c.coach?.name}</p>

                                    {c.description && (
                                        <p className="mt-3 text-sm leading-6 text-ink/80">{c.description}</p>
                                    )}

                                    {user.role === 'learner' && (
                                        <div className="mt-auto pt-5">
                                            <button onClick={() => handleBuy(c._id)} className="btn btn-dark">
                                                Buy
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ================= COACH UPLOAD ================= */}
                {user.role === 'coach' && (
                    <form onSubmit={handleUpload} className="card h-fit space-y-4 lg:sticky lg:top-24">
                        <h2 className="text-lg font-bold tracking-tight">List new content</h2>

                        <div>
                            <label className="label">Title</label>
                            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required className="input" />
                        </div>

                        <div>
                            <label className="label">Description</label>
                            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="input resize-none" />
                        </div>

                        <div>
                            <label className="label">File / video link</label>
                            <input value={form.fileLink} onChange={(e) => setForm({ ...form, fileLink: e.target.value })} required className="input" />
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="min-w-0">
                                <label className="label">Price (₹)</label>
                                <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required className="input" />
                            </div>
                            <div className="min-w-0">
                                <label className="label" htmlFor="content-type">Type</label>
                                <Select
                                    id="content-type"
                                    value={form.type}
                                    onChange={(type) => setForm({ ...form, type })}
                                    options={[
                                        { value: 'drill', label: 'Drill' },
                                        { value: 'training_plan', label: 'Training plan' },
                                        { value: 'video_course', label: 'Video course' },
                                    ]}
                                />
                            </div>
                        </div>

                        <button type="submit" className="btn btn-lime w-full py-3">
                            List content
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default Marketplace;
