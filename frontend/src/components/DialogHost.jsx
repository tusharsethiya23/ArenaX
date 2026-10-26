// DialogHost.jsx
// Draws the confirm popup and the toast messages requested through
// utils/dialogs.js. Rendered once in App.

import { useSyncExternalStore } from 'react';
import { AlertTriangle, CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import Modal from './Modal';
import { subscribe, getSnapshot, answerConfirm, dismissToast } from '../utils/dialogs';

const TOAST_ICON = {
    success: <CheckCircle2 size={18} className="shrink-0 text-data-mint" />,
    error: <AlertCircle size={18} className="shrink-0 text-danger" />,
    info: <Info size={18} className="shrink-0 text-accent" />,
};

const DialogHost = () => {
    const { confirm, toasts } = useSyncExternalStore(subscribe, getSnapshot);

    return (
        <>
            {/* ---------- Confirm ---------- */}
            {confirm && (
                <Modal
                    alert
                    title={confirm.title}
                    description={confirm.message}
                    onClose={() => answerConfirm(false)}
                    icon={confirm.danger && (
                        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-danger/15 text-danger">
                            <AlertTriangle size={22} />
                        </span>
                    )}
                >
                    <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row">
                        <button onClick={() => answerConfirm(false)} className="btn btn-soft flex-1">
                            {confirm.cancelLabel || 'Cancel'}
                        </button>
                        <button
                            data-autofocus
                            onClick={() => answerConfirm(true)}
                            className={`btn flex-1 ${confirm.danger ? 'bg-danger text-on-ink hover:bg-danger/90' : 'btn-dark'}`}
                        >
                            {confirm.confirmLabel || 'Confirm'}
                        </button>
                    </div>
                </Modal>
            )}

            {/* ---------- Toasts (above the mobile tab bar) ---------- */}
            <div className="pointer-events-none fixed inset-x-0 bottom-20 z-70 flex flex-col items-center gap-2 px-4 md:bottom-6">
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        role={t.tone === 'error' ? 'alert' : 'status'}
                        className="toast-in pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl border border-line bg-popover py-3 pl-4 pr-2 text-sm font-medium shadow-[0_16px_40px_rgba(0,0,0,0.45)]"
                    >
                        {TOAST_ICON[t.tone] || TOAST_ICON.info}
                        <p className="min-w-0 flex-1">{t.message}</p>
                        <button onClick={() => dismissToast(t.id)} aria-label="Dismiss" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-canvas hover:text-ink">
                            <X size={15} />
                        </button>
                    </div>
                ))}
            </div>
        </>
    );
};

export default DialogHost;
