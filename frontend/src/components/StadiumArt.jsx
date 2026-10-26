// StadiumArt.jsx
// Black-and-white sports photo used as a card backdrop (auth pages, coach
// profile header, Discover hero and promo, feed profile card, tournament
// cards), dimmed with a flat dark layer so text on top stays readable.
// Photos live in public/images (credits in public/images/CREDITS.md).
// Purely visual, so it's hidden from screen readers.
// Inside a card that has content on top, give the card `isolate` and pass
// className="-z-10" so the photo sits behind the content without moving it.

const StadiumArt = ({ className = '', src = '/images/stadium-night.jpg', dim = 'bg-black/55', position = 'object-center' }) => (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
        <img src={src} alt="" loading="lazy" className={`photo h-full w-full ${position}`} />
        {dim && <div className={`absolute inset-0 ${dim}`} />}
    </div>
);

export default StadiumArt;
