// Feed.jsx
// Homepage: posts newest first, with infinite scroll, in two tabs:
//   All       — posts from everyone (/posts)
//   Following — only people you follow (/posts/following)
// Writing a post lives on its own page (/new-post, the "+" nav button).
// Layout matches Discover: feed column + SideRail on xl screens. Below xl the
// sidebar is hidden, so a compact Upcoming session card shows above the posts.

import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Compass } from 'lucide-react';
import API from '../api/axios';
import PostCard from '../components/PostCard';
import UpcomingSession from '../components/UpcomingSession';
import PageHeader from '../components/PageHeader';
import SideRail from '../components/SideRail';

const PAGE_SIZE = 10;
const TABS = [
    { id: 'all', label: 'All', endpoint: '/posts' },
    { id: 'following', label: 'Following', endpoint: '/posts/following' },
];

const Feed = () => {
    const [tab, setTab] = useState('all');
    const [posts, setPosts] = useState([]);
    const [cursor, setCursor] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const loadingRef = useRef(false); // guards against double-fetching the same page
    const tabRef = useRef(tab);       // lets a late response know its tab is no longer showing
    const sentinelRef = useRef(null);

    const loadMore = useCallback(async () => {
        if (loadingRef.current || !hasMore) return;
        const requestTab = tab;
        loadingRef.current = true;
        setLoading(true);
        setError('');
        try {
            const endpoint = TABS.find((t) => t.id === requestTab).endpoint;
            const res = await API.get(endpoint, { params: { limit: PAGE_SIZE, cursor: cursor || undefined } });
            if (tabRef.current !== requestTab) return; // user switched tabs meanwhile
            setPosts((prev) => {
                const seen = new Set(prev.map((p) => p._id));
                return [...prev, ...res.data.posts.filter((p) => !seen.has(p._id))];
            });
            setCursor(res.data.nextCursor);
            setHasMore(Boolean(res.data.nextCursor));
        } catch (err) {
            if (tabRef.current !== requestTab) return;
            setError(err.response?.data?.message || 'Could not load the feed');
        } finally {
            if (tabRef.current === requestTab) {
                loadingRef.current = false;
                setLoading(false);
            }
        }
    }, [cursor, hasMore, tab]);

    // Switching tabs starts that feed from the top
    const switchTab = (id) => {
        if (id === tab) return;
        tabRef.current = id;
        loadingRef.current = false;
        setTab(id);
        setPosts([]);
        setCursor(null);
        setHasMore(true);
        setError('');
        setLoading(false);
    };

    // Infinite scroll: load the next page when the sentinel at the bottom comes into view.
    // Also loads the first page, since the sentinel is visible while the feed is empty.
    useEffect(() => {
        if (error || !hasMore || !sentinelRef.current) return;
        const observer = new IntersectionObserver(
            (entries) => entries[0].isIntersecting && loadMore(),
            { rootMargin: '400px' }
        );
        observer.observe(sentinelRef.current);
        return () => observer.disconnect();
    }, [loadMore, error, hasMore]);

    return (
        <div className="page grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">

            {/* ===================== FEED COLUMN ===================== */}
            <div className="mx-auto w-full min-w-0 max-w-2xl xl:max-w-3xl">
                <PageHeader title="Feed" subtitle="Updates from coaches and athletes across ArenaX" />

                <div className="space-y-5">
                    <UpcomingSession className="xl:hidden" />

                    {/* All / Following tabs */}
                    <div className="flex gap-2" role="tablist">
                        {TABS.map((t) => (
                            <button
                                key={t.id}
                                role="tab"
                                aria-selected={tab === t.id}
                                onClick={() => switchTab(t.id)}
                                className={`chip ${tab === t.id ? 'chip-active' : ''}`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {posts.map((post) => (
                        <PostCard key={post._id} post={post} />
                    ))}
                </div>

                {/* ================= STATUS ================= */}
                <div ref={sentinelRef} className="mt-5">
                    {loading && <p className="empty-state">Loading posts...</p>}

                    {error && !loading && (
                        <div className="empty-state">
                            <p className="mb-4 text-danger">{error}</p>
                            <button onClick={loadMore} className="btn btn-dark">Try again</button>
                        </div>
                    )}

                    {!loading && !error && hasMore && posts.length > 0 && (
                        // Fallback for when the observer doesn't fire (e.g. very tall screens)
                        <button onClick={loadMore} className="btn btn-soft w-full bg-surface">
                            Load more
                        </button>
                    )}

                    {!loading && !error && !hasMore && posts.length === 0 && (
                        tab === 'following' ? (
                            <div className="empty-state">
                                <p className="mb-4">Posts from people you follow show up here.</p>
                                <Link to="/discover" className="btn btn-dark"><Compass size={16} /> Find people to follow</Link>
                            </div>
                        ) : (
                            <div className="empty-state">
                                <p className="mb-4">No posts yet. Be the first to share something.</p>
                                <Link to="/new-post" className="btn btn-lime"><Plus size={16} strokeWidth={2.5} /> New post</Link>
                            </div>
                        )
                    )}

                    {!loading && !hasMore && posts.length > 0 && (
                        <p className="py-4 text-center text-sm text-muted">You're all caught up.</p>
                    )}
                </div>
            </div>

            {/* ===================== RIGHT COLUMN ===================== */}
            <div className="hidden xl:block">
                <div className="sticky top-24">
                    <SideRail />
                </div>
            </div>
        </div>
    );
};

export default Feed;
