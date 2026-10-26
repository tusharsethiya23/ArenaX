// ImageCarousel.jsx
// A post's photos, one at a time: swipe (or the arrows on desktop) to move,
// a "1/4" counter top-right, and the post's location tag bottom-left.
// Uses CSS scroll-snap, so touch swiping works natively.

import { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react';

const ImageCarousel = ({ images, location }) => {
    const [index, setIndex] = useState(0);
    const trackRef = useRef(null);
    const many = images.length > 1;

    const goTo = (i) => {
        const track = trackRef.current;
        if (track) track.scrollTo({ left: i * track.clientWidth, behavior: 'smooth' });
    };

    // Keep the counter in sync with swipes
    const handleScroll = () => {
        const track = trackRef.current;
        if (track) setIndex(Math.round(track.scrollLeft / track.clientWidth));
    };

    return (
        <div className="group relative overflow-hidden rounded-xl bg-canvas">
            <div
                ref={trackRef}
                onScroll={handleScroll}
                className="flex aspect-[16/9] snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
                {/* Plain images: clicking a photo does nothing */}
                {images.map((src, i) => (
                    <img
                        key={src}
                        src={src}
                        alt={`Photo ${i + 1} of ${images.length}`}
                        loading="lazy"
                        draggable={false}
                        className="h-full w-full shrink-0 snap-center object-cover"
                    />
                ))}
            </div>

            {many && (
                <>
                    <span className="badge absolute right-3 top-3 bg-panel/80 text-white">{index + 1} / {images.length}</span>
                    {index > 0 && (
                        <button onClick={() => goTo(index - 1)} aria-label="Previous photo" className="absolute left-3 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-popover shadow group-hover:flex">
                            <ChevronLeft size={18} />
                        </button>
                    )}
                    {index < images.length - 1 && (
                        <button onClick={() => goTo(index + 1)} aria-label="Next photo" className="absolute right-3 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-popover shadow group-hover:flex">
                            <ChevronRight size={18} />
                        </button>
                    )}
                </>
            )}

            {location && (
                <span className="absolute bottom-3 left-3 inline-flex max-w-[calc(100%-1.5rem)] items-center gap-1.5 truncate rounded-full bg-popover px-3 py-1.5 text-sm font-semibold">
                    <MapPin size={14} className="shrink-0 text-accent" /> {location}
                </span>
            )}
        </div>
    );
};

export default ImageCarousel;
