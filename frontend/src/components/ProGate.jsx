// ProGate.jsx
// Shows a page only if the user's plan includes `feature` (utils/access.js);
// otherwise a short "this is a Pro feature" notice. Everything is free today,
// so the notice never shows yet: this is where it will once Pro launches.
//   <ProGate feature="aiCoach"><AiAssistant /></ProGate>

import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { canAccess } from '../utils/access';

const ProGate = ({ feature, children }) => {
    const { user } = useAuth();
    if (canAccess(user, feature)) return children;
    return (
        <div className="page max-w-xl">
            <section className="card flex flex-col items-center py-12 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/15 text-accent"><Sparkles size={24} /></span>
                <h1 className="mt-4 text-2xl font-extrabold tracking-tight">This is a Pro feature</h1>
                <p className="mt-2 max-w-sm text-sm text-muted">ArenaX Pro is coming soon. Join the waitlist and we'll let you know when it launches.</p>
                <Link to="/pro" className="btn btn-dark mt-6">See what's in Pro</Link>
            </section>
        </div>
    );
};

export default ProGate;
