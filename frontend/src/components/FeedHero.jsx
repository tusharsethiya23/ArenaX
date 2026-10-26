// FeedHero.jsx
// Banner at the top of the home feed: a dark sports photo with
// "Train · Learn · Compete · Grow", "Build a stronger you" and a link to
// Discover. Scrolls away with the feed.

import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import StadiumArt from './StadiumArt';

const WORDS = ['Train', 'Learn', 'Compete', 'Grow'];

const FeedHero = ({ className = '' }) => (
    <section className={`relative isolate overflow-hidden rounded-2xl border border-line bg-surface ${className}`}>
        <StadiumArt src="/images/feed-hero.jpg" dim="bg-black/45" position="object-[center_20%] sm:origin-right sm:scale-[1.45]" className="-z-10" />

        <div className="flex min-h-[220px] items-end justify-between gap-6 p-6 sm:min-h-[260px] sm:p-8">
            <div className="ml-auto max-w-sm text-right sm:text-left">
                <p className="font-display text-[2.6rem] leading-[0.9] text-white sm:text-6xl">
                    Build a stronger <span className="text-brand">you</span>
                </p>
                <p className="mt-3 text-sm text-white/75">
                    Connect with expert coaches, join tournaments and take your game to the next level.
                </p>
                <Link to="/discover" className="btn btn-dark mt-5 inline-flex">
                    Explore coaches <ArrowRight size={16} />
                </Link>
            </div>
        </div>

        <ul aria-label="Train, learn, compete, grow" className="absolute left-6 top-6 font-display text-base leading-tight text-brand sm:left-8 sm:top-8 sm:text-lg">
            {WORDS.map((w) => <li key={w}>{w}</li>)}
        </ul>
    </section>
);

export default FeedHero;
