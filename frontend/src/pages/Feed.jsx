// Feed.jsx
// Homepage: posts from everyone, newest first, with infinite scroll.
// Writing a post lives on its own page (/new-post, the "Post" nav button).
// Layout matches Discover: feed column + SideRail on xl screens. Below xl the
// sidebar is hidden, so a compact Upcoming session card shows above the posts.

import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import API from '../api/axios';
import PostCard from '../components/PostCard';
import UpcomingSession from '../components/UpcomingSession';
import PageHeader from '../components/PageHeader';
import SideRail from '../components/SideRail';

const PAGE_SIZE = 10;

const Feed = () => {
    const [posts, setPosts] = useState([]);
    const [cursor, setCursor] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const loadingRef = useRef(false); // guards against double-fetching the same page
    const sentinelRef = useRef(null);

    const loadMore = useCallback(async () => {
        if (loadingRef.current || !hasMore) return;
        loadingRef.current = true;
        setLoading(true);
        setError('');
        try {
            const res = await API.get('/posts', { params: { limit: PAGE_SIZE, cursor: cursor || undefined } });
            setPosts((prev) => {
                const seen = new Set(prev.map((p) => p._id));
                return [...prev, ...res.data.posts.filter((p) => !seen.has(p._id))];
            });
            setCursor(res.data.nextCursor);
            setHasMore(Boolean(res.data.nextCursor));
        } catch (err) {
            setError(err.response?.data?.message || 'Could not load the feed');
        }
        loadingRef.current = false;
        setLoading(false);
    }, [cursor, hasMore]);

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
                        <div className="empty-state">
                            <p className="mb-4">No posts yet. Be the first to share something.</p>
                            <Link to="/new-post" className="btn btn-lime"><Plus size={16} strokeWidth={2.5} /> New post</Link>
                        </div>
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
