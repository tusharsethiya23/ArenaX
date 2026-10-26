// LevelChip.jsx
// Small "Beginner" / "Intermediate" / "Advanced" label for a drill.

import { LEVEL_STYLE } from '../../utils/drills';

const LevelChip = ({ level }) => (
    <span className={`badge px-2 py-0.5 text-[10px] uppercase tracking-wider ${LEVEL_STYLE[level].chip}`}>{LEVEL_STYLE[level].label}</span>
);

export default LevelChip;
