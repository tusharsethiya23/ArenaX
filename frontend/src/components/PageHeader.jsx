// PageHeader.jsx
// Title row used at the top of most pages: big title, optional subtitle,
// and an optional action (button/link) on the right.

const PageHeader = ({ title, subtitle, action }) => (
    <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
            <h1 className="page-title">{title}</h1>
            {subtitle && <p className="page-subtitle">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
    </div>
);

export default PageHeader;
