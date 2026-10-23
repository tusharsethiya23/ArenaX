// useDismiss.js
// Closes a popup (dropdown, panel) when the user clicks outside of `ref`
// or presses Escape. Only listens while the popup is open.

import { useEffect } from 'react';

const useDismiss = (ref, open, onClose) => {
    useEffect(() => {
        if (!open) return;

        const handlePointer = (e) => {
            if (ref.current && !ref.current.contains(e.target)) onClose();
        };
        const handleKey = (e) => {
            if (e.key === 'Escape') onClose();
        };

        document.addEventListener('mousedown', handlePointer);
        document.addEventListener('touchstart', handlePointer);
        document.addEventListener('keydown', handleKey);
        return () => {
            document.removeEventListener('mousedown', handlePointer);
            document.removeEventListener('touchstart', handlePointer);
            document.removeEventListener('keydown', handleKey);
        };
    }, [ref, open, onClose]);
};

export default useDismiss;
