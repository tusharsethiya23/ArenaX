// StadiumArt.jsx
// Decorative floodlit-stadium backdrop drawn with CSS gradients (no image
// files): night sky, two floodlights, a striped pitch and a player
// silhouette, fading into black on the left so text can sit on top.
// Purely visual, so it's hidden from screen readers.

const StadiumArt = ({ className = '' }) => (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
        {/* Sky */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#2B3A66] via-[#2D4F6B] to-[#2E6B3F]" />

        {/* Floodlights */}
        <div className="absolute left-[18%] top-[6%] h-28 w-56 rounded-full bg-white/70 blur-3xl" />
        <div className="absolute right-[6%] top-[4%] h-24 w-52 rounded-full bg-white/60 blur-3xl" />

        {/* Pitch with mowing stripes */}
        <div
            className="absolute inset-x-0 bottom-0 h-[42%]"
            style={{
                background:
                    'repeating-linear-gradient(90deg, #2F7A35 0 9%, #2A6E30 9% 18%)',
            }}
        />

        {/* Player silhouette */}
        <div className="absolute bottom-0 left-[16%] flex flex-col items-center">
            <div className="h-16 w-16 rounded-full bg-[#141821] sm:h-20 sm:w-20" />
            <div className="mt-2 h-40 w-36 rounded-t-[64px] bg-[#141821] sm:h-48 sm:w-44" />
        </div>

        {/* Fade to black on the left, where the headline sits */}
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/40 to-transparent" />
    </div>
);

export default StadiumArt;
