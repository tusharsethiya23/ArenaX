// StadiumArt.jsx
// Decorative floodlit-stadium backdrop drawn with CSS gradients (no image
// files): night sky, two floodlights, a striped pitch and (optionally) a
// player silhouette and a fade into black on the left so text can sit on top.
// Purely visual, so it's hidden from screen readers.

const StadiumArt = ({ className = '', silhouette = true, fade = true }) => (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
        {/* Sky */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#16213F] via-[#2D4F7B] to-[#2E6B3F]" />

        {/* Floodlights */}
        <div className="absolute left-[12%] top-[2%] h-28 w-56 rounded-full bg-white/60 blur-3xl" />
        <div className="absolute right-[6%] top-[0%] h-24 w-52 rounded-full bg-white/50 blur-3xl" />

        {/* Pitch with mowing stripes */}
        <div
            className="absolute inset-x-0 bottom-0 h-[42%]"
            style={{
                background:
                    'repeating-linear-gradient(90deg, #2F7A35 0 9%, #2A6E30 9% 18%)',
            }}
        />
        <div className="absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-b from-transparent to-black/40" />

        {/* Player silhouette */}
        {silhouette && (
            <div className="absolute bottom-0 left-[16%] flex flex-col items-center">
                <div className="h-16 w-16 rounded-full bg-[#141821] sm:h-20 sm:w-20" />
                <div className="mt-2 h-40 w-36 rounded-t-[64px] bg-[#141821] sm:h-48 sm:w-44" />
            </div>
        )}

        {/* Fade to black on the left, where a headline sits */}
        {fade && <div className="absolute inset-0 bg-gradient-to-r from-panel via-panel/40 to-transparent" />}
    </div>
);

export default StadiumArt;
