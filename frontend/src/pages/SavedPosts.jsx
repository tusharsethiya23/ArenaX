// SavedPosts.jsx
// Posts the logged-in user bookmarked (route: /saved), most recently saved first.
// Only you can see your saved posts.

import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useFollowingIds from '../hooks/useFollowingIds';
import PageHeader from '../components/PageHeader';
import PostList from '../components/PostList';

const SavedPosts = () => {
    const { user } = useAuth();
    const { followState, toggleFollow } = useFollowingIds();

    return (
        <div className="page max-w-3xl">
            <PageHeader title="Saved posts" subtitle="Only you can see what you've saved" />
            <PostList
                endpoint="/posts/saved"
                viewer={user}
                followState={followState}
                onToggleFollow={toggleFollow}
                empty={
                    <div className="empty-state">
                        <p className="mb-4">Nothing saved yet. Tap the bookmark on any post to keep it here.</p>
                        <Link to="/" className="btn btn-dark">Go to feed</Link>
                    </div>
                }
            />
        </div>
    );
};

export default SavedPosts;
