// MarketPlace.jsx
// Sports gear marketplace (route: /marketplace). Listings only: photos,
// title, description, condition and location. No prices or checkout;
// "Contact seller" opens a direct message about the item (/messages/:sellerId?listing=:id).
//   - search + condition filter; "All listings" or "My listings" (my own, sold too)
//   - tap a card for the full listing; sellers can mark it sold or delete it
//   - "List an item" opens a form (1-4 photos)

import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Plus, X, ImagePlus, MessageCircle, Check, Trash2, Tag } from 'lucide-react';
import API from '../api/axios';
import useMyProfile from '../hooks/useMyProfile';
import PageHeader from '../components/PageHeader';
import Avatar from '../components/Avatar';
import Modal from '../components/Modal';
import Select from '../components/Select';
import ImageCarousel from '../components/ImageCarousel';
import FoundingBadge from '../components/FoundingBadge';
import { canAccess } from '../utils/access';
import { timeAgo } from '../utils/format';
import { confirmDialog, toast, toastError } from '../utils/dialogs';

const MAX_PHOTOS = 4;
const CONDITIONS = [
    { value: 'new', label: 'New', tone: 'bg-data-mint/15 text-data-mint' },
    { value: 'like_new', label: 'Like new', tone: 'bg-data-blue/15 text-data-blue' },
    { value: 'good', label: 'Good', tone: 'bg-highlight/15 text-highlight' },
    { value: 'fair', label: 'Fair', tone: 'bg-data-pink/15 text-data-pink' },
];
const CONDITION = Object.fromEntries(CONDITIONS.map((c) => [c.value, c]));

const ConditionChip = ({ value }) => (
    <span className={`badge px-2.5 py-0.5 text-[11px] ${CONDITION[value]?.tone || 'bg-canvas text-ink'}`}>{CONDITION[value]?.label || value}</span>
);

// "Contact seller" for other people's listings; nothing for your own
const ContactButton = ({ listing, me, className = '' }) => (String(listing.seller._id) === String(me._id) ? null : (
    <Link to={`/messages/${listing.seller._id}?listing=${listing._id}`} className={`btn btn-dark ${className}`}>
        <MessageCircle size={16} /> Contact seller
    </Link>
));

// ---------- One card in the grid ----------
const ListingCard = ({ listing, me, onOpen }) => (
    <article className="flex flex-col overflow-hidden rounded-[28px] bg-surface">
        <button onClick={() => onOpen(listing)} className="relative block aspect-[4/3] w-full overflow-hidden bg-canvas text-left" aria-label={`Open ${listing.title}`}>
            <img src={listing.photos[0]} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.03]" />
            {listing.photos.length > 1 && <span className="absolute right-3 top-3 rounded-full bg-black/60 px-2 py-0.5 text-xs font-semibold text-white">1/{listing.photos.length}</span>}
            {listing.status === 'sold' && <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-xs font-bold text-on-ink">Sold</span>}
        </button>
        <div className="flex flex-1 flex-col p-5">
            <div className="flex items-start justify-between gap-3">
                <button onClick={() => onOpen(listing)} className="min-w-0 text-left">
                    <h3 className="line-clamp-2 font-bold leading-snug hover:underline">{listing.title}</h3>
                </button>
                <ConditionChip value={listing.condition} />
            </div>
            <p className="mt-1 flex items-center gap-1 text-sm text-muted">
                <MapPin size={13} className="shrink-0 text-data-pink" /> <span className="truncate">{listing.location}</span> · {timeAgo(listing.createdAt)}
            </p>
            <div className="mt-4 flex items-center gap-2.5">
                <Avatar name={listing.seller.name} photo={listing.seller.profilePhoto} pastel className="h-8 w-8 text-xs" />
                <Link to={`/profile-view/${listing.seller._id}`} className="min-w-0 truncate text-sm font-semibold hover:underline">{listing.seller.name}</Link>
                {listing.seller.foundingMember && <FoundingBadge compact />}
            </div>
            <div className="mt-auto pt-4">
                {String(listing.seller._id) === String(me._id)
                    ? <button onClick={() => onOpen(listing)} className="btn btn-soft w-full">Manage listing</button>
                    : listing.status === 'active' && <ContactButton listing={listing} me={me} className="w-full" />}
            </div>
        </div>
    </article>
);

