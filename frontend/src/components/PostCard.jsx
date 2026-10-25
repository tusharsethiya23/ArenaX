// PostCard.jsx
// One post in the feed:
//   header   avatar, name, role badge, "sport · location · 1h ago", Follow, "…" menu
//   body     text with #tags/@mentions, photo carousel with location tag
//   actions  like, comments, share, save, and "Book <coach> · ₹price" on coach posts
//   footer   latest comment preview, or the full comments panel when opened
// Likes and saves update instantly and are corrected from the server's answer.

import { useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Plus, Check, Clock, Link2, Trash2 } from 'lucide-react';
import API from '../api/axios';
import useDismiss from '../hooks/useDismiss';
import Avatar from './Avatar';
import VerifiedBadge from './VerifiedBadge';
import RichText from './RichText';
import ImageCarousel from './ImageCarousel';
import CommentsPanel from './CommentsPanel';
import { compact, timeAgo, firstName } from '../utils/format';

const ROLE_BADGE = {
    coach: { label: 'Coach', className: 'bg-white text-on-ink' },
    learner: { label: 'Athlete', className: 'bg-canvas text-muted' },
    admin: { label: 'Admin', className: 'bg-ink text-on-ink' },
};

const PostCard = ({ post: initialPost, viewer, followState = 'none', onToggleFollow, onDeleted, showComments = false }) => {
    const [post, setPost] = useState(initialPost);
    const [commentsOpen, setCommentsOpen] = useState(showComments);
    const [menuOpen, setMenuOpen] = useState(false);
    const [toast, setToast] = useState('');
    const menuRef = useRef(null);
    const closeMenu = useCallback(() => setMenuOpen(false), []);
    useDismiss(menuRef, menuOpen, closeMenu);

    // Author can be null if their account was removed
    const author = post.author || { name: 'Deleted user' };
    const isMine = Boolean(post.author) && author._id === viewer?._id;
    const canDelete = isMine || viewer?.role === 'admin';
    const profileUrl = post.author ? `/profile-view/${author._id}` : null;
    const badge = ROLE_BADGE[author.role];
    const postUrl = `${window.location.origin}/post/${post._id}`;
    const canBookAuthor = author.role === 'coach' && !isMine && viewer?.role === 'learner';

    const flash = (message) => {
        setToast(message);
        setTimeout(() => setToast(''), 2000);
    };

    const toggleLike = async () => {
        const liked = !post.isLiked;
        setPost((p) => ({ ...p, isLiked: liked, likeCount: Math.max(0, p.likeCount + (liked ? 1 : -1)) }));
        try {
            const res = liked ? await API.post(`/posts/${post._id}/like`) : await API.delete(`/posts/${post._id}/like`);
            setPost((p) => ({ ...p, isLiked: res.data.isLiked, likeCount: res.data.likeCount }));
        } catch {
            setPost((p) => ({ ...p, isLiked: !liked, likeCount: Math.max(0, p.likeCount + (liked ? -1 : 1)) }));
            flash('Could not update like');
        }
    };

    const toggleSave = async () => {
        const saved = !post.isSaved;
        setPost((p) => ({ ...p, isSaved: saved }));
        try {
            await (saved ? API.post(`/posts/${post._id}/save`) : API.delete(`/posts/${post._id}/save`));
            flash(saved ? 'Saved' : 'Removed from saved');
        } catch {
            setPost((p) => ({ ...p, isSaved: !saved }));
            flash('Could not update saved posts');
        }
    };

    const copyLink = async () => {
        closeMenu();
        try {
            await navigator.clipboard.writeText(postUrl);
            flash('Link copied');
        } catch {
            flash(postUrl);
        }
    };

    // Touch devices (phones/tablets) get the native share sheet; on desktop the
    // link is copied, which is what people expect there
    const share = async () => {
        const touch = window.matchMedia?.('(pointer: coarse)').matches;
        if (touch && navigator.share) {
            try {
                await navigator.share({ title: `${author.name} on ArenaX`, url: postUrl });
                return;
            } catch (err) {
                if (err.name === 'AbortError') return; // user closed the share sheet
            }
        }
        copyLink();
    };

    const deletePost = async () => {
        closeMenu();
        if (!window.confirm('Delete this post? This cannot be undone.')) return;
        try {
            await API.delete(`/posts/${post._id}`);
            onDeleted?.(post._id);
        } catch (err) {
            flash(err.response?.data?.message || 'Could not delete the post');
        }
    };

    // The latest comment is by the post's author (styled like in the comments panel)
    const latestByAuthor = Boolean(post.latestComment?.author?._id) && post.latestComment.author._id === post.author?._id;

    const handleCommentCount = (commentCount, latestComment) =>
        setPost((p) => ({ ...p, commentCount, latestComment }));

    // Avatar and name open the author's profile (plain text if the account is gone)
    const toProfile = (children, className) =>
        profileUrl ? <Link to={profileUrl} className={className}>{children}</Link> : <span className={className}>{children}</span>;

    return (
        <article className="rounded-[28px] bg-surface p-5">

            {/* ================= HEADER ================= */}
            <header className="flex items-start gap-3">
                {toProfile(<Avatar name={author.name} photo={author.profilePhoto} pastel className="h-12 w-12 text-base" />, 'shrink-0')}
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        {toProfile(author.name, 'truncate font-bold hover:underline')}
                        {author.verified && <VerifiedBadge size={16} />}
                        {badge && <span className={`badge px-2 py-0.5 text-[10px] uppercase tracking-wider ${badge.className}`}>{badge.label}</span>}
                    </div>
                    <p className="truncate text-sm text-muted">
                        {[author.sport, author.location].filter(Boolean).join(' · ')}
                        {(author.sport || author.location) && ' · '}
                        <time dateTime={post.createdAt} title={new Date(post.createdAt).toLocaleString()}>{timeAgo(post.createdAt)}</time>
                    </p>
                </div>

                {post.author && !isMine && onToggleFollow && (
                    <button
                        onClick={() => onToggleFollow(author._id)}
                        aria-label={{ following: `Unfollow ${author.name}`, requested: `Cancel follow request to ${author.name}` }[followState] || `Follow ${author.name}`}
                        className={`btn shrink-0 px-3 py-1.5 text-[13px] sm:px-4 sm:py-2 sm:text-sm ${followState === 'none' ? 'btn-dark' : 'btn-soft'}`}
                    >
                        {/* Icons only from sm up, so phones keep room for the author's name */}
                        {followState === 'following' && <><Check size={15} className="hidden sm:block" /> Following</>}
                        {followState === 'requested' && <><Clock size={15} className="hidden sm:block" /> Requested</>}
                        {followState === 'none' && <><Plus size={15} className="hidden sm:block" /> Follow</>}
                    </button>
                )}

                <div ref={menuRef} className="relative shrink-0">
                    <button onClick={() => setMenuOpen(!menuOpen)} aria-label="Post options" aria-expanded={menuOpen} className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-canvas hover:text-ink">
                        <MoreHorizontal size={18} />
                    </button>
                    {menuOpen && (
                        <div role="menu" className="absolute right-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-2xl border border-line bg-popover p-1.5 backdrop-blur-xl shadow-[0_15px_40px_rgba(0,0,0,0.12)]">
                            <button role="menuitem" onClick={copyLink} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm hover:bg-canvas">
                                <Link2 size={15} /> Copy link
                            </button>
                            {canDelete && (
                                <button role="menuitem" onClick={deletePost} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-danger hover:bg-danger/10">
                                    <Trash2 size={15} /> Delete post
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </header>

            {/* ================= BODY ================= */}
            {post.text && <RichText text={post.text} className="mt-4 text-[15px] leading-6" />}

            {post.images?.length > 0 ? (
                <div className="mt-4"><ImageCarousel images={post.images} location={post.location} /></div>
            ) : post.location && (
                <p className="mt-3 text-sm text-muted">📍 {post.location}</p>
            )}

            {/* ================= ACTIONS ================= */}
            <div className="mt-4 flex flex-wrap items-center gap-1">
                <button
                    onClick={toggleLike}
                    aria-pressed={post.isLiked}
                    aria-label={post.isLiked ? 'Unlike' : 'Like'}
                    className={`btn px-4 py-2 ${post.isLiked ? 'bg-accent/15 text-accent' : 'hover:bg-canvas'}`}
                >
                    <Heart size={17} className={post.isLiked ? 'fill-accent' : ''} /> {compact(post.likeCount)}
                </button>
                <button onClick={() => setCommentsOpen(!commentsOpen)} aria-expanded={commentsOpen} aria-label="Comments" className={`btn px-4 py-2 ${commentsOpen ? 'bg-data-blue/15 text-data-blue' : 'hover:bg-canvas'}`}>
                    <MessageCircle size={17} /> {compact(post.commentCount)}
                </button>
                <button onClick={share} className="btn px-4 py-2 hover:bg-canvas hover:text-data-mint">
                    <Share2 size={17} /> <span className="hidden sm:inline">Share</span>
                </button>
                <button onClick={toggleSave} aria-pressed={post.isSaved} aria-label={post.isSaved ? 'Remove from saved' : 'Save post'} className={`btn px-3 py-2 ${post.isSaved ? 'bg-highlight/15 text-highlight' : 'hover:bg-canvas'}`}>
                    <Bookmark size={17} className={post.isSaved ? 'fill-highlight' : ''} />
                </button>

                {toast && <span role="status" className="ml-1 text-sm text-muted">{toast}</span>}

                {canBookAuthor && (
                    <Link to={profileUrl} className="btn btn-lime ml-auto">
                        Book {firstName(author.name)}{author.pricePerSession ? ` · ₹${author.pricePerSession}` : ''}
                    </Link>
                )}
            </div>

            {/* ================= COMMENTS ================= */}
            {commentsOpen ? (
                <div className="mt-4">
                    <CommentsPanel post={post} viewer={viewer} onCountChange={handleCommentCount} />
                </div>
            ) : post.latestComment && (
                <button onClick={() => setCommentsOpen(true)} className="mt-4 flex w-full gap-3 border-t border-line pt-4 text-left">
                    <Avatar name={post.latestComment.author?.name} photo={post.latestComment.author?.profilePhoto} pastel className="h-9 w-9 text-xs" />
                    <span className={`min-w-0 flex-1 rounded-2xl px-4 py-2.5 ${latestByAuthor ? 'bg-white/[0.08] ring-1 ring-accent/50' : 'bg-canvas'}`}>
                        <span className="flex items-center gap-2 text-sm font-semibold">
                            {post.latestComment.author?.name || 'Deleted user'}
                            {latestByAuthor && <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-on-ink">Author</span>}
                        </span>
                        <span className="block truncate text-sm">{post.latestComment.text}</span>
                    </span>
                </button>
            )}
        </article>
    );
};

export default PostCard;
