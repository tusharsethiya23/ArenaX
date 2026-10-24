// OrDivider.jsx
// "—— or ——" line between "Continue with Google" and the email form.

const OrDivider = () => (
    <div className="my-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-muted" role="separator">
        <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
    </div>
);

export default OrDivider;
