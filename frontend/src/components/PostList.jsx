// PostList.jsx
// Infinite-scrolling list of posts from one feed endpoint (/posts,
// /posts/following, /posts/coaches, /posts/saved). Give it a new `key` when
// the endpoint or sort changes and it starts again from the top.

import { useState, useEffect, useRef, useCallback } from 'react';
import API from '../api/axios';
import PostCard from './PostCard';

const PAGE_SIZE = 10;

const PostList = ({ endpoint, sort, viewer, followingIds, onToggleFollow, empty }) => {
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
            const res = await API.get(endpoint, { params: { limit: PAGE_SIZE, cursor: cursor || undefined, sort } });
            setPosts((prev) => {
                const seen = new Set(prev.map((p) => p._id));
                return [...prev, ...res.data.posts.filter((p) => !seen.has(p._id))];
            });
            setCursor(res.data.nextCursor);
            setHasMore(Boolean(res.data.nextCursor));
        } catch (err) {
            setError(err.response?.data?.message || 'Could not load posts');
        }
        loadingRef.current = false;
        setLoading(false);
    }, [endpoint, sort, cursor, hasMore]);

    // Load the next page when the sentinel at the bottom comes into view
    // (this also loads the first page, since the sentinel starts visible)
    useEffect(() => {
        if (error || !hasMore || !sentinelRef.current) return;
        const observer = new IntersectionObserver(
            (entries) => entries[0].isIntersecting && loadMore(),
            { rootMargin: '400px' }
        );
        observer.observe(sentinelRef.current);
        return () => observer.disconnect();
    }, [loadMore, error, hasMore]);

    const removePost = (id) => setPosts((prev) => prev.filter((p) => p._id !== id));

    return (
        <>
            <div className="space-y-5">
                {posts.map((post) => (
                    <PostCard
                        key={post._id}
                        post={post}
                        viewer={viewer}
                        isFollowing={followingIds?.has(post.author?._id)}
                        onToggleFollow={onToggleFollow}
                        onDeleted={removePost}
                    />
                ))}
            </div>

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
                    <button onClick={loadMore} className="btn btn-soft w-full bg-surface">Load more</button>
                )}

                {!loading && !error && !hasMore && posts.length === 0 && empty}

                {!loading && !hasMore && posts.length > 0 && (
                    <p className="py-4 text-center text-sm text-muted">You're all caught up.</p>
                )}
            </div>
        </>
    );
};

export default PostList;
