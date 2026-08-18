import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  text: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-10 right-5 z-50 flex flex-col space-y-2 select-none pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center space-x-2.5 rounded-xl border px-4 py-2.5 shadow-2xl text-xs font-medium backdrop-blur-md animate-slideIn ${
            toast.type === 'success'
              ? 'border-emerald-500/50 bg-[#071F1A]/90 text-emerald-300'
              : toast.type === 'error'
              ? 'border-rose-500/50 bg-[#2D0B14]/90 text-rose-300'
              : 'border-[#1E3A5F] bg-[#071A2F]/90 text-slate-200'
          }`}
        >
          {toast.type === 'success' && <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />}
          {toast.type === 'error' && <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />}
          {toast.type === 'info' && <Info className="h-4 w-4 text-[#FFD43B] shrink-0" />}

          <span>{toast.text}</span>

          <button
            onClick={() => onDismiss(toast.id)}
            className="ml-2 text-slate-400 hover:text-white p-0.5 rounded transition"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  );
};
