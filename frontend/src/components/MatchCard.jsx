// MatchCard.jsx
// On a coach's profile, for athletes: how well this coach fits them and why,
// plus the coach's focus skills. Renders nothing for other viewers or on error.

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import API from '../api/axios';
import MatchBadge from './MatchBadge';
import { DNA_SKILL_LABEL } from '../utils/dna';

const MatchCard = ({ coachId }) => {
    const [data, setData] = useState(null);

    useEffect(() => {
        let cancelled = false;
        API.get(`/match/coaches/${coachId}`)
            .then((res) => !cancelled && setData(res.data))
            .catch(() => !cancelled && setData(null));
        return () => { cancelled = true; };
    }, [coachId]);

    if (!data) return null;
    const { basis, coach } = data;
    const { match } = coach;
    const needs = basis.needs.map((n) => n.key);
    const otherSport = basis.sport && coach.sport && basis.sport.trim().toLowerCase() !== coach.sport.trim().toLowerCase();

    return (
        <section className="card">
            <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold tracking-tight">Your match</h2>
                <MatchBadge score={match.score} className="px-3 py-1 text-sm" />
            </div>

            {otherSport && <p className="mt-2 text-sm text-muted">This coach teaches {coach.sport}; your sport is {basis.sport}.</p>}

            {match.reasons.length > 0 && (
                <ul className="mt-3 space-y-1.5 text-sm">
                    {match.reasons.map((r) => (
                        <li key={r.text} className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0" /> {r.text}</li>
                    ))}
                </ul>
            )}

            {coach.coachFocus?.length > 0 && (
                <div className="mt-4">
                    <p className="label">Focus skills</p>
                    <div className="flex flex-wrap gap-2">
                        {coach.coachFocus.map((k) => (
                            <span key={k} className={`badge ${needs.includes(k) ? 'bg-lime text-on-ink' : 'bg-canvas text-ink'}`}>
                                {DNA_SKILL_LABEL[k]}{needs.includes(k) && ' · your gap'}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {!basis.hasDna && (
                <p className="mt-4 text-sm text-muted">
                    <Link to="/dna" className="font-semibold text-ink underline">Set up your Athlete DNA</Link> to see how this coach fits your weak spots.
                </p>
            )}
        </section>
    );
};

export default MatchCard;
