// AuthLayout.jsx
// Shared layout for Login, Register and Brand login. On large screens the
// form card sits next to a black hero panel (same style as the Discover
// hero); on small screens it's just the logo and the card.

import { Link } from 'react-router-dom';
import Logo from './Logo';
import StadiumArt from './StadiumArt';

const AuthLayout = ({ title, subtitle, children, footer }) => (
    <div className="mx-auto grid min-h-[calc(100dvh-80px)] w-full max-w-[1440px] gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:px-10">

        {/* ---------- Hero panel (large screens only) ---------- */}
        <div className="relative hidden overflow-hidden rounded-[32px] bg-ink p-10 lg:flex lg:flex-col lg:justify-end">
            <StadiumArt className="left-[35%]" />
            <div className="relative">
                <span className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 py-1.5 pl-1.5 pr-4 text-sm font-medium text-white">
                    <span className="h-6 w-6 rounded-full bg-lime" />
                    Coaches, athletes and brands
                </span>
                <h2 className="text-6xl font-black leading-[0.95] tracking-tighter text-white xl:text-7xl">
                    Train with<br /><span className="text-lime">the best.</span>
                </h2>
            </div>
        </div>

        {/* ---------- Form ---------- */}
        <div className="flex flex-col items-center justify-center">
            <div className="w-full max-w-md">
                <div className="mb-6 lg:hidden">
                    <Logo />
                </div>
                <div className="card sm:p-8">
                    <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
                    {subtitle && <p className="page-subtitle">{subtitle}</p>}
                    <div className="mt-6">{children}</div>
                </div>
                {footer && <div className="mt-5 space-y-2 px-2 text-sm text-muted">{footer}</div>}
                <p className="mt-4 px-2 text-xs text-muted">
                    By continuing you agree to our{' '}
                    <Link to="/terms" className="underline hover:text-ink">Terms</Link> and{' '}
                    <Link to="/privacy" className="underline hover:text-ink">Privacy Policy</Link>.
                </p>
            </div>
        </div>
    </div>
);

export default AuthLayout;
