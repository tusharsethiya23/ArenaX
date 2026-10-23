// PostPage.jsx
// A single post (route: /post/:postId) — where shared links land.
// Opens with the comments showing.

import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import useFollowingIds from '../hooks/useFollowingIds';
import PostCard from '../components/PostCard';

const PostPage = () => {
    const { postId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const { followingIds, toggleFollow } = useFollowingIds();
    const [post, setPost] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        API.get(`/posts/${postId}`)
            .then((res) => setPost(res.data))
            .catch((err) => setError(err.response?.status === 404 ? 'This post was deleted or never existed.' : 'Could not load this post.'));
    }, [postId]);

    return (
        <div className="page max-w-3xl">
            <Link to="/" className="btn mb-4 bg-surface px-4">
                <ArrowLeft size={16} /> Feed
            </Link>

            {error && <p className="empty-state">{error}</p>}
            {!error && !post && <p className="empty-state">Loading post...</p>}
            {post && (
                <PostCard
                    key={post._id}
                    post={post}
                    viewer={user}
                    isFollowing={followingIds.has(post.author?._id)}
                    onToggleFollow={toggleFollow}
                    onDeleted={() => navigate('/')}
                    showComments
                />
            )}
        </div>
    );
};

export default PostPage;
