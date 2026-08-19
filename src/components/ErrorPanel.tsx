import React, { useState } from 'react';
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  X,
  HelpCircle,
  Check,
} from 'lucide-react';
import { ParsedPythonError, AppLanguage, AppTheme } from '../types';
import { getLocale } from '../locales';

interface ErrorPanelProps {
  error: ParsedPythonError | null;
  currentCode: string;
  onClose: () => void;
  language: AppLanguage;
  theme?: AppTheme;
}

export const ErrorPanel: React.FC<ErrorPanelProps> = ({
  error,
  currentCode,
  onClose,
  language,
  theme = 'dark',
}) => {
  const t = getLocale(language);
  const [showTraceback, setShowTraceback] = useState(false);
  const isDark = theme === 'dark';

  if (!error) return null;

  return (
    <div
      id="ilmhub-error-panel"
      className={`rounded-xl border p-4 shadow-2xl transition-all select-text mb-3 ${
        isDark
          ? 'border-rose-500/40 bg-[#0B1B2D] text-slate-100'
          : 'border-rose-200 bg-rose-50/95 text-slate-900 shadow-md'
      }`}
    >
      {/* Header */}
      <div
        className={`flex items-start justify-between border-b pb-3 ${
          isDark ? 'border-[#1E3A5F]' : 'border-rose-200'
        }`}
      >
        <div className="flex items-center space-x-2.5">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-lg ${
              isDark ? 'bg-rose-500/20 text-rose-400' : 'bg-rose-100 text-rose-600'
            }`}
          >
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold text-rose-500 font-mono">{error.type}</span>
              <span
                className={`rounded px-2 py-0.5 text-xs font-semibold font-mono ${
                  isDark ? 'bg-rose-500/20 text-rose-300' : 'bg-rose-100 text-rose-700'
                }`}
              >
                {t.errorOnLine} {error.line}
              </span>
            </div>
            <p
              className={`text-xs font-mono mt-0.5 ${
                isDark ? 'text-slate-300' : 'text-slate-700'
              }`}
            >
              {error.message}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            onClick={onClose}
            className={`rounded p-1 transition ${
              isDark
                ? 'text-slate-400 hover:text-white hover:bg-[#1E3A5F]'
                : 'text-slate-400 hover:text-slate-900 hover:bg-rose-100'
            }`}
            title={t.close}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Two-Level Error Explanation */}
      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        {/* Simple Explanation for Beginners */}
        <div
          className={`rounded-lg p-3 border ${
            isDark
              ? 'bg-[#071424] border-[#1E3A5F]'
              : 'bg-white border-rose-200 shadow-xs'
          }`}
        >
          <div className="flex items-center space-x-1.5 text-amber-500 font-semibold mb-1">
            <HelpCircle className="h-3.5 w-3.5" />
            <span>{t.simpleExplanation}</span>
          </div>
          <p className={`leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            {error.simpleExplanation}
          </p>
        </div>

        {/* Suggested Quick Fix */}
        <div
          className={`rounded-lg p-3 border ${
            isDark
              ? 'bg-[#071424] border-[#1E3A5F]'
              : 'bg-white border-rose-200 shadow-xs'
          }`}
        >
          <div className="flex items-center space-x-1.5 text-emerald-600 font-semibold mb-1">
            <Check className="h-3.5 w-3.5" />
            <span>{t.suggestedFix}</span>
          </div>
          <p className={`leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            {error.suggestedFix}
          </p>
        </div>
      </div>

      {/* Collapsible Traceback Section */}
      {error.rawTraceback && (
        <div
          className={`mt-3 border-t pt-2 ${
            isDark ? 'border-[#1E3A5F]/50' : 'border-rose-200'
          }`}
        >
          <button
            onClick={() => setShowTraceback(!showTraceback)}
            className={`flex items-center space-x-1 text-xs transition font-mono ${
              isDark
                ? 'text-slate-400 hover:text-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {showTraceback ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
            <span>
              {showTraceback ? t.hideTraceback : t.fullTraceback}
            </span>
          </button>

          {showTraceback && (
            <div
              className={`mt-2 rounded-lg p-3 border font-mono text-xs overflow-x-auto whitespace-pre leading-relaxed animate-fadeIn ${
                isDark
                  ? 'bg-[#050B14] border-[#1E3A5F] text-rose-300/90'
                  : 'bg-white border-rose-200 text-rose-700'
              }`}
            >
              {error.rawTraceback}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
