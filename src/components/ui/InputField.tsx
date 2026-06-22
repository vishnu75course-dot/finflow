import React from 'react';
import { LucideIcon } from 'lucide-react';

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: LucideIcon;
  error?: string;
  type?: string;
  placeholder?: string;
  value?: string | number | string[];
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  required?: boolean;
  disabled?: boolean;
}

export const InputField = React.forwardRef<HTMLInputElement, InputFieldProps>(
  ({ label, icon: Icon, error, className, ...props }, ref) => {
    return (
      <div className="space-y-1.5 w-full">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
          {label}
        </label>
        <div className="relative group">
          {Icon && (
            <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
          )}
          <input 
            ref={ref}
            className={`w-full bg-slate-50 border ${error ? 'border-rose-500' : 'border-slate-200'} rounded-2xl py-3.5 ${Icon ? 'pl-12' : 'pl-4'} pr-4 font-bold text-slate-900 outline-hidden focus:bg-white focus:ring-4 ${error ? 'focus:ring-rose-500/5' : 'focus:ring-emerald-500/5 focus:border-emerald-500'} transition-all ${className || ''}`}
            {...props}
          />
        </div>
        {error && <p className="text-[10px] font-bold text-rose-500 ml-1 uppercase tracking-tight">{error}</p>}
      </div>
    );
  }
);
