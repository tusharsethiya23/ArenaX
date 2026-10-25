// dialogs.js
// In-app replacements for the browser's confirm() and alert() boxes, usable
// from anywhere (components, hooks, plain functions):
//   if (!(await confirmDialog({ title: 'Delete post?', danger: true }))) return;
//   toast('Team registered!', 'success');
//   toast(err.response?.data?.message || 'Something went wrong', 'error');
// DialogHost.jsx (rendered once in App) draws them.

let state = { confirm: null, toasts: [] };
const listeners = new Set();
const set = (next) => { state = { ...state, ...next }; listeners.forEach((l) => l()); };

export const subscribe = (listener) => { listeners.add(listener); return () => listeners.delete(listener); };
export const getSnapshot = () => state;

// Opens the confirm popup; resolves true (confirmed) or false (cancelled).
// Options: title, message, confirmLabel ('Confirm'), cancelLabel ('Cancel'),
// danger (red confirm button for deletes and other permanent actions)
export const confirmDialog = (options) => new Promise((resolve) => {
    state.confirm?.resolve(false); // a newer question replaces an unanswered one
    set({ confirm: { ...options, resolve } });
});

export const answerConfirm = (answer) => {
    state.confirm?.resolve(answer);
    set({ confirm: null });
};

// Short message at the bottom of the screen that goes away on its own.
// tone: 'success' | 'error' | 'info'
let nextId = 1;
export const toast = (message, tone = 'info') => {
    const id = nextId++;
    set({ toasts: [...state.toasts, { id, message, tone }].slice(-3) }); // at most 3 on screen
    setTimeout(() => dismissToast(id), tone === 'error' ? 6000 : 4000);
};

export const dismissToast = (id) => set({ toasts: state.toasts.filter((t) => t.id !== id) });

// The usual error toast after a failed API call
export const toastError = (err, fallback = 'Something went wrong') =>
    toast(err?.response?.data?.message || fallback, 'error');
