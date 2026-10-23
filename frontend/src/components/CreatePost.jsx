import { useState, useEffect, useRef } from 'react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Avatar } from './PostCard';

// Keep in sync with Backend/models/post.model.js and upload.middleware.js
const MAX_TEXT_LENGTH = 2000;
const MAX_IMAGES = 4;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const CreatePost = ({ onPostCreated }) => {
    const { user } = useAuth();
    const [text, setText] = useState('');
    const [images, setImages] = useState([]); // [{ file, preview }]
    const [error, setError] = useState('');
    const [posting, setPosting] = useState(false);
    const fileInputRef = useRef(null);
    const imagesRef = useRef(images);

    // Free preview URLs still held when the component unmounts
    useEffect(() => { imagesRef.current = images; }, [images]);
    useEffect(() => () => imagesRef.current.forEach((img) => URL.revokeObjectURL(img.preview)), []);

    const clearImages = (toRemove) => toRemove.forEach((img) => URL.revokeObjectURL(img.preview));

    const handleFiles = (e) => {
        const picked = Array.from(e.target.files || []);
        e.target.value = ''; // allow picking the same file again later
        setError('');

        if (images.length + picked.length > MAX_IMAGES) {
            setError(`You can attach at most ${MAX_IMAGES} images`);
            return;
        }
        for (const file of picked) {
            if (!file.type.startsWith('image/')) {
                setError('Only image files are allowed');
                return;
            }
            if (file.size > MAX_IMAGE_BYTES) {
                setError('Each image must be 5MB or smaller');
                return;
            }
        }
        setImages([...images, ...picked.map((file) => ({ file, preview: URL.createObjectURL(file) }))]);
    };

    const removeImage = (index) => {
        clearImages([images[index]]);
        setImages(images.filter((_, i) => i !== index));
    };

    const trimmed = text.trim();
    const canPost = !posting && (trimmed || images.length > 0) && text.length <= MAX_TEXT_LENGTH;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canPost) return;

        const formData = new FormData();
        formData.append('text', trimmed);
        images.forEach((img) => formData.append('images', img.file));

        setPosting(true);
        setError('');
        try {
            const res = await API.post('/posts', formData);
            onPostCreated(res.data);
            setText('');
            clearImages(images);
            setImages([]);
        } catch (err) {
            setError(err.response?.data?.message || 'Could not publish your post');
        }
        setPosting(false);
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="relative overflow-hidden rounded-xl border border-white/10 bg-[#071426]/70 p-4 backdrop-blur-md sm:p-5"
        >
            <div className="absolute left-0 top-0 h-full w-1 bg-[#E21B23]" />

            <div className="flex gap-3">
                <Avatar name={user?.name} photo={user?.profilePhoto} />

                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Share a win, a drill, or what you're training for..."
                    rows={3}
                    maxLength={MAX_TEXT_LENGTH}
                    className="min-w-0 flex-1 resize-y bg-transparent text-sm leading-6 text-white outline-none placeholder:text-white/25"
                />
            </div>

            {/* ================= IMAGE PREVIEWS ================= */}
            {images.length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {images.map((img, i) => (
                        <div key={img.preview} className="relative">
                            <img src={img.preview} alt={`Selected ${i + 1}`} className="aspect-square w-full rounded-lg border border-white/10 object-cover" />
                            <button
                                type="button"
                                onClick={() => removeImage(i)}
                                aria-label="Remove image"
                                className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-md bg-black/70 text-xs text-white transition-colors hover:bg-[#E21B23]"
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {error && (
                <p className="mt-3 text-xs text-[#FF2A2A]">{error}</p>
            )}

            {/* ================= ACTIONS ================= */}
            <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
                <div className="flex items-center gap-3">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFiles}
                        className="hidden"
                    />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={images.length >= MAX_IMAGES}
                        className="rounded-lg border border-white/15 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.15em] text-white/60 transition-colors hover:border-[#FF2A2A] hover:text-[#FF2A2A] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        + Photo
                    </button>
                    <span className={`text-[10px] tabular-nums ${text.length > MAX_TEXT_LENGTH * 0.9 ? 'text-[#FF2A2A]' : 'text-white/25'}`}>
                        {text.length}/{MAX_TEXT_LENGTH}
                    </span>
                </div>

                <button
                    type="submit"
                    disabled={!canPost}
                    className="rounded-lg bg-[#E21B23] px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.18em] text-white transition-all duration-300 hover:bg-[#FF2A2A] hover:shadow-[0_0_25px_rgba(226,27,35,0.25)] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:shadow-none sm:px-6 sm:text-xs"
                >
                    {posting ? 'Posting...' : 'Post'}
                </button>
            </div>
        </form>
    );
};

export default CreatePost;
