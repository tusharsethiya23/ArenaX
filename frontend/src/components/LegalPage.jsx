// LegalPage.jsx
// Shared layout for the public Privacy Policy and Terms pages (readable when
// logged out; Google's sign-in setup links to them).

import { Link } from 'react-router-dom';

const UPDATED = '24 October 2026';
const CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL;

// "email us at x" when VITE_CONTACT_EMAIL is set, otherwise a generic line
export const Contact = () => (CONTACT_EMAIL
    ? <>email us at <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-ink underline">{CONTACT_EMAIL}</a></>
    : <>contact the ArenaX team</>);

export const Section = ({ title, children }) => (
    <section className="space-y-3">
        <h2 className="text-xl font-bold tracking-tight">{title}</h2>
        {children}
    </section>
);

const LegalPage = ({ title, children }) => (
    <div className="page max-w-3xl">
        <article className="card space-y-8 text-[15px] leading-7 text-ink/85 sm:p-10 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5">
            <header>
                <h1 className="text-4xl font-black tracking-tight text-ink">{title}</h1>
                <p className="mt-2 text-sm text-muted">Last updated {UPDATED}</p>
            </header>
            {children}
            <footer className="flex flex-wrap gap-4 border-t border-line pt-6 text-sm">
                <Link to="/privacy" className="font-semibold text-ink hover:underline">Privacy Policy</Link>
                <Link to="/terms" className="font-semibold text-ink hover:underline">Terms of Service</Link>
                <Link to="/" className="text-muted hover:text-ink">Back to ArenaX</Link>
            </footer>
        </article>
    </div>
);

export default LegalPage;
