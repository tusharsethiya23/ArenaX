// ProComingSoon.jsx
// "ArenaX Pro is coming" (route: /pro, replaces the old subscription page).
// Lists what Pro will add and a "Notify me" button that puts the user on the
// waitlist (Backend: /api/waitlist). Everything in ArenaX is free today.

import { useState } from 'react';
import { Check, Sparkles, Bell, Video, BrainCircuit, LineChart, CalendarCheck, BadgeCheck, Rocket } from 'lucide-react';
import API from '../api/axios';
import useSharedResource from '../hooks/useSharedResource';
import { useAuth } from '../context/AuthContext';
import { toastError } from '../utils/dialogs';

const FEATURES = [
    { icon: BrainCircuit, tone: 'bg-accent/15 text-accent', title: 'Personal AI training plans', text: 'A new plan every week, built from your DNA, sessions and drills.' },
    { icon: Video, tone: 'bg-accent/15 text-accent', title: 'Video technique analysis', text: 'Upload a clip and get feedback on your form from the AI coach.' },
    { icon: LineChart, tone: 'bg-accent/15 text-accent', title: 'Deeper DNA insights', text: 'See how you compare with athletes already at your target level.' },
    { icon: CalendarCheck, tone: 'bg-accent/15 text-accent', title: 'Priority booking', text: 'First pick of new slots from the most popular coaches.' },
    { icon: Rocket, tone: 'bg-highlight/15 text-highlight', title: 'Coach growth tools', text: 'For coaches: detailed stats and a boost in Discover.' },
    { icon: BadgeCheck, tone: 'bg-accent/15 text-accent', title: 'Pro badge', text: 'Show it on your profile and posts.' },
];

const ProComingSoon = () => {
    const { user } = useAuth();
    const { data, loaded, setData } = useSharedResource(user?._id ? '/waitlist/me' : null, { initial: { joined: false } });
    const [busy, setBusy] = useState(false);

    const join = async () => {
        setBusy(true);
        try {
            await API.post('/waitlist');
            setData({ joined: true });
        } catch (err) {
            toastError(err);
        }
        setBusy(false);
    };

    return (
        <div className="page max-w-3xl">
            <section className="card overflow-hidden text-center sm:p-10">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent/15 text-accent">
                    <Sparkles size={26} />
                </span>
                <p className="mt-5 text-xs font-bold uppercase tracking-[0.2em] text-accent">Coming soon</p>
                <h1 className="mt-2 text-4xl font-black tracking-tighter sm:text-5xl">ArenaX Pro</h1>
                <p className="mx-auto mt-3 max-w-md text-muted">
                    Everything in ArenaX is free right now, and it stays free. Pro will add extra tools for athletes and coaches who want more.
                </p>

                <div className="mt-7 flex justify-center">
                    {!loaded ? (
                        <span className="h-12 w-48 animate-pulse rounded-full bg-canvas" />
                    ) : data.joined ? (
                        <p role="status" className="inline-flex items-center gap-2 rounded-full bg-data-mint/15 px-5 py-3 font-semibold text-data-mint">
                            <Check size={18} /> You're on the list
                        </p>
                    ) : (
                        <button onClick={join} disabled={busy} className="btn btn-dark px-7 py-3.5 text-base">
                            <Bell size={18} /> {busy ? 'Adding you...' : 'Notify me'}
                        </button>
                    )}
                </div>
                {data.joined && <p className="mt-3 text-sm text-muted">We'll let you know at {user.email} when Pro launches.</p>}
            </section>

            <section className="mt-6">
                <h2 className="section-title mb-4">What's coming in Pro</h2>
                <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {FEATURES.map(({ icon: Icon, tone, title, text }) => (
                        <li key={title} className="card flex gap-4 p-5 sm:p-5">
                            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${tone}`}>
                                <Icon size={20} />
                            </span>
                            <div className="min-w-0">
                                <p className="font-semibold">{title}</p>
                                <p className="mt-1 text-sm text-muted">{text}</p>
                            </div>
                        </li>
                    ))}
                </ul>
                <p className="mt-4 text-center text-xs text-muted">Planned features; the final list may change before launch.</p>
            </section>
        </div>
    );
};

export default ProComingSoon;
