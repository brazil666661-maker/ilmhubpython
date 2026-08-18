import React from 'react';
import { Check, AlertCircle, Clock } from 'lucide-react';
import { ExecutionState, AppLanguage, AppTheme } from '../types';
import { getLocale } from '../locales';

interface StatusBarProps {
  executionState: ExecutionState;
  executionTime: number | null;
  errorLine: number | null;
  cursorLine: number;
  cursorCol: number;
  language: AppLanguage;
  theme?: AppTheme;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  executionState,
  executionTime,
  errorLine,
  cursorLine,
  cursorCol,
  language,
  theme = 'dark',
}) => {
  const t = getLocale(language);
  const isDark = theme === 'dark';

  return (
    <div
      id="ilmhub-status-bar"
      className={`flex h-7 w-full items-center justify-between border-t px-3 text-[11px] font-mono select-none ${
        isDark
          ? 'border-[#1E3A5F] bg-[#071424] text-slate-400'
          : 'border-slate-200 bg-slate-100 text-slate-600'
      }`}
    >
      {/* Left: Execution Status */}
      <div className="flex items-center space-x-3">
        {executionState === 'idle' && (
          <div className={`flex items-center space-x-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            <span className={`h-2 w-2 rounded-full ${isDark ? 'bg-slate-500' : 'bg-slate-400'}`} />
            <span>{t.statusReady}</span>
          </div>
        )}

        {executionState === 'running' && (
          <div className={`flex items-center space-x-1.5 ${isDark ? 'text-[#FFD43B]' : 'text-amber-600 font-semibold'}`}>
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
            <span>{t.statusRunning}</span>
          </div>
        )}

        {executionState === 'success' && (
          <div className="flex items-center space-x-1.5 text-emerald-500 font-medium">
            <Check className="h-3 w-3" />
            <span>
              {t.statusSuccess} {executionTime !== null && `(${executionTime}s)`}
            </span>
          </div>
        )}

        {executionState === 'error' && (
          <div className="flex items-center space-x-1.5 text-rose-500 font-medium">
            <AlertCircle className="h-3 w-3" />
            <span>
              {t.statusError} {errorLine !== null && `(${t.line} ${errorLine})`}
            </span>
          </div>
        )}

        {executionState === 'timeout' && (
          <div className="flex items-center space-x-1.5 text-amber-500 font-medium">
            <Clock className="h-3 w-3" />
            <span>{t.statusTimeout}</span>
          </div>
        )}

        {executionState === 'cancelled' && (
          <div className={`flex items-center space-x-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            <span>{t.statusCancelled}</span>
          </div>
        )}
      </div>

      {/* Right: Editor Info */}
      <div className="flex items-center space-x-3">
        <span className="hidden sm:inline">
          {t.line} {cursorLine}, {t.column} {cursorCol}
        </span>
        <span className="hidden sm:inline">{t.spaces}</span>
        <span className="hidden sm:inline">{t.utf8}</span>
        <span
          className={`rounded px-1.5 py-0.2 text-[10px] font-semibold border ${
            isDark
              ? 'bg-[#0B2747] text-[#FFD43B] border-[#1E3A5F]'
              : 'bg-white text-sky-700 border-slate-200 shadow-xs'
          }`}
        >
          {t.pythonVersion}
        </span>
      </div>
    </div>
  );
};
