// MyAthletes.jsx
// For coaches (route: /my-athletes): athletes they've had a confirmed or
// completed session with, with each one's DNA readiness. Opens their DNA,
// where the coach can submit an assessment.

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import API from '../api/axios';
import PageHeader from '../components/PageHeader';
import Avatar from '../components/Avatar';

const fmtDate = (d) => new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

const MyAthletes = () => {
    const [athletes, setAthletes] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        API.get('/dna/my-athletes')
            .then((res) => setAthletes(res.data))
            .catch((err) => setError(err.response?.data?.message || 'Could not load your athletes'));
    }, []);

    return (
        <div className="page max-w-4xl">
            <PageHeader title="My athletes" subtitle="Athletes you've coached. Assess their skills to update their DNA." />

            {error && <p className="empty-state">{error}</p>}
            {!error && !athletes && <p className="empty-state">Loading...</p>}
            {athletes?.length === 0 && (
                <p className="empty-state">Athletes appear here once you've confirmed a session with them.</p>
            )}

            {athletes?.length > 0 && (
                <ul className="card divide-y divide-line p-2 sm:p-3">
                    {athletes.map((a) => (
                        <li key={a._id}>
                            <Link to={`/dna/${a._id}`} className="group flex items-center gap-4 rounded-2xl p-3 transition-colors hover:bg-canvas">
                                <Avatar name={a.name} photo={a.profilePhoto} pastel className="h-12 w-12 text-sm" />
                                <div className="min-w-0 flex-1">
                                    <p className="truncate font-semibold">{a.name}</p>
                                    <p className="truncate text-sm text-muted">
                                        {[a.sport, a.goal && `Goal: ${a.goal}`].filter(Boolean).join(' · ')}
                                    </p>
                                    <p className="text-xs text-muted">
                                        {a.lastAssessedByYou ? `You assessed them ${fmtDate(a.lastAssessedByYou)}` : 'Not assessed by you yet'}
                                    </p>
                                </div>
                                <div className="shrink-0 text-right">
                                    <p className="text-2xl font-black tracking-tight">{a.readiness ?? '—'}{a.readiness !== null && <span className="text-sm">%</span>}</p>
                                    <p className="text-xs text-muted">readiness</p>
                                </div>
                                <ArrowUpRight size={18} className="shrink-0 text-muted group-hover:text-ink" />
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default MyAthletes;
