import React, { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';

interface PasswordFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  strength?: number; // 0 to 4
  placeholder?: string;
  value?: string | number | string[];
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  required?: boolean;
  disabled?: boolean;
}

export const PasswordField = React.forwardRef<HTMLInputElement, PasswordFieldProps>(
  ({ label, error, strength, className, ...props }, ref) => {
    const [show, setShow] = useState(false);

    return (
      <div className="space-y-1.5 w-full text-left">
        <div className="flex justify-between items-center ml-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {label}
          </label>
          {strength !== undefined && (
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((i) => (
                <div 
                  key={i} 
                  className={`w-4 h-1 rounded-full transition-colors ${i <= strength ? 'bg-emerald-500' : 'bg-slate-200'}`} 
                />
              ))}
            </div>
          )}
        </div>
        <div className="relative group">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
          <input 
            ref={ref}
            type={show ? "text" : "password"}
            className={`w-full bg-slate-50 border ${error ? 'border-rose-500' : 'border-slate-200'} rounded-2xl py-3.5 pl-12 pr-12 font-bold text-slate-900 outline-hidden focus:bg-white focus:ring-4 ${error ? 'focus:ring-rose-500/5' : 'focus:ring-emerald-500/5 focus:border-emerald-500'} transition-all ${className || ''}`}
            {...props}
          />
          <button 
            type="button" 
            onClick={() => setShow(!show)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {error && <p className="text-[10px] font-bold text-rose-500 ml-1 uppercase tracking-tight">{error}</p>}
      </div>
    );
  }
);
