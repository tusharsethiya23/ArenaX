import { Link } from 'react-router-dom';
import Avatar from './Avatar';

// "just now", "5m ago", "3h ago", "2d ago", then a date for anything older than a week
const timeAgo = (dateString) => {
    const seconds = Math.floor((Date.now() - new Date(dateString)) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateString).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
};

const PostCard = ({ post }) => {
    // Author can be null if their account was removed
    const author = post.author || { name: 'Deleted user', role: '' };
    const images = post.images || [];

    return (
        <article className="overflow-hidden rounded-[28px] bg-surface">

            {/* ================= AUTHOR ================= */}
            <header className="flex items-center gap-3 p-5">
                <Avatar name={author.name} photo={author.profilePhoto} className="h-11 w-11 text-sm" />

                <div className="min-w-0 flex-1">
                    {post.author ? (
                        <Link
                            to={`/profile-view/${author._id}`}
                            className="block truncate font-semibold transition-colors hover:text-muted"
                        >
                            {author.name}
                        </Link>
                    ) : (
                        <span className="block truncate font-semibold text-muted">{author.name}</span>
                    )}

                    <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-muted">
                        {author.role && <span className="capitalize">{author.role}</span>}
                        {author.role === 'coach' && author.sport && <span>· {author.sport}</span>}
                        <span>·</span>
                        <time dateTime={post.createdAt} title={new Date(post.createdAt).toLocaleString()}>
                            {timeAgo(post.createdAt)}
                        </time>
                    </p>
                </div>

                {author.role === 'coach' && <span className="badge bg-lime text-ink">Coach</span>}
            </header>

            {/* ================= TEXT ================= */}
            {post.text && (
                <p className="whitespace-pre-wrap break-words px-5 pb-5 text-[15px] leading-6">
                    {post.text}
                </p>
            )}

            {/* ================= IMAGES ================= */}
            {images.length > 0 && (
                <div className={`grid gap-1.5 px-3 pb-3 ${images.length > 1 ? 'grid-cols-2' : ''}`}>
                    {images.map((src, i) => (
                        <a
                            key={src}
                            href={src}
                            target="_blank"
                            rel="noopener noreferrer"
                            // 3 images: let the first one span the full width
                            className={`overflow-hidden rounded-[20px] ${images.length === 3 && i === 0 ? 'col-span-2' : ''}`}
                        >
                            <img
                                src={src}
                                alt={`Post image ${i + 1}`}
                                loading="lazy"
                                className={`w-full bg-canvas object-cover ${images.length === 1 ? 'max-h-[520px]' : 'aspect-square'} ${images.length === 3 && i === 0 ? 'aspect-[2/1]' : ''}`}
                            />
                        </a>
                    ))}
                </div>
            )}
        </article>
    );
};

export default PostCard;
