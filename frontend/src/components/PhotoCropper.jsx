// PhotoCropper.jsx
// Popup for adjusting a new profile photo before it is uploaded:
//   - drag the photo (mouse or finger) to choose what sits inside the circle
//   - zoom with the slider, the mouse wheel, a two-finger pinch, or + / -
//   - arrow keys nudge the photo when the crop area has focus
//   - live previews show how it will look as an avatar
// "Save photo" cuts out the square under the circle (512 x 512 JPEG) and
// passes it to onSave as a File.

import { useState, useEffect, useRef } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Move } from 'lucide-react';
import Modal from './Modal';

const BOX = 280;       // crop area size in px (the circle fills it)
const OUTPUT = 512;    // saved image size in px
const MAX_ZOOM = 4;

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

const PhotoCropper = ({ file, onCancel, onSave, saving }) => {
    const [src, setSrc] = useState(null);
    const [img, setImg] = useState(null);        // { el, w, h } once loaded
    const [zoom, setZoom] = useState(1);         // 1 = photo just covers the circle
    const [pos, setPos] = useState({ x: 0, y: 0 }); // photo's top-left corner inside the box
    const [error, setError] = useState('');
    const boxRef = useRef(null);
    const pointers = useRef(new Map());          // active pointers (for drag and pinch)
    const gesture = useRef(null);

    // Read the chosen file
    useEffect(() => {
        const url = URL.createObjectURL(file);
        const el = new Image();
        el.onload = () => {
            setSrc(url);
            const w = el.naturalWidth;
            const h = el.naturalHeight;
            const s = Math.max(BOX / w, BOX / h);
            setImg({ el, w, h });
            setZoom(1);
            setPos({ x: (BOX - w * s) / 2, y: (BOX - h * s) / 2 });
        };
        el.onerror = () => setError('This file could not be opened as an image. Try a JPG or PNG.');
        el.src = url;
        return () => URL.revokeObjectURL(url);
    }, [file]);

    const cover = img ? Math.max(BOX / img.w, BOX / img.h) : 1;
    const scale = cover * zoom;

    // Keep the photo covering the whole circle (no empty corners)
    const fit = (p, s) => img ? {
        x: clamp(p.x, BOX - img.w * s, 0),
        y: clamp(p.y, BOX - img.h * s, 0),
    } : p;

    // Zoom around a point in the box (the centre by default), keeping that point still
    const zoomTo = (nextZoom, at = { x: BOX / 2, y: BOX / 2 }) => {
        if (!img) return;
        const z = clamp(nextZoom, 1, MAX_ZOOM);
        const newS = cover * z;
        setPos(fit({
            x: at.x - ((at.x - pos.x) / scale) * newS,
            y: at.y - ((at.y - pos.y) / scale) * newS,
        }, newS));
        setZoom(z);
    };

    // Mouse wheel zoom. Needs a non-passive listener (to stop the page
    // scrolling), added once; it calls the latest zoomTo through a ref.
    const wheelZoom = useRef(null);
    useEffect(() => {
        wheelZoom.current = (e) => {
            const r = boxRef.current.getBoundingClientRect();
            zoomTo(zoom * (e.deltaY < 0 ? 1.08 : 1 / 1.08), { x: e.clientX - r.left, y: e.clientY - r.top });
        };
    });
    useEffect(() => {
        const box = boxRef.current;
        if (!box) return;
        const onWheel = (e) => { e.preventDefault(); wheelZoom.current?.(e); };
        box.addEventListener('wheel', onWheel, { passive: false });
        return () => box.removeEventListener('wheel', onWheel);
    }, [img]);

    // ---------- Drag (one pointer) and pinch (two pointers) ----------
    const startGesture = () => {
        const pts = [...pointers.current.values()];
        gesture.current = pts.length === 1
            ? { type: 'drag', start: pts[0], pos }
            : { type: 'pinch', dist: Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y), zoom };
    };
    const onPointerDown = (e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        startGesture();
    };
    const onPointerMove = (e) => {
        if (!pointers.current.has(e.pointerId)) return;
        pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        const g = gesture.current;
        const pts = [...pointers.current.values()];
        if (g?.type === 'drag' && pts.length === 1) {
            setPos(fit({ x: g.pos.x + pts[0].x - g.start.x, y: g.pos.y + pts[0].y - g.start.y }, scale));
        } else if (g?.type === 'pinch' && pts.length === 2) {
            const r = boxRef.current.getBoundingClientRect();
            const mid = { x: (pts[0].x + pts[1].x) / 2 - r.left, y: (pts[0].y + pts[1].y) / 2 - r.top };
            zoomTo(g.zoom * (Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) / g.dist), mid);
        }
    };
    const onPointerUp = (e) => {
        pointers.current.delete(e.pointerId);
        if (pointers.current.size) startGesture(); else gesture.current = null;
    };

    // ---------- Keyboard ----------
    const onKeyDown = (e) => {
        const step = e.shiftKey ? 30 : 10;
        const moves = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
        if (moves[e.key]) {
            e.preventDefault();
            setPos((p) => fit({ x: p.x + moves[e.key][0], y: p.y + moves[e.key][1] }, scale));
        } else if (e.key === '+' || e.key === '=') zoomTo(zoom + 0.2);
        else if (e.key === '-') zoomTo(zoom - 0.2);
    };

    const reset = () => {
        setZoom(1);
        setPos({ x: (BOX - img.w * cover) / 2, y: (BOX - img.h * cover) / 2 });
    };

    // Cut out the square under the circle
    const save = () => {
        const canvas = document.createElement('canvas');
        canvas.width = OUTPUT;
        canvas.height = OUTPUT;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img.el, -pos.x / scale, -pos.y / scale, BOX / scale, BOX / scale, 0, 0, OUTPUT, OUTPUT);
        canvas.toBlob((blob) => {
            if (!blob) { setError('Could not prepare the photo. Please try another one.'); return; }
            onSave(new File([blob], 'profile.jpg', { type: 'image/jpeg' }));
        }, 'image/jpeg', 0.9);
    };

    // The photo drawn at any size (crop area or a small preview)
    const photo = (size) => {
        const k = size / BOX;
        return (
            <img
                src={src}
                alt=""
                draggable={false}
                className="pointer-events-none absolute left-0 top-0 max-w-none origin-top-left select-none"
                style={{ width: img.w, height: img.h, transform: `translate(${pos.x * k}px, ${pos.y * k}px) scale(${scale * k})` }}
            />
        );
    };

    return (
        <Modal
            title="Adjust your photo"
            description="Drag to reposition. Zoom with the slider, mouse wheel or a pinch."
            onClose={saving ? () => {} : onCancel}
            className="max-w-md"
        >
            {error ? (
                <p className="alert-error">{error}</p>
            ) : !img ? (
                <div className="mx-auto flex aspect-square w-70 items-center justify-center rounded-3xl bg-canvas text-sm text-muted">Loading photo...</div>
            ) : (
                <>
                    {/* ---------- Crop area: the photo, darkened outside the circle ---------- */}
                    <div
                        ref={boxRef}
                        role="application"
                        aria-label="Crop area. Use the arrow keys to move the photo and + or - to zoom."
                        tabIndex={0}
                        onPointerDown={onPointerDown}
                        onPointerMove={onPointerMove}
                        onPointerUp={onPointerUp}
                        onPointerCancel={onPointerUp}
                        onKeyDown={onKeyDown}
                        className="relative mx-auto cursor-grab touch-none overflow-hidden rounded-3xl bg-black outline-none ring-accent focus-visible:ring-2 active:cursor-grabbing"
                        style={{ width: BOX, height: BOX }}
                    >
                        {photo(BOX)}
                        <div className="pointer-events-none absolute inset-0 rounded-full shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] ring-2 ring-white/80" />
                        <span className="pointer-events-none absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white">
                            <Move size={13} /> Drag to adjust
                        </span>
                    </div>

                    {/* ---------- Zoom ---------- */}
                    <div className="mt-5 flex items-center gap-3">
                        <button type="button" onClick={() => zoomTo(zoom - 0.25)} aria-label="Zoom out" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-canvas text-ink transition-colors hover:bg-white/12">
                            <ZoomOut size={16} />
                        </button>
                        <input
                            type="range"
                            min={1}
                            max={MAX_ZOOM}
                            step={0.01}
                            value={zoom}
                            onChange={(e) => zoomTo(Number(e.target.value))}
                            aria-label="Zoom"
                            className="h-1.5 min-w-0 flex-1 cursor-pointer accent-accent"
                        />
                        <button type="button" onClick={() => zoomTo(zoom + 0.25)} aria-label="Zoom in" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-canvas text-ink transition-colors hover:bg-white/12">
                            <ZoomIn size={16} />
                        </button>
                    </div>

                    {/* ---------- Live preview at real avatar sizes ---------- */}
                    <div className="mt-5 flex items-center justify-between gap-4 rounded-2xl bg-canvas px-4 py-3">
                        <div className="flex items-end gap-3">
                            {[64, 40, 28].map((size) => (
                                <div key={size} className="relative shrink-0 overflow-hidden rounded-full ring-2 ring-white/10" style={{ width: size, height: size }}>
                                    {photo(size)}
                                </div>
                            ))}
                        </div>
                        <button type="button" onClick={reset} className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-ink">
                            <RotateCcw size={14} /> Reset
                        </button>
                    </div>
                    <p className="mt-2 text-xs text-muted">Preview: how it looks on your profile, posts and comments.</p>
                </>
            )}

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row">
                <button type="button" onClick={onCancel} disabled={saving} className="btn btn-soft flex-1">Cancel</button>
                <button type="button" data-autofocus onClick={save} disabled={!img || !!error || saving} className="btn btn-dark flex-1">
                    {saving ? 'Saving...' : 'Save photo'}
                </button>
            </div>
        </Modal>
    );
};

export default PhotoCropper;
