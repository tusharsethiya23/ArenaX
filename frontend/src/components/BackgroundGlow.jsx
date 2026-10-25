// BackgroundGlow.jsx
// The soft "Smoke + Ember" glows behind the whole app: three large blurred
// circles fixed to the viewport. They sit behind all content (-z-10) and
// ignore the mouse, so nothing about the layout or clicks changes. The glass
// cards (bg-surface / .card) blur whatever glow is behind them.

const BackgroundGlow = () => (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        {/* Main ember glow, top centre-right */}
        <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] rounded-full bg-ember/35 blur-[120px]" />
        {/* Mauve glow, bottom left */}
        <div className="absolute -bottom-40 -left-32 h-[480px] w-[480px] rounded-full bg-mauve/35 blur-[120px]" />
        {/* Faint ember glow, bottom right */}
        <div className="absolute -right-32 bottom-0 h-[420px] w-[420px] rounded-full bg-ember/20 blur-[120px]" />
    </div>
);

export default BackgroundGlow;
