// GoogleRolePicker.jsx
// Shown once to brand-new Google users: are you joining as a learner, a coach,
// or a brand? Brand accounts are separate (company sign-up with a work email,
// no Google sign-in), so "brand" goes to the brand sign-up page instead.

import { useNavigate } from 'react-router-dom';
import { GraduationCap, Whistle, Building2 } from 'lucide-react';

const OPTIONS = [
    { role: 'learner', label: "I'm a learner", hint: 'Find coaches and track your game', icon: GraduationCap, tone: 'bg-accent/15 text-accent' },
    { role: 'coach', label: "I'm a coach", hint: 'Offer sessions and grow your athletes', icon: Whistle, tone: 'bg-accent/15 text-accent' },
    { role: 'brand', label: "I'm a brand", hint: 'Sponsor athletes (sign up with your work email)', icon: Building2, tone: 'bg-accent/15 text-accent' },
];

const GoogleRolePicker = ({ onChoose, onCancel, busy }) => {
    const navigate = useNavigate();
    return (
        <div>
            <p className="text-lg font-bold">One more step</p>
            <p className="mb-4 text-sm text-muted">You're new to ArenaX. How will you use it?</p>
            <div className="grid gap-3">
                {OPTIONS.map(({ role, label, hint, icon: Icon, tone }) => (
                    <button
                        key={role}
                        type="button"
                        disabled={busy}
                        onClick={() => (role === 'brand' ? navigate('/brand/register') : onChoose(role))}
                        className="flex items-center gap-3 rounded-3xl border border-line p-4 text-left transition-colors hover:border-ink disabled:opacity-60"
                    >
                        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${tone}`}><Icon size={18} /></span>
                        <span className="min-w-0">
                            <span className="block font-semibold">{label}</span>
                            <span className="block text-sm text-muted">{hint}</span>
                        </span>
                    </button>
                ))}
            </div>
            <button type="button" onClick={onCancel} className="btn btn-soft mt-4 w-full">Back</button>
        </div>
    );
};

export default GoogleRolePicker;
