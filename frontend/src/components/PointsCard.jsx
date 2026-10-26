// PointsCard.jsx
// Arena Points on your own profile: total, daily streak, how to earn more,
// your invite link (a friend who signs up with it earns you points once
// they've verified their account), and recent awards.

import { useState } from 'react';
import { Zap, Flame, Copy, Check, Share2 } from 'lucide-react';
import usePoints from '../hooks/usePoints';
import { timeAgo } from '../utils/format';
import { toast } from '../utils/dialogs';

const REASON_TONE = { streak: 'text-accent', session: 'text-accent', post: 'text-accent', referral: 'text-accent' };

const PointsCard = () => {
    const { points, streak, inviteCode, earn, history, loaded } = usePoints();
    const [copied, setCopied] = useState(false);
    const inviteLink = inviteCode ? `${window.location.origin}/register?ref=${inviteCode}` : '';

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(inviteLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast('Could not copy. Select the link and copy it instead.', 'error');
        }
    };
    const share = () => navigator.share?.({ title: 'Join me on ArenaX', text: 'Train, track your progress and find coaches on ArenaX.', url: inviteLink }).catch(() => {});

    return (
        <section className="card">
            <h2 className="text-lg font-bold tracking-tight">Arena Points</h2>

            {/* ---------- Total + streak ---------- */}
            <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-3xl bg-canvas p-4">
                    <p className="flex items-center gap-1.5 text-xs text-muted"><Zap size={13} className="fill-highlight text-highlight" /> Points</p>
                    <p className="mt-1 text-3xl font-black tracking-tight text-highlight">{loaded ? points.toLocaleString() : '…'}</p>
                </div>
                <div className="rounded-3xl bg-canvas p-4">
                    <p className="flex items-center gap-1.5 text-xs text-muted"><Flame size={13} className="text-accent" /> Daily streak</p>
                    <p className="mt-1 text-3xl font-black tracking-tight">{streak.count}<span className="text-base font-semibold text-muted"> {streak.count === 1 ? 'day' : 'days'}</span></p>
                    <p className="text-xs text-muted">Best: {streak.best}</p>
                </div>
            </div>

            {/* ---------- How to earn ---------- */}
            <p className="label mt-5">How to earn</p>
            <ul className="space-y-2">
                {earn.map((e) => (
                    <li key={e.reason} className="flex items-center justify-between gap-3 text-sm">
                        <span className="text-ink/85">{e.label}</span>
                        <span className={`shrink-0 font-bold ${REASON_TONE[e.reason]}`}>+{e.points}</span>
                    </li>
                ))}
            </ul>

            {/* ---------- Invite ---------- */}
            {inviteLink && (
                <div className="mt-5 rounded-3xl border border-line p-4">
                    <p className="text-sm font-semibold">Invite friends, earn {earn.find((e) => e.reason === 'referral')?.points ?? 100} each</p>
                    <p className="mt-0.5 text-xs text-muted">You get the points when they sign up with your link and verify their account.</p>
                    <div className="mt-3 flex items-center gap-2">
                        <input readOnly value={inviteLink} aria-label="Your invite link" onFocus={(e) => e.target.select()} className="input min-w-0 flex-1 py-2.5 text-xs" />
                        <button onClick={copy} aria-label="Copy invite link" className="btn btn-soft shrink-0 px-3 py-2.5">
                            {copied ? <Check size={16} className="text-data-mint" /> : <Copy size={16} />}
                        </button>
                        {typeof navigator.share === 'function' && (
                            <button onClick={share} aria-label="Share invite link" className="btn btn-soft shrink-0 px-3 py-2.5"><Share2 size={16} /></button>
                        )}
                    </div>
                </div>
            )}

            {/* ---------- Recent awards ---------- */}
            {history.length > 0 && (
                <>
                    <p className="label mt-5">Recent</p>
                    <ul className="divide-y divide-line">
                        {history.slice(0, 6).map((h) => (
                            <li key={h._id} className="flex items-center justify-between gap-3 py-2 text-sm">
                                <span className="min-w-0 truncate">{h.label}</span>
                                <span className="flex shrink-0 items-center gap-3">
                                    <span className="text-xs text-muted">{timeAgo(h.at)}</span>
                                    <span className={`font-bold ${REASON_TONE[h.reason]}`}>+{h.amount}</span>
                                </span>
                            </li>
                        ))}
                    </ul>
                </>
            )}
        </section>
    );
};

export default PointsCard;
