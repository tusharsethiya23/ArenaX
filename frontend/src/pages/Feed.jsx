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

const Feed = () => {
    const { user } = useAuth();
    const { profile } = useMyProfile();
    const { bookings, reload: reloadBookings } = useMyBookings();
    const { followingIds, toggleFollow } = useFollowingIds();
    const [tab, setTab] = useState('all');
    const [sort, setSort] = useState('latest');
    const endpoint = TABS.find((t) => t.id === tab).endpoint;

    return (
        <div className="page grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[280px_minmax(0,1fr)_340px]">

            {/* ===================== LEFT ===================== */}
            <div className="hidden xl:block">
                <div className="sticky top-24"><FeedSidebar profile={profile} bookings={bookings} /></div>
            </div>

            {/* ===================== FEED ===================== */}
            <main className="min-w-0">
                <UpcomingSession className="mb-5 lg:hidden" />

                {/* Tabs + sort; the sort drops to its own line on narrow screens instead of covering a tab */}
                <div className="mb-5 flex flex-wrap items-center justify-end gap-2">
                    <div className="flex flex-1 basis-auto gap-2" role="tablist">
                        {TABS.map((t) => (
                            <button
                                key={t.id}
                                role="tab"
                                aria-selected={tab === t.id}
                                onClick={() => setTab(t.id)}
                                className={`chip ${tab === t.id ? 'chip-active' : ''}`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                    <select
                        value={sort}
                        onChange={(e) => setSort(e.target.value)}
                        aria-label="Sort posts"
                        className="shrink-0 cursor-pointer bg-transparent text-sm font-medium text-muted outline-none hover:text-ink"
                    >
                        <option value="latest">Latest</option>
                        <option value="popular">Most liked</option>
                    </select>
                </div>

                {/* New key on tab/sort change = fresh list from the top */}
                <PostList
                    key={`${tab}-${sort}`}
                    endpoint={endpoint}
                    sort={sort}
                    viewer={user}
                    followingIds={followingIds}
                    onToggleFollow={toggleFollow}
                    empty={EMPTY[tab]}
                />
            </main>

            {/* ===================== RIGHT ===================== */}
            <div className="hidden lg:block">
                <div className="sticky top-24">
                    <FeedRail
                        profile={profile}
                        bookings={bookings}
                        reloadBookings={reloadBookings}
                        followingIds={followingIds}
                        onToggleFollow={toggleFollow}
                    />
                </div>
            </div>
        </div>
    );
};

export default Feed;
