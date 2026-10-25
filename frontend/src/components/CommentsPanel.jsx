// CommentsPanel.jsx
// A post's comments (newest first, 20 at a time with "Show older") and a box
// to add one. Anyone can reply: replies sit under their comment (one level,
// "View N replies"), and replying to a reply mentions that person (@Name).
// Comments and replies by the post's author stand out: lime bubble and an
// "Author" badge. You can remove your own comments; a post's author can remove
// any comment on it (removing a comment removes its replies).

import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { X, Send } from 'lucide-react';
import API from '../api/axios';
import Avatar from './Avatar';
import { timeAgo } from '../utils/format';

const MAX_LENGTH = 500;

// One comment or reply: avatar, bubble (lime for the post's author), and a Reply link
const CommentBubble = ({ c, isAuthor, small, canDelete, onDelete, onReply }) => (
    <div className="flex gap-3">
        <Link to={`/profile-view/${c.author?._id}`} className="shrink-0">
            <Avatar name={c.author?.name} photo={c.author?.profilePhoto} pastel className={small ? 'h-7 w-7 text-[10px]' : 'h-9 w-9 text-xs'} />
        </Link>
        <div className="min-w-0 flex-1">
            <div className={`rounded-2xl px-4 py-2.5 ${isAuthor ? 'bg-lime/10 ring-1 ring-lime/60' : 'bg-canvas'}`}>
                <div className="flex items-start justify-between gap-2">
                    <p className="flex flex-wrap items-center gap-x-2 text-sm">
                        <Link to={`/profile-view/${c.author?._id}`} className="font-semibold hover:underline">{c.author?.name || 'Deleted user'}</Link>
                        {isAuthor && <span className="rounded-full bg-lime px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-on-ink">Author</span>}
                        <span className="text-xs text-muted">{timeAgo(c.createdAt)}</span>
                    </p>
                    {canDelete && (
                        <button onClick={onDelete} aria-label="Delete comment" className="shrink-0 text-muted opacity-60 hover:text-danger hover:opacity-100">
                            <X size={14} />
                        </button>
                    )}
                </div>
                <p className="whitespace-pre-wrap break-words text-sm">
                    {c.replyTo?.name && <Link to={`/profile-view/${c.replyTo._id}`} className="font-semibold text-ink/70 hover:underline">@{c.replyTo.name}</Link>}
                    {c.replyTo?.name && ' '}
                    {c.text}
                </p>
            </div>
            <button onClick={onReply} className="ml-4 mt-1 text-xs font-semibold text-muted hover:text-ink">Reply</button>
        </div>
    </div>
);

// The text box for a new comment or a reply
const Composer = ({ viewer, placeholder, onSend, autoFocus, onCancel, small }) => {
    const [text, setText] = useState('');
    const [sending, setSending] = useState(false);
    const inputRef = useRef(null);
    useEffect(() => { if (autoFocus) inputRef.current?.focus(); }, [autoFocus]);

    const submit = async (e) => {
        e.preventDefault();
        const trimmed = text.trim();
        if (!trimmed || sending) return;
        setSending(true);
        if (await onSend(trimmed)) setText('');
        setSending(false);
    };

    return (
        <form onSubmit={submit} className="flex items-center gap-2">
            <Avatar name={viewer.name} photo={viewer.profilePhoto} pastel className={small ? 'h-7 w-7 text-[10px]' : 'h-9 w-9 text-xs'} />
            <input
                ref={inputRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === 'Escape' && onCancel?.()}
                maxLength={MAX_LENGTH}
                placeholder={placeholder}
                aria-label={placeholder}
                className="input rounded-full py-2.5"
            />
            <button type="submit" disabled={!text.trim() || sending} aria-label={onCancel ? 'Post reply' : 'Post comment'} className="btn btn-dark h-10 w-10 shrink-0 p-0">
                <Send size={16} />
            </button>
            {onCancel && (
                <button type="button" onClick={onCancel} aria-label="Cancel reply" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted hover:bg-canvas hover:text-ink">
                    <X size={16} />
                </button>
            )}
        </form>
    );
};

