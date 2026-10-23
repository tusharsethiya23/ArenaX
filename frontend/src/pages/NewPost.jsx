// NewPost.jsx
// Create a post (route: /new-post), opened from the "Post" button in the
// middle of the navbar / mobile tab bar. After publishing, it goes back to
// the Feed, where the new post is the newest one at the top.

import { useNavigate } from 'react-router-dom';
import CreatePost from '../components/CreatePost';
import PageHeader from '../components/PageHeader';

const NewPost = () => {
    const navigate = useNavigate();

    return (
        <div className="page max-w-2xl">
            <PageHeader title="New post" subtitle="Share a win, a drill, or what you're training for" />
            <CreatePost onPostCreated={() => navigate('/')} />
        </div>
    );
};

export default NewPost;
