// JoinAsPicker.jsx
// "Joining as: Learner | Coach | Brand" on the sign-up pages. Learner and
// coach sign up on /register; brands have their own accounts and sign up on
// /brand/register, so picking across the two switches page (keeping the choice).

import { useNavigate } from 'react-router-dom';

const OPTIONS = [
    { value: 'learner', label: 'Learner' },
    { value: 'coach', label: 'Coach' },
    { value: 'brand', label: 'Brand' },
];

// value: 'learner' | 'coach' | 'brand'; onChange is used for learner/coach on /register
const JoinAsPicker = ({ value, onChange }) => {
    const navigate = useNavigate();

    const pick = (role) => {
        if (role === value) return;
        if (role === 'brand') navigate('/brand/register');
        else if (value === 'brand') navigate(`/register?role=${role}`);
        else onChange(role);
    };

    return (
        <div>
            <p className="label" id="join-as-label">Joining as</p>
            <div className="grid grid-cols-3 gap-1.5 rounded-full bg-canvas p-1.5" role="radiogroup" aria-labelledby="join-as-label">
                {OPTIONS.map((o) => (
                    <button
                        key={o.value}
                        type="button"
                        role="radio"
                        aria-checked={value === o.value}
                        onClick={() => pick(o.value)}
                        className={`rounded-full py-2.5 text-center text-sm font-semibold transition-colors ${
                            value === o.value ? 'pill-selected' : 'text-muted hover:bg-canvas hover:text-ink active:scale-95'
                        }`}
                    >
                        {o.label}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default JoinAsPicker;
