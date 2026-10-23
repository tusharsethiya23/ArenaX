import { Link } from 'react-router-dom';

// "just now", "5m", "3h", "2d", then a date for anything older than a week
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

export const Avatar = ({ name, photo, size = 'h-11 w-11' }) =>
    photo ? (
        <img
            src={photo}
            alt={name}
            className={`${size} shrink-0 rounded-xl border-2 border-white/10 object-cover`}
        />
    ) : (
        <div className={`${size} flex shrink-0 items-center justify-center rounded-xl border-2 border-white/10 bg-[#E21B23]/15 text-sm font-black uppercase text-[#FF2A2A]`}>
            {name?.[0] || '?'}
        </div>
    );

const PostCard = ({ post }) => {
    // Author can be null if their account was removed
    const author = post.author || { name: 'Deleted user', role: '' };
    const images = post.images || [];

    return (
        <article className="relative overflow-hidden rounded-xl border border-white/10 bg-[#071426]/70 backdrop-blur-md transition-colors duration-300 hover:border-red-500/30">

            {/* ================= AUTHOR ================= */}
            <header className="flex items-center gap-3 p-4 sm:p-5">
                <Avatar name={author.name} photo={author.profilePhoto} />

                <div className="min-w-0 flex-1">
                    {post.author ? (
                        <Link
                            to={`/profile-view/${author._id}`}
                            className="block truncate text-sm font-black uppercase tracking-tight text-white transition-colors hover:text-[#FF2A2A] sm:text-base"
                        >
                            {author.name}
                        </Link>
                    ) : (
                        <span className="block truncate text-sm font-black uppercase tracking-tight text-white/40 sm:text-base">
                            {author.name}
                        </span>
                    )}

                    <p className="mt-0.5 flex flex-wrap items-center text-[9px] font-bold uppercase tracking-[0.15em] text-[#8B95A5] sm:text-[10px]">
                        {author.role && <span className="text-[#FF2A2A]">{author.role}</span>}
                        {author.role === 'coach' && author.sport && (
                            <>
                                <span className="mx-1.5 text-white/20">/</span>
                                <span>{author.sport}</span>
                            </>
                        )}
                        <span className="mx-1.5 text-white/20">·</span>
                        <time dateTime={post.createdAt} title={new Date(post.createdAt).toLocaleString()} className="normal-case tracking-normal">
                            {timeAgo(post.createdAt)}
                        </time>
                    </p>
                </div>
            </header>

            {/* ================= TEXT ================= */}
            {post.text && (
                <p className="whitespace-pre-wrap break-words px-4 pb-4 text-sm leading-6 text-white/80 sm:px-5">
                    {post.text}
                </p>
            )}

            {/* ================= IMAGES ================= */}
            {images.length > 0 && (
                <div className={`grid gap-0.5 border-t border-white/10 ${images.length > 1 ? 'grid-cols-2' : ''}`}>
                    {images.map((src, i) => (
                        <a
                            key={src}
                            href={src}
                            target="_blank"
                            rel="noopener noreferrer"
                            // 3 images: let the first one span the full width
                            className={images.length === 3 && i === 0 ? 'col-span-2' : ''}
                        >
                            <img
                                src={src}
                                alt={`Post image ${i + 1}`}
                                loading="lazy"
                                className={`w-full bg-black/40 object-cover ${images.length === 1 ? 'max-h-[520px]' : 'aspect-square'} ${images.length === 3 && i === 0 ? 'aspect-[2/1]' : ''}`}
                            />
                        </a>
                    ))}
                </div>
            )}
        </article>
    );
};

export default PostCard;
