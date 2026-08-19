import React, { useEffect, useRef } from 'react';
import { FilePenLine, X } from 'lucide-react';
import { AppLanguage, AppTheme } from '../types';
import { getLocale } from '../locales';

interface FileNameDialogProps {
  isOpen: boolean;
  title: string;
  value: string;
  onChange: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  language: AppLanguage;
  theme?: AppTheme;
}

export const FileNameDialog: React.FC<FileNameDialogProps> = ({
  isOpen,
  title,
  value,
  onChange,
  onConfirm,
  onCancel,
  language,
  theme = 'dark',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const t = getLocale(language);
  const isDark = theme === 'dark';

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') onConfirm();
    if (event.key === 'Escape') onCancel();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ilmhub-file-name-title"
        className={`w-full max-w-sm rounded-xl border p-4 shadow-2xl transition-all ${
          isDark ? 'border-[#1E3A5F] bg-[#071A2F] text-slate-100' : 'border-slate-300 bg-white text-slate-900'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FilePenLine className={`h-4 w-4 ${isDark ? 'text-[#FFD43B]' : 'text-sky-600'}`} />
            <h2 id="ilmhub-file-name-title" className="text-sm font-bold">{title}</h2>
          </div>
          <button onClick={onCancel} aria-label={t.cancel} className="rounded-lg p-1 text-slate-400 hover:bg-slate-700/40 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        <label htmlFor="ilmhub-file-name-input" className="mt-4 block text-xs font-medium text-slate-400">
          {t.fileName}
        </label>
        <input
          ref={inputRef}
          id="ilmhub-file-name-input"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          className={`mt-1.5 w-full rounded-lg border px-3 py-2 text-sm outline-none ${
            isDark
              ? 'border-[#1E3A5F] bg-[#07111F] text-white focus:border-[#FFD43B]'
              : 'border-slate-300 bg-white text-slate-900 focus:border-sky-600'
          }`}
          autoComplete="off"
        />

        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onCancel} className="rounded-lg border border-slate-500/50 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700/40">
            {t.cancel}
          </button>
          <button onClick={onConfirm} className="rounded-lg bg-[#FFD43B] px-3 py-2 text-xs font-bold text-[#071A2F] hover:bg-amber-300">
            {t.confirm}
          </button>
        </div>
      </div>
    </div>
  );
};