// CommentsPanel.jsx
// A post's comments (newest first, 20 at a time with "Show older") and a box
// to add one. You can remove your own comments; a post's author can remove
// any comment on it.

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, Send } from 'lucide-react';
import API from '../api/axios';
import Avatar from './Avatar';
import { timeAgo } from '../utils/format';

const MAX_LENGTH = 500;

const CommentsPanel = ({ post, viewer, onCountChange }) => {
    const [comments, setComments] = useState([]);
    const [cursor, setCursor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [text, setText] = useState('');
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');

    const load = (before) =>
        API.get(`/posts/${post._id}/comments`, { params: { cursor: before || undefined } })
            .then((res) => {
                setComments((prev) => (before ? [...prev, ...res.data.comments] : res.data.comments));
                setCursor(res.data.nextCursor);
            })
            .catch(() => setError('Could not load comments'))
            .finally(() => setLoading(false));

    useEffect(() => { load(); }, [post._id]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleSubmit = async (e) => {
        e.preventDefault();
        const trimmed = text.trim();
        if (!trimmed || sending) return;
        setSending(true);
        setError('');
        try {
            const res = await API.post(`/posts/${post._id}/comments`, { text: trimmed });
            setComments((prev) => [res.data.comment, ...prev]);
            setText('');
            onCountChange(res.data.commentCount, res.data.comment);
        } catch (err) {
            setError(err.response?.data?.message || 'Could not post your comment');
        }
        setSending(false);
    };

    const handleDelete = async (comment) => {
        try {
            const res = await API.delete(`/posts/${post._id}/comments/${comment._id}`);
            const remaining = comments.filter((c) => c._id !== comment._id);
            setComments(remaining);
            onCountChange(res.data.commentCount, remaining[0] || null);
        } catch (err) {
            setError(err.response?.data?.message || 'Could not delete the comment');
        }
    };

    const canDelete = (c) => c.author?._id === viewer._id || post.author?._id === viewer._id || viewer.role === 'admin';

    return (
        <div className="space-y-3 border-t border-line pt-4">
            {/* New comment */}
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <Avatar name={viewer.name} photo={viewer.profilePhoto} pastel className="h-9 w-9 text-xs" />
                <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    maxLength={MAX_LENGTH}
                    placeholder="Write a comment..."
                    aria-label="Write a comment"
                    className="input rounded-full py-2.5"
                />
                <button type="submit" disabled={!text.trim() || sending} aria-label="Post comment" className="btn btn-dark h-10 w-10 shrink-0 p-0">
                    <Send size={16} />
                </button>
            </form>

            {error && <p className="alert-error">{error}</p>}
            {loading && <p className="text-sm text-muted">Loading comments...</p>}

            {comments.map((c) => (
                <div key={c._id} className="flex gap-3">
                    <Link to={`/profile-view/${c.author?._id}`} className="shrink-0">
                        <Avatar name={c.author?.name} photo={c.author?.profilePhoto} pastel className="h-9 w-9 text-xs" />
                    </Link>
                    <div className="group min-w-0 flex-1 rounded-2xl bg-canvas px-4 py-2.5">
                        <div className="flex items-start justify-between gap-2">
                            <p className="text-sm">
                                <Link to={`/profile-view/${c.author?._id}`} className="font-semibold hover:underline">{c.author?.name || 'Deleted user'}</Link>
                                <span className="ml-2 text-xs text-muted">{timeAgo(c.createdAt)}</span>
                            </p>
                            {canDelete(c) && (
                                <button onClick={() => handleDelete(c)} aria-label="Delete comment" className="shrink-0 text-muted opacity-60 hover:text-danger hover:opacity-100">
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                        <p className="whitespace-pre-wrap break-words text-sm">{c.text}</p>
                    </div>
                </div>
            ))}

            {cursor && (
                <button onClick={() => load(cursor)} className="text-sm font-semibold text-muted hover:text-ink">
                    Show older comments
                </button>
            )}
        </div>
    );
};

export default CommentsPanel;