// ---------- Full listing ----------
const ListingDetail = ({ listing, me, onClose, onChanged, onDeleted }) => {
    const mine = String(listing.seller._id) === String(me._id);
    const [busy, setBusy] = useState(false);

    const setStatus = async (status) => {
        setBusy(true);
        try { onChanged((await API.patch(`/listings/${listing._id}`, { status })).data); toast(status === 'sold' ? 'Marked as sold' : 'Listing is active again', 'success'); }
        catch (err) { toastError(err); }
        setBusy(false);
    };
    const remove = async () => {
        if (!(await confirmDialog({ title: 'Delete this listing?', message: 'It will be removed from the marketplace.', confirmLabel: 'Delete', danger: true }))) return;
        setBusy(true);
        try { await API.delete(`/listings/${listing._id}`); onDeleted(listing._id); toast('Listing deleted', 'success'); }
        catch (err) { toastError(err); setBusy(false); }
    };

    return (
        <Modal title={listing.title} onClose={onClose} className="max-w-lg">
            <ImageCarousel images={listing.photos} location={listing.location} />
            <div className="mt-4 flex flex-wrap items-center gap-2">
                <ConditionChip value={listing.condition} />
                {listing.status === 'sold' && <span className="badge bg-white px-2.5 py-0.5 text-[11px] text-on-ink">Sold</span>}
                <span className="text-xs text-muted">Listed {timeAgo(listing.createdAt)}</span>
            </div>
            {listing.description && <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-ink/85">{listing.description}</p>}
            <div className="mt-4 flex items-center gap-3 rounded-2xl bg-canvas p-3">
                <Avatar name={listing.seller.name} photo={listing.seller.profilePhoto} pastel className="h-10 w-10 text-sm" />
                <div className="min-w-0 flex-1">
                    <Link to={`/profile-view/${listing.seller._id}`} className="block truncate font-semibold hover:underline">{listing.seller.name}</Link>
                    <p className="truncate text-xs capitalize text-muted">{[listing.seller.role === 'learner' ? 'athlete' : listing.seller.role, listing.seller.location].filter(Boolean).join(' · ')}</p>
                </div>
                {listing.seller.foundingMember && <FoundingBadge compact />}
            </div>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                {mine ? (
                    <>
                        <button onClick={() => setStatus(listing.status === 'sold' ? 'active' : 'sold')} disabled={busy} className="btn btn-dark flex-1">
                            <Check size={16} /> {listing.status === 'sold' ? 'Mark as available' : 'Mark as sold'}
                        </button>
                        <button onClick={remove} disabled={busy} className="btn btn-danger flex-1"><Trash2 size={16} /> Delete</button>
                    </>
                ) : listing.status === 'active' ? (
                    <ContactButton listing={listing} me={me} className="flex-1" />
                ) : (
                    <p className="w-full rounded-2xl bg-canvas px-4 py-3 text-center text-sm text-muted">This item has been sold.</p>
                )}
            </div>
        </Modal>
    );
};

// ---------- "List an item" form ----------
const NewListingForm = ({ me, onClose, onCreated }) => {
    const [form, setForm] = useState({ title: '', description: '', condition: 'good', location: me.location || '' });
    const [photos, setPhotos] = useState([]); // [{ file, preview }]
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const photosRef = useRef(photos);
    useEffect(() => { photosRef.current = photos; }, [photos]);
    useEffect(() => () => photosRef.current.forEach((p) => URL.revokeObjectURL(p.preview)), []);

    const pick = (e) => {
        const files = [...e.target.files].filter((f) => f.type.startsWith('image/'));
        e.target.value = '';
        if (photos.length + files.length > MAX_PHOTOS) setError(`You can add at most ${MAX_PHOTOS} photos`);
        else setError('');
        setPhotos([...photos, ...files.slice(0, MAX_PHOTOS - photos.length).map((file) => ({ file, preview: URL.createObjectURL(file) }))]);
    };
    const removePhoto = (i) => {
        URL.revokeObjectURL(photos[i].preview);
        setPhotos(photos.filter((_, j) => j !== i));
    };

    const submit = async (e) => {
        e.preventDefault();
        if (!photos.length) return setError('Add at least one photo');
        setBusy(true);
        setError('');
        const data = new FormData();
        Object.entries(form).forEach(([k, v]) => data.append(k, v));
        photos.forEach((p) => data.append('photos', p.file));
        try {
            onCreated((await API.post('/listings', data, { headers: { 'Content-Type': 'multipart/form-data' } })).data);
            toast('Your item is listed', 'success');
        } catch (err) {
            setError(err.response?.data?.message || 'Could not list the item');
            setBusy(false);
        }
    };

    return (
        <Modal title="List an item" description="Pass on gear you don't use. Buyers contact you in ArenaX messages." onClose={busy ? () => {} : onClose} className="max-w-lg">
            <form onSubmit={submit} className="space-y-4">
                <div>
                    <p className="label">Photos ({photos.length}/{MAX_PHOTOS})</p>
                    <div className="grid grid-cols-4 gap-2">
                        {photos.map((p, i) => (
                            <div key={p.preview} className="relative aspect-square overflow-hidden rounded-2xl bg-canvas">
                                <img src={p.preview} alt="" className="h-full w-full object-cover" />
                                <button type="button" onClick={() => removePhoto(i)} aria-label={`Remove photo ${i + 1}`} className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white">
                                    <X size={13} />
                                </button>
                            </div>
                        ))}
                        {photos.length < MAX_PHOTOS && (
                            <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-line text-xs text-muted transition-colors hover:border-white/30 hover:text-ink focus-within:ring-2 focus-within:ring-accent">
                                <ImagePlus size={20} className="text-accent" /> Add
                                <input type="file" accept="image/*" multiple onChange={pick} className="sr-only" />
                            </label>
                        )}
                    </div>
                </div>
                <div>
                    <label className="label" htmlFor="listing-title">Title</label>
                    <input id="listing-title" data-autofocus value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={80} required placeholder="e.g. Cricket bat, English willow" className="input" />
                </div>
                <div>
                    <label className="label" htmlFor="listing-description">Description</label>
                    <textarea id="listing-description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={1000} rows={3} placeholder="Size, how much it's been used, anything a buyer should know" className="input resize-none" />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <p className="label">Condition</p>
                        <Select aria-label="Condition" value={form.condition} onChange={(condition) => setForm({ ...form, condition })} options={CONDITIONS.map(({ value, label }) => ({ value, label }))} />
                    </div>
                    <div>
                        <label className="label" htmlFor="listing-location">Location</label>
                        <input id="listing-location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} maxLength={80} required placeholder="City" className="input" />
                    </div>
                </div>
                {error && <p className="alert-error">{error}</p>}
                <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row">
                    <button type="button" onClick={onClose} disabled={busy} className="btn btn-soft flex-1">Cancel</button>
                    <button type="submit" disabled={busy} className="btn btn-dark flex-1">{busy ? 'Listing...' : 'List item'}</button>
                </div>
            </form>
        </Modal>
    );
};

// ---------- Page ----------
const Marketplace = () => {
    const { profile: user } = useMyProfile(); // full profile: the form starts with your city
    const [tab, setTab] = useState('all'); // 'all' | 'mine'
    const [query, setQuery] = useState('');
    const [condition, setCondition] = useState('');
    const [listings, setListings] = useState(null);
    const [error, setError] = useState('');
    const [open, setOpen] = useState(null);
    const [creating, setCreating] = useState(false);
    const canList = canAccess(user, 'marketplaceListing');

    const load = useCallback(() => {
        const params = new URLSearchParams();
        if (tab === 'mine') params.set('mine', '1');
        if (query.trim()) params.set('q', query.trim());
        if (condition) params.set('condition', condition);
        return API.get(`/listings?${params}`)
            .then((res) => { setListings(res.data); setError(''); })
            .catch((err) => setError(err.response?.data?.message || 'Could not load the marketplace'));
    }, [tab, query, condition]);

    // Search waits for a pause in typing
    useEffect(() => {
        const t = setTimeout(load, query ? 300 : 0);
        return () => clearTimeout(t);
    }, [load, query]);

    const replace = (updated) => {
        setListings((list) => list.map((l) => (l._id === updated._id ? updated : l)).filter((l) => tab === 'mine' || l.status === 'active'));
        setOpen(updated);
    };

    return (
        <div className="page">
            <PageHeader
                title="Marketplace"
                subtitle="Pass on sports gear you don't use, and find gear from athletes and coaches near you."
                action={canList && <button onClick={() => setCreating(true)} className="btn btn-dark"><Plus size={18} /> List an item</button>}
            />

            {/* ---------- Filters ---------- */}
            <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center">
                <div className="flex gap-2">
                    {[['all', 'All listings'], ['mine', 'My listings']].map(([id, label]) => (
                        <button key={id} onClick={() => setTab(id)} className={`chip ${tab === id ? 'chip-active' : ''}`}>{label}</button>
                    ))}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row md:justify-end">
                    <label className="flex min-w-0 items-center gap-2 rounded-full bg-canvas px-4 sm:w-72">
                        <Search size={17} className="shrink-0 text-accent" />
                        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search gear or city" aria-label="Search listings" className="w-full bg-transparent py-2.5 text-sm outline-none placeholder:text-muted" />
                    </label>
                    <div className="sm:w-44">
                        <Select aria-label="Condition" value={condition} onChange={setCondition} options={[{ value: '', label: 'Any condition' }, ...CONDITIONS.map(({ value, label }) => ({ value, label }))]} />
                    </div>
                </div>
            </div>

            {error ? (
                <p className="alert-error">{error}</p>
            ) : listings === null ? (
                <p className="empty-state">Loading listings...</p>
            ) : listings.length === 0 ? (
                <div className="card flex flex-col items-center py-12 text-center">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-data-mint/15 text-data-mint"><Tag size={24} /></span>
                    <p className="mt-4 font-semibold">{tab === 'mine' ? "You haven't listed anything yet" : 'No listings match'}</p>
                    <p className="mt-1 max-w-xs text-sm text-muted">{tab === 'mine' ? 'Got gear you no longer use? List it in a minute.' : 'Try another search, or list something yourself.'}</p>
                    {canList && <button onClick={() => setCreating(true)} className="btn btn-dark mt-5"><Plus size={18} /> List an item</button>}
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                    {listings.map((l) => <ListingCard key={l._id} listing={l} me={user} onOpen={setOpen} />)}
                </div>
            )}

            {open && (
                <ListingDetail
                    key={open._id}
                    listing={open}
                    me={user}
                    onClose={() => setOpen(null)}
                    onChanged={replace}
                    onDeleted={(id) => { setListings((list) => list.filter((l) => l._id !== id)); setOpen(null); }}
                />
            )}
            {creating && (
                <NewListingForm
                    me={user}
                    onClose={() => setCreating(false)}
                    onCreated={(listing) => { setCreating(false); setTab('mine'); setListings((list) => [listing, ...(list || [])]); }}
                />
            )}
        </div>
    );
};

export default Marketplace;
