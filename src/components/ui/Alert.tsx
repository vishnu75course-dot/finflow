import React from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AlertProps {
  message: string;
  type?: 'success' | 'error';
  onClose?: () => void;
}

export const Alert = ({ message, type = 'error', onClose }: AlertProps) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`p-4 rounded-2xl flex items-center justify-between mb-6 ${
        type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
      }`}
    >
      <div className="flex items-center gap-3">
        {type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
        <p className="text-xs font-bold uppercase tracking-tight">{message}</p>
      </div>
      {onClose && (
        <button onClick={onClose} className="hover:opacity-70 transition-opacity">
          <X size={16} />
        </button>
      )}
    </motion.div>
  );
};
