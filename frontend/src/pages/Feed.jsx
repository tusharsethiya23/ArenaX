import { useState, useEffect, useRef, useCallback } from 'react';
import API from '../api/axios';
import CreatePost from '../components/CreatePost';
import PostCard from '../components/PostCard';
import UpcomingSession from '../components/UpcomingSession';

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

    const handlePostCreated = (post) => setPosts((prev) => [post, ...prev]);

    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-[#05070D]">

            {/* Background glow */}
            <div className="pointer-events-none absolute left-1/2 top-10 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-red-600/10 blur-[120px] sm:top-20 sm:h-[500px] sm:w-[500px] sm:blur-[150px]" />

            {/* Grid lines */}
            <div className="pointer-events-none absolute left-[8%] top-0 h-full border-l border-white/[0.035] sm:left-[15%]" />
            <div className="pointer-events-none absolute right-[8%] top-0 h-full border-l border-white/[0.035] sm:right-[15%]" />

            <div className="relative mx-auto w-full max-w-2xl px-4 py-10 sm:px-6 sm:py-12 md:py-16">

                {/* ================= HEADING ================= */}
                <div className="mb-8 border-l-4 border-[#E21B23] pl-4 sm:mb-10 sm:pl-6">
                    <p className="mb-2 text-[8px] font-bold uppercase tracking-[0.3em] text-[#FF2A2A] sm:mb-3 sm:text-[10px] sm:tracking-[0.4em]">
                        ARENAX / FEED
                    </p>
                    <h1 className="text-3xl font-black uppercase tracking-tight text-white sm:text-4xl md:text-5xl">
                        THE LOCKER ROOM
                    </h1>
                    <p className="mt-3 text-xs text-[#8B95A5] sm:mt-4 sm:text-sm">
                        Updates from coaches and athletes across ArenaX
                    </p>
                </div>

                <UpcomingSession />

                <CreatePost onPostCreated={handlePostCreated} />

                {/* ================= POSTS ================= */}
                <div className="mt-6 flex flex-col gap-4 sm:mt-8 sm:gap-5">
                    {posts.map((post) => (
                        <PostCard key={post._id} post={post} />
                    ))}
                </div>

                {/* ================= STATUS ================= */}
                <div ref={sentinelRef} className="mt-6 sm:mt-8">
                    {loading && (
                        <p className="border-y border-white/10 py-6 text-center text-[9px] uppercase tracking-[0.25em] text-[#8B95A5] sm:text-[10px] sm:tracking-[0.3em]">
                            Loading posts...
                        </p>
                    )}

                    {error && !loading && (
                        <div className="rounded-xl border border-red-500/30 bg-[#071426]/50 px-4 py-6 text-center">
                            <p className="mb-3 text-xs text-[#FF2A2A]">{error}</p>
                            <button
                                onClick={loadMore}
                                className="rounded-lg border border-white/15 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.15em] text-white/70 transition-colors hover:border-[#FF2A2A] hover:text-[#FF2A2A]"
                            >
                                Try again
                            </button>
                        </div>
                    )}

                    {!loading && !error && hasMore && posts.length > 0 && (
                        // Fallback for when the observer doesn't fire (e.g. very tall screens)
                        <button
                            onClick={loadMore}
                            className="w-full rounded-lg border border-white/10 py-3 text-[10px] font-bold uppercase tracking-[0.15em] text-white/50 transition-colors hover:border-[#FF2A2A] hover:text-[#FF2A2A]"
                        >
                            Load more
                        </button>
                    )}

                    {!loading && !error && !hasMore && posts.length === 0 && (
                        <div className="rounded-xl border border-white/10 bg-[#071426]/50 px-4 py-12 text-center sm:px-6 sm:py-16">
                            <p className="text-xs text-[#8B95A5] sm:text-sm">
                                No posts yet. Be the first to share something.
                            </p>
                        </div>
                    )}

                    {!loading && !hasMore && posts.length > 0 && (
                        <div className="flex flex-col gap-2 border-t border-white/10 pt-5 text-[7px] uppercase tracking-[0.25em] text-white/20 sm:flex-row sm:items-center sm:justify-between sm:text-[9px] sm:tracking-[0.3em]">
                            <span>ARENAX</span>
                            <span>YOU'RE ALL CAUGHT UP</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Feed;
