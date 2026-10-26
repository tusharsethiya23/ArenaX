// StadiumArt.jsx
// Black-and-white sports photo used as a backdrop (auth pages, coach profile
// header), dimmed with a flat dark layer so text on top stays readable.
// Photos live in public/images (credits in public/images/CREDITS.md).
// Purely visual, so it's hidden from screen readers.

const StadiumArt = ({ className = '', src = '/images/stadium.jpg', dim = 'bg-black/55' }) => (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
        <img src={src} alt="" className="photo h-full w-full" />
        {dim && <div className={`absolute inset-0 ${dim}`} />}
    </div>
);

export default StadiumArt;
