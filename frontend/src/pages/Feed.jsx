// Feed.jsx
// Homepage, three columns on large screens (design mockup):
//   left    profile summary + menu (FeedSidebar)
//   center  tabs (For you / Following / Coaches), Latest / Most liked, posts
//   right   session requests, upcoming sessions, coaches to follow (FeedRail)
// Smaller screens show just the feed, with a compact upcoming-session card.
// Writing a post lives on its own page (/new-post, the "+" nav button).

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Compass } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import useMyProfile from '../hooks/useMyProfile';
import useMyBookings from '../hooks/useMyBookings';
import useFollowingIds from '../hooks/useFollowingIds';
import PostList from '../components/PostList';
import FeedSidebar from '../components/FeedSidebar';
import FeedRail from '../components/FeedRail';
import UpcomingSession from '../components/UpcomingSession';
import Select from '../components/Select';

const TABS = [
    { id: 'all', label: 'For you', endpoint: '/posts' },
    { id: 'following', label: 'Following', endpoint: '/posts/following' },
    { id: 'coaches', label: 'Coaches', endpoint: '/posts/coaches' },
];

const EMPTY = {
    all: (
        <div className="empty-state">
            <p className="mb-4">No posts yet. Be the first to share something.</p>
            <Link to="/new-post" className="btn btn-lime"><Plus size={16} strokeWidth={2.5} /> New post</Link>
        </div>
    ),
    following: (
        <div className="empty-state">
            <p className="mb-4">Posts from people you follow show up here.</p>
            <Link to="/discover" className="btn btn-dark"><Compass size={16} /> Find people to follow</Link>
        </div>
    ),
    coaches: <p className="empty-state">No posts from coaches yet.</p>,
};

// Side columns stay in view while the feed scrolls (below the 96px navbar), are
// never taller than the screen (24px gap at the bottom), and scroll inside
// themselves when their content is taller.
const SIDE_COLUMN = 'sticky top-24 max-h-[calc(100dvh-7.5rem)] overflow-y-auto overscroll-contain rounded-2xl [scrollbar-width:thin]';
// The left column fits on screen, so it never shows a scrollbar (the wheel still works on very short screens)
const LEFT_COLUMN = SIDE_COLUMN.replace('[scrollbar-width:thin]', '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden');

const Feed = () => {
    const { user } = useAuth();
    const { profile } = useMyProfile();
    const { bookings, reload: reloadBookings } = useMyBookings();
    const { followState, toggleFollow } = useFollowingIds();
    const [tab, setTab] = useState('all');
    const [sort, setSort] = useState('latest');
    const endpoint = TABS.find((t) => t.id === tab).endpoint;

    return (
        <div className="page grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[280px_minmax(0,1fr)_340px]">

            {/* ===================== LEFT ===================== */}
            <div className="hidden xl:block">
                <div className={LEFT_COLUMN}><FeedSidebar profile={profile} bookings={bookings} /></div>
            </div>

            {/* ===================== FEED ===================== */}
            <main className="min-w-0">
                <UpcomingSession className="mb-5 lg:hidden" />

                {/* Tabs + sort; the sort drops to its own line on narrow screens instead of covering a tab */}
                <div className="mb-5 flex flex-wrap items-center justify-end gap-2">
                    <div className="flex flex-1 basis-auto gap-5 border-b border-line" role="tablist">
                        {TABS.map((t) => (
                            <button
                                key={t.id}
                                role="tab"
                                aria-selected={tab === t.id}
                                onClick={() => setTab(t.id)}
                                className={`tab ${tab === t.id ? 'tab-active' : ''}`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                    <Select
                        variant="inline"
                        aria-label="Sort posts"
                        value={sort}
                        onChange={setSort}
                        className="shrink-0"
                        buttonClassName="text-sm text-muted hover:text-ink"
                        options={[{ value: 'latest', label: 'Latest' }, { value: 'popular', label: 'Most liked' }]}
                    />
                </div>

                {/* New key on tab/sort change = fresh list from the top */}
                <PostList
                    key={`${tab}-${sort}`}
                    endpoint={endpoint}
                    sort={sort}
                    viewer={user}
                    followState={followState}
                    onToggleFollow={toggleFollow}
                    empty={EMPTY[tab]}
                />
            </main>

            {/* ===================== RIGHT ===================== */}
            <div className="hidden lg:block">
                <div className={SIDE_COLUMN}>
                    <FeedRail
                        profile={profile}
                        bookings={bookings}
                        reloadBookings={reloadBookings}
                        followState={followState}
                        onToggleFollow={toggleFollow}
                    />
                </div>
            </div>
        </div>
    );
};

export default Feed;