// A top-level comment with its replies and reply box
const Thread = ({ comment, post, viewer, isAuthor, canDelete, onRemoved, onCountChange, setError }) => {
    const [replies, setReplies] = useState([]);
    const [replyCount, setReplyCount] = useState(comment.replyCount || 0);
    const [cursor, setCursor] = useState(null);
    const [open, setOpen] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [replyingTo, setReplyingTo] = useState(null); // the comment or reply being answered

    const loadReplies = async (after) => {
        try {
            const res = await API.get(`/posts/${post._id}/comments/${comment._id}/replies`, { params: { cursor: after || undefined } });
            setReplies((prev) => (after ? [...prev, ...res.data.replies] : res.data.replies));
            setCursor(res.data.nextCursor);
            setLoaded(true);
        } catch {
            setError('Could not load replies');
        }
    };

    const toggle = () => {
        if (!open && !loaded) loadReplies();
        setOpen(!open);
    };

    const startReply = (target) => {
        setReplyingTo(target);
        if (!open) { setOpen(true); if (!loaded) loadReplies(); }
    };

    const sendReply = async (text) => {
        try {
            const res = await API.post(`/posts/${post._id}/comments`, { text, parentId: replyingTo._id });
            setReplies((prev) => [...prev, res.data.comment]);
            setReplyCount(res.data.replyCount);
            setReplyingTo(null);
            onCountChange(res.data.commentCount);
            return true;
        } catch (err) {
            setError(err.response?.data?.message || 'Could not post your reply');
            return false;
        }
    };

    const deleteReply = async (reply) => {
        try {
            const res = await API.delete(`/posts/${post._id}/comments/${reply._id}`);
            setReplies((prev) => prev.filter((r) => r._id !== reply._id));
            setReplyCount(res.data.replyCount);
            onCountChange(res.data.commentCount);
        } catch (err) {
            setError(err.response?.data?.message || 'Could not delete the reply');
        }
    };

    return (
        <div>
            <CommentBubble
                c={comment}
                isAuthor={isAuthor(comment)}
                canDelete={canDelete(comment)}
                onDelete={() => onRemoved(comment, replyCount)}
                onReply={() => startReply(comment)}
            />

            {(replyCount > 0 || open) && (
                <div className="ml-12 mt-2 space-y-2">
                    {replyCount > 0 && (
                        <button onClick={toggle} className="flex items-center gap-2 text-xs font-semibold text-muted hover:text-ink">
                            <span className="h-px w-6 bg-line" />
                            {open ? 'Hide replies' : `View ${replyCount} ${replyCount === 1 ? 'reply' : 'replies'}`}
                        </button>
                    )}
                    {open && replies.map((r) => (
                        <CommentBubble
                            key={r._id}
                            c={r}
                            small
                            isAuthor={isAuthor(r)}
                            canDelete={canDelete(r)}
                            onDelete={() => deleteReply(r)}
                            onReply={() => startReply(r)}
                        />
                    ))}
                    {open && cursor && (
                        <button onClick={() => loadReplies(cursor)} className="text-xs font-semibold text-muted hover:text-ink">Show more replies</button>
                    )}
                    {replyingTo && (
                        <Composer
                            key={replyingTo._id}
                            small
                            viewer={viewer}
                            autoFocus
                            placeholder={`Reply to ${replyingTo.author?.name || 'comment'}...`}
                            onSend={sendReply}
                            onCancel={() => setReplyingTo(null)}
                        />
                    )}
                </div>
            )}
        </div>
    );
};

const CommentsPanel = ({ post, viewer, onCountChange }) => {
    const [comments, setComments] = useState([]);
    const [cursor, setCursor] = useState(null);
    const [loading, setLoading] = useState(true);
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

    const addComment = async (text) => {
        setError('');
        try {
            const res = await API.post(`/posts/${post._id}/comments`, { text });
            setComments((prev) => [res.data.comment, ...prev]);
            onCountChange(res.data.commentCount, res.data.comment);
            return true;
        } catch (err) {
            setError(err.response?.data?.message || 'Could not post your comment');
            return false;
        }
    };

    const removeComment = async (comment, replyCount = 0) => {
        if (replyCount > 0 && !window.confirm('Delete this comment and its replies?')) return;
        try {
            const res = await API.delete(`/posts/${post._id}/comments/${comment._id}`);
            const remaining = comments.filter((c) => c._id !== comment._id);
            setComments(remaining);
            onCountChange(res.data.commentCount, remaining[0] || null);
        } catch (err) {
            setError(err.response?.data?.message || 'Could not delete the comment');
        }
    };

    const isAuthor = (c) => Boolean(c.author?._id) && c.author._id === post.author?._id;
    const canDelete = (c) => c.author?._id === viewer._id || post.author?._id === viewer._id || viewer.role === 'admin';
    // Replies change the total but not the preview, which shows the newest top-level comment
    const replyCountChange = (commentCount) => onCountChange(commentCount, comments[0] || null);

    return (
        <div className="space-y-4 border-t border-line pt-4">
            <Composer viewer={viewer} placeholder="Write a comment..." onSend={addComment} />

            {error && <p className="alert-error">{error}</p>}
            {loading && <p className="text-sm text-muted">Loading comments...</p>}

            {comments.map((c) => (
                <Thread
                    key={c._id}
                    comment={c}
                    post={post}
                    viewer={viewer}
                    isAuthor={isAuthor}
                    canDelete={canDelete}
                    onRemoved={removeComment}
                    onCountChange={replyCountChange}
                    setError={setError}
                />
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
