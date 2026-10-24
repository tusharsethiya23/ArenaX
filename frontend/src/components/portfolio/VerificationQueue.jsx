// VerificationQueue.jsx
// Achievements waiting for the logged-in user to review: coaches see requests
// from athletes they've trained; admins see coaches' achievements (ArenaX team).
// Renders nothing when the queue is empty.

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import API from '../../api/axios';
import Avatar from '../Avatar';
import { achievementMeta } from '../../utils/achievements';
import ReviewActions from './ReviewActions';

const VerificationQueue = ({ title = 'Verification requests' }) => {
    const [items, setItems] = useState([]);

    useEffect(() => {
        API.get('/achievements/requests/pending').then((res) => setItems(res.data)).catch(() => {});
    }, []);

    if (items.length === 0) return null;

    return (
        <section className="card mb-6">
            <h2 className="mb-1 flex items-center gap-2 text-lg font-bold tracking-tight">
                {title} <span className="badge bg-lime px-2 py-0.5 text-ink">{items.length}</span>
            </h2>
            <p className="mb-4 text-sm text-muted">Only verify what you know is true. Your name appears on the achievement.</p>
            <ul className="divide-y divide-line">
                {items.map((a) => (
                    <li key={a._id} className="py-4">
                        <div className="flex items-start gap-3">
                            <Link to={`/profile-view/${a.owner._id}`} className="shrink-0">
                                <Avatar name={a.owner.name} photo={a.owner.profilePhoto} pastel className="h-10 w-10 text-xs" />
                            </Link>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm text-muted">
                                    <Link to={`/profile-view/${a.owner._id}`} className="font-semibold text-ink hover:underline">{a.owner.name}</Link> asked you to verify
                                </p>
                                <p className="font-semibold">{a.title}</p>
                                <p className="text-sm text-muted">{achievementMeta(a)}</p>
                                {a.description && <p className="mt-1 text-sm text-ink/80">{a.description}</p>}
                                {a.proofLink && (
                                    <a href={a.proofLink} target="_blank" rel="noopener noreferrer nofollow" className="mt-1 inline-flex items-center gap-1 text-sm font-medium hover:underline">
                                        <ExternalLink size={14} /> View proof
                                    </a>
                                )}
                                <ReviewActions achievementId={a._id} onDone={() => setItems((prev) => prev.filter((x) => x._id !== a._id))} />
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </section>
    );
};

export default VerificationQueue;
