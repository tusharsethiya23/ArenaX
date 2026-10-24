// AuthLayout.jsx
// Shared layout for Login, Register and Brand login. On large screens the
// form card sits next to a tall black hero panel (same style as the Discover
// hero). On phones and tablets a short version of that hero sits above the
// card (the navbar already shows the logo, so it isn't repeated here).

import { Link } from 'react-router-dom';
import StadiumArt from './StadiumArt';

const Tagline = () => (
    <span className="inline-flex items-center gap-2 rounded-full bg-white/10 py-1.5 pl-1.5 pr-4 text-sm font-medium text-white backdrop-blur-sm">
        <span className="h-5 w-5 rounded-full bg-lime lg:h-6 lg:w-6" />
        Coaches, athletes and brands
    </span>
);

const AuthLayout = ({ title, subtitle, children, footer }) => (
    <div className="mx-auto grid w-full max-w-[1440px] grid-cols-1 gap-4 px-4 pb-8 pt-2 sm:gap-6 sm:px-6 sm:pt-4 lg:min-h-[calc(100dvh-80px)] lg:grid-cols-[1.1fr_1fr] lg:px-10 lg:py-6">

        {/* ---------- Hero panel (large screens) ---------- */}
        <div className="relative hidden overflow-hidden rounded-[32px] bg-ink p-10 lg:flex lg:flex-col lg:justify-end">
            <StadiumArt className="left-[35%]" />
            <div className="relative">
                <div className="mb-5"><Tagline /></div>
                <h2 className="text-6xl font-black leading-[0.95] tracking-tighter text-white xl:text-7xl">
                    Train with<br /><span className="text-lime">the best.</span>
                </h2>
            </div>
        </div>

        {/* ---------- Form ---------- */}
        <div className="flex flex-col items-center lg:justify-center">
            <div className="w-full max-w-md">
                {/* Short hero for phones and tablets */}
                <div className="relative mb-4 flex h-40 flex-col justify-end overflow-hidden rounded-[28px] bg-ink p-5 sm:h-44 sm:p-6 lg:hidden">
                    <StadiumArt className="left-[45%]" silhouette={false} />
                    <div className="relative">
                        <div className="mb-3"><Tagline /></div>
                        <p className="text-[2rem] font-black leading-[0.95] tracking-tighter text-white sm:text-4xl">
                            Train with <span className="text-lime">the best.</span>
                        </p>
                    </div>
                </div>

                <div className="card p-5 sm:p-8">
                    <h1 className="text-[1.75rem] font-extrabold leading-tight tracking-tight sm:text-3xl">{title}</h1>
                    {subtitle && <p className="page-subtitle">{subtitle}</p>}
                    <div className="mt-5 sm:mt-6">{children}</div>
                </div>
                {footer && <div className="mt-5 space-y-2 px-2 text-center text-sm text-muted sm:text-left">{footer}</div>}
                <p className="mt-4 px-2 text-center text-xs text-muted sm:text-left">
                    By continuing you agree to our{' '}
                    <Link to="/terms" className="underline hover:text-ink">Terms</Link> and{' '}
                    <Link to="/privacy" className="underline hover:text-ink">Privacy Policy</Link>.
                </p>
            </div>
        </div>
    </div>
);

export default AuthLayout;
