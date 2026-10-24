// GoogleRolePicker.jsx
// Shown once to brand-new Google users: are you joining as a learner or a coach?

import { GraduationCap, Whistle } from 'lucide-react';

const OPTIONS = [
    { role: 'learner', label: 'Learner', hint: 'Find coaches and track your game', icon: GraduationCap },
    { role: 'coach', label: 'Coach', hint: 'Offer sessions and grow your athletes', icon: Whistle },
];

const GoogleRolePicker = ({ onChoose, onCancel, busy }) => (
    <div>
        <p className="text-lg font-bold">One more step</p>
        <p className="mb-4 text-sm text-muted">You're new to ArenaX. How will you use it?</p>
        <div className="grid gap-3 sm:grid-cols-2">
            {OPTIONS.map(({ role, label, hint, icon: Icon }) => (
                <button
                    key={role}
                    type="button"
                    disabled={busy}
                    onClick={() => onChoose(role)}
                    className="flex flex-col items-start gap-2 rounded-3xl border border-line p-4 text-left transition-colors hover:border-ink disabled:opacity-60"
                >
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-lime"><Icon size={18} /></span>
                    <span className="font-semibold">I'm a {label.toLowerCase()}</span>
                    <span className="text-sm text-muted">{hint}</span>
                </button>
            ))}
        </div>
        <button type="button" onClick={onCancel} className="btn btn-soft mt-4 w-full">Back</button>
    </div>
);

export default GoogleRolePicker;
