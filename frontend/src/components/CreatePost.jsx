import { useState, useEffect, useRef } from 'react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { ImagePlus, X, MapPin } from 'lucide-react';
import Avatar from './Avatar';

// Keep in sync with Backend/models/post.model.js and upload.middleware.js
const MAX_TEXT_LENGTH = 2000;
const MAX_IMAGES = 4;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_LOCATION_LENGTH = 80;

const CreatePost = ({ onPostCreated }) => {
    const { user } = useAuth();
    const [text, setText] = useState('');
    const [location, setLocation] = useState('');
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
        if (location.trim()) formData.append('location', location.trim());
        images.forEach((img) => formData.append('images', img.file));

        setPosting(true);
        setError('');
        try {
            const res = await API.post('/posts', formData);
            onPostCreated(res.data);
            setText('');
            setLocation('');
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
            className="card"
        >
            <div className="flex gap-3">
                <Avatar name={user?.name} photo={user?.profilePhoto} className="h-11 w-11 text-sm" />

                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Share a win, a drill, or what you're training for..."
                    rows={3}
                    maxLength={MAX_TEXT_LENGTH}
                    className="min-w-0 flex-1 resize-y bg-transparent pt-2.5 text-[15px] leading-6 text-ink outline-none placeholder:text-muted"
                />
            </div>

            {/* ================= IMAGE PREVIEWS ================= */}
            {images.length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {images.map((img, i) => (
                        <div key={img.preview} className="relative">
                            <img src={img.preview} alt={`Selected ${i + 1}`} className="aspect-square w-full rounded-2xl object-cover" />
                            <button
                                type="button"
                                onClick={() => removeImage(i)}
                                aria-label="Remove image"
                                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-panel/80 text-white transition-colors hover:bg-panel"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Optional place tag, shown on the photo in the feed */}
            <label className="mt-4 flex items-center gap-2 rounded-2xl bg-canvas px-4 py-2.5">
                <MapPin size={16} className="shrink-0 text-muted" />
                <input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    maxLength={MAX_LOCATION_LENGTH}
                    placeholder="Add a location (optional), e.g. Holkar Ground, Indore"
                    aria-label="Location"
                    className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
                />
            </label>

            {error && (
                <p className="alert-error mt-3">{error}</p>
            )}

            {/* ================= ACTIONS ================= */}
            <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-4">
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
                        className="btn btn-soft px-4"
                    >
                        <ImagePlus size={16} /> Photo
                    </button>
                    <span className={`text-xs tabular-nums ${text.length > MAX_TEXT_LENGTH * 0.9 ? 'text-danger' : 'text-muted'}`}>
                        {text.length}/{MAX_TEXT_LENGTH}
                    </span>
                </div>

                <button
                    type="submit"
                    disabled={!canPost}
                    className="btn btn-dark px-6"
                >
                    {posting ? 'Posting...' : 'Post'}
                </button>
            </div>
        </form>
    );
};

export default CreatePost;
