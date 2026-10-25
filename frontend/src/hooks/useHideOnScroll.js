// useHideOnScroll.js
// true while the navbar should be hidden: it slides away as you scroll down
// the page, and comes back as soon as you scroll up even a little. Near the
// top of the page it is always shown.

import { useEffect, useState } from 'react';

const TOP_ZONE = 80;   // always visible within this many px of the top
const HIDE_AFTER = 6;  // px scrolled down in one go before hiding (ignores jitter)

const useHideOnScroll = () => {
    const [hidden, setHidden] = useState(false);

    useEffect(() => {
        let lastY = window.scrollY;
        let frame = 0;

        const update = () => {
            frame = 0;
            const y = window.scrollY;
            if (y < TOP_ZONE) setHidden(false);
            else if (y < lastY) setHidden(false);              // any upward scroll: show
            else if (y - lastY > HIDE_AFTER) setHidden(true);  // scrolling down: hide
            else return; // tiny downward move: wait, compare against the same lastY
            lastY = y;
        };
        // At most one update per frame
        const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };

        window.addEventListener('scroll', onScroll, { passive: true });
        return () => {
            window.removeEventListener('scroll', onScroll);
            cancelAnimationFrame(frame);
        };
    }, []);

    return hidden;
};

export default useHideOnScroll;
