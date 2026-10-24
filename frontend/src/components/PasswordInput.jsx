// PasswordInput.jsx
// Password field with an eye button to show or hide what's typed.
// Takes the same props as an <input> (id, name, value, onChange, ...).

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const PasswordInput = ({ className = '', ...props }) => {
    const [visible, setVisible] = useState(false);
    return (
        <div className="relative">
            <input {...props} type={visible ? 'text' : 'password'} className={`input pr-12 ${className}`} />
            <button
                type="button"
                onClick={() => setVisible(!visible)}
                aria-label={visible ? 'Hide password' : 'Show password'}
                aria-pressed={visible}
                className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-muted transition-colors hover:bg-black/5 hover:text-ink"
            >
                {visible ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
        </div>
    );
};

export default PasswordInput;
