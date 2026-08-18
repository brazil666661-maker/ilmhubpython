import React, { useState, useRef, useEffect } from 'react';
import {
  Terminal as TerminalIcon,
  AlertTriangle,
  Copy,
  Trash2,
  Maximize2,
  Minimize2,
  Check,
  CornerDownLeft,
  XCircle,
  PanelBottom,
  PanelRight,
  PanelLeft,
  Columns,
  Rows,
} from 'lucide-react';
import {
  TerminalEntry,
  ExecutionResponse,
  ExecutionState,
  ParsedPythonError,
  AppSettings,
  AppLanguage,
  TerminalPosition,
} from '../types';
import { getLocale } from '../locales';

interface TerminalProps {
  entries: TerminalEntry[];
  lastResult: ExecutionResponse | null;
  executionState: ExecutionState;
  onClear: () => void;
  onCopy: () => void;
  isCopied: boolean;
  isMaximized: boolean;
  onToggleMaximize: () => void;
  isMinimized: boolean;
  onToggleMinimize: () => void;
  error: ParsedPythonError | null;
  onSelectErrorLine?: (line: number) => void;
  onSendStdin?: (input: string) => void;
  isWaitingForInput?: boolean;
  pendingPrompt?: string;
  settings: AppSettings;
  language: AppLanguage;
  position?: TerminalPosition;
  onChangePosition?: (pos: TerminalPosition) => void;
}

export const Terminal: React.FC<TerminalProps> = ({
  entries,
  lastResult,
  executionState,
  onClear,
  onCopy,
  isCopied,
  isMaximized,
  onToggleMaximize,
  isMinimized,
  onToggleMinimize,
  error,
  onSelectErrorLine,
  onSendStdin,
  isWaitingForInput = false,
  pendingPrompt = '',
  settings,
  language,
  position = 'bottom',
  onChangePosition,
}) => {
  const t = getLocale(language);
  const isDark = settings.theme === 'dark';
  const [activeTab, setActiveTab] = useState<'terminal' | 'problems'>('terminal');
  const [stdinInput, setStdinInput] = useState('');
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (terminalEndRef.current && !isMinimized) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [entries, lastResult, executionState, isMinimized]);

  useEffect(() => {
    if (isWaitingForInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isWaitingForInput]);

  const handleStdinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSendStdin) {
      onSendStdin(stdinInput);
    }
    setStdinInput('');
  };

  const isRunning = executionState === 'running';
  const problemCount = error ? 1 : 0;

  // Minimized state when in Bottom mode
  if (isMinimized && position === 'bottom') {
    return (
      <div
        id="ilmhub-terminal-minimized-bottom"
        onClick={onToggleMinimize}
        className={`flex h-8 w-full cursor-pointer items-center justify-between border-t px-4 text-xs font-mono transition select-none z-20 shrink-0 ${
          isDark
            ? 'border-[#1E3A5F] bg-[#050B14] text-slate-400 hover:text-white'
            : 'border-slate-200 bg-slate-100 text-slate-600 hover:text-slate-900'
        }`}
      >
        <div className="flex items-center space-x-2">
          <TerminalIcon className={`h-3.5 w-3.5 ${isDark ? 'text-[#FFD43B]' : 'text-sky-600'}`} />
          <span className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            {t.terminal}
          </span>
          {problemCount > 0 && (
            <span className="flex items-center gap-1 rounded bg-rose-500/20 px-1.5 py-0.5 text-[10px] text-rose-500 font-sans">
              <AlertTriangle className="h-3 w-3" />
              {problemCount} {t.problems}
            </span>
          )}
        </div>
        <div
          className={`flex items-center space-x-2 text-[11px] ${
            isDark ? 'text-slate-400 hover:text-[#FFD43B]' : 'text-slate-500 hover:text-sky-600'
          }`}
        >
          <span>{t.restore}</span>
          <Maximize2 className="h-3 w-3" />
        </div>
      </div>
    );
  }

  // Minimized state when in Left or Right split mode
  if (isMinimized && (position === 'left' || position === 'right')) {
    return (
      <div
        id={`ilmhub-terminal-minimized-${position}`}
        onClick={onToggleMinimize}
        className={`flex h-full w-9 cursor-pointer flex-col items-center justify-between py-3 text-xs font-mono transition select-none z-20 shrink-0 ${
          isDark
            ? 'bg-[#050B14] text-slate-400 hover:text-white'
            : 'bg-slate-100 text-slate-600 hover:text-slate-900'
        } ${
          position === 'left'
            ? isDark
              ? 'border-r border-[#1E3A5F]'
              : 'border-r border-slate-200'
            : isDark
            ? 'border-l border-[#1E3A5F]'
            : 'border-l border-slate-200'
        }`}
        title={`${t.restore} ${t.terminal}`}
      >
        <div className="flex flex-col items-center space-y-3">
          <TerminalIcon className={`h-4 w-4 ${isDark ? 'text-[#FFD43B]' : 'text-sky-600'}`} />
          {problemCount > 0 && (
            <span
              className="rounded-full bg-rose-500/30 p-1 text-[9px] font-bold text-rose-500"
              title={`${problemCount} ${t.problems}`}
            >
              !
            </span>
          )}
          <span
            className={`rotate-90 tracking-wider font-semibold text-[11px] whitespace-nowrap mt-4 ${
              isDark ? 'text-slate-300' : 'text-slate-700'
            }`}
          >
            {t.terminal}
          </span>
        </div>
        <div
          className={`flex flex-col items-center space-y-2 ${
            isDark ? 'text-slate-500 hover:text-[#FFD43B]' : 'text-slate-400 hover:text-sky-600'
          }`}
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </div>
      </div>
    );
  }

  const borderClass =
    position === 'bottom'
      ? isDark
        ? 'border-t border-[#1E3A5F]'
        : 'border-t border-slate-200'
      : position === 'left'
      ? isDark
        ? 'border-r border-[#1E3A5F]'
        : 'border-r border-slate-200'
      : isDark
      ? 'border-l border-[#1E3A5F]'
      : 'border-l border-slate-200';

  return (
    <div
      id="ilmhub-terminal-container"
      className={`flex flex-col select-text font-mono overflow-hidden ${borderClass} ${
        isDark ? 'bg-[#050B14] text-slate-200' : 'bg-white text-slate-800'
      } ${
        isMaximized
          ? 'absolute inset-0 z-40 w-full h-full'
          : position === 'bottom'
          ? 'w-full'
          : 'h-full shrink-0'
      }`}
    >
      {/* Terminal Tab Header */}
      <div
        className={`flex h-9 items-center justify-between border-b px-3 select-none shrink-0 ${
          isDark
            ? 'border-[#1E3A5F]/80 bg-[#071424]'
            : 'border-slate-200 bg-slate-100'
        }`}
      >
        {/* Left Tabs */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setActiveTab('terminal')}
            className={`flex items-center space-x-1.5 rounded-t-md px-2.5 sm:px-3 py-1.5 text-xs font-medium transition ${
              activeTab === 'terminal'
                ? isDark
                  ? 'bg-[#050B14] text-[#FFD43B] border-t-2 border-[#FFD43B] font-semibold'
                  : 'bg-white text-sky-700 border-t-2 border-sky-600 font-semibold shadow-xs'
                : isDark
                ? 'text-slate-400 hover:bg-[#0B2747] hover:text-slate-200'
                : 'text-slate-500 hover:bg-slate-200 hover:text-slate-800'
            }`}
          >
            <TerminalIcon className="h-3.5 w-3.5" />
            <span>{t.terminal}</span>
          </button>

          <button
            onClick={() => setActiveTab('problems')}
            className={`flex items-center space-x-1.5 rounded-t-md px-2.5 sm:px-3 py-1.5 text-xs font-medium transition ${
              activeTab === 'problems'
                ? isDark
                  ? 'bg-[#050B14] text-[#FFD43B] border-t-2 border-[#FFD43B] font-semibold'
                  : 'bg-white text-sky-700 border-t-2 border-sky-600 font-semibold shadow-xs'
                : isDark
                ? 'text-slate-400 hover:bg-[#0B2747] hover:text-slate-200'
                : 'text-slate-500 hover:bg-slate-200 hover:text-slate-800'
            }`}
          >
            <AlertTriangle className={`h-3.5 w-3.5 ${problemCount > 0 ? 'text-rose-500' : 'text-slate-400'}`} />
            <span>{t.problems}</span>
            {problemCount > 0 && (
              <span className="rounded-full bg-rose-500/20 px-1.5 py-0.2 text-[10px] font-bold text-rose-500">
                {problemCount}
              </span>
            )}
          </button>
        </div>

        {/* Right Actions & Layout Switcher */}
        <div
          className={`flex items-center space-x-1 ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}
        >
          {/* Layout Quick Selector */}
          {onChangePosition && (
            <div
              className={`flex items-center p-0.5 rounded border mr-1 space-x-0.5 ${
                isDark
                  ? 'bg-[#050B14] border-[#1E3A5F]'
                  : 'bg-slate-200 border-slate-300'
              }`}
            >
              <button
                onClick={() => onChangePosition('left')}
                className={`p-1 rounded transition text-xs flex items-center ${
                  position === 'left'
                    ? isDark
                      ? 'bg-[#1E3A5F] text-[#FFD43B] font-bold'
                      : 'bg-white text-sky-700 font-bold shadow-xs'
                    : isDark
                    ? 'text-slate-400 hover:text-white hover:bg-[#0B2747]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-300'
                }`}
                title={t.layoutLeft || 'Split Left'}
              >
                <PanelLeft className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => onChangePosition('bottom')}
                className={`p-1 rounded transition text-xs flex items-center ${
                  position === 'bottom'
                    ? isDark
                      ? 'bg-[#1E3A5F] text-[#FFD43B] font-bold'
                      : 'bg-white text-sky-700 font-bold shadow-xs'
                    : isDark
                    ? 'text-slate-400 hover:text-white hover:bg-[#0B2747]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-300'
                }`}
                title={t.layoutBottom || 'Bottom Terminal'}
              >
                <PanelBottom className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => onChangePosition('right')}
                className={`p-1 rounded transition text-xs flex items-center ${
                  position === 'right'
                    ? isDark
                      ? 'bg-[#1E3A5F] text-[#FFD43B] font-bold'
                      : 'bg-white text-sky-700 font-bold shadow-xs'
                    : isDark
                    ? 'text-slate-400 hover:text-white hover:bg-[#0B2747]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-300'
                }`}
                title={t.layoutRight || 'Split Right'}
              >
                <PanelRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Copy Output Button */}
          <button
            onClick={onCopy}
            className={`flex items-center space-x-1 rounded p-1 text-xs transition ${
              isDark
                ? 'hover:bg-[#0B2747] hover:text-slate-200'
                : 'hover:bg-slate-200 hover:text-slate-900'
            }`}
            title={t.copyOutput}
          >
            {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
          </button>

          {/* Clear Terminal Button */}
          <button
            onClick={onClear}
            className={`flex items-center space-x-1 rounded p-1 text-xs transition ${
              isDark
                ? 'hover:bg-[#0B2747] hover:text-slate-200'
                : 'hover:bg-slate-200 hover:text-slate-900'
            }`}
            title={t.clearTerminal}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>

          {/* Maximize / Restore Button */}
          <button
            onClick={onToggleMaximize}
            className={`flex items-center rounded p-1 text-xs transition ${
              isDark
                ? 'hover:bg-[#0B2747] hover:text-slate-200'
                : 'hover:bg-slate-200 hover:text-slate-900'
            }`}
            title={isMaximized ? t.restore : t.maximize}
          >
            {isMaximized ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>

          {/* Minimize Button */}
          <button
            onClick={onToggleMinimize}
            className={`flex items-center rounded p-1 text-xs transition ${
              isDark
                ? 'hover:bg-[#0B2747] hover:text-slate-200'
                : 'hover:bg-slate-200 hover:text-slate-900'
            }`}
            title={t.minimize}
          >
            <Minimize2 className="h-3.5 w-3.5 rotate-90" />
          </button>
        </div>
      </div>

      {/* Terminal Tab Body */}
      {activeTab === 'terminal' ? (
        <div
          className="flex-1 overflow-y-auto p-3 text-xs leading-relaxed font-mono space-y-1 select-text scrollbar-thin min-h-0"
          style={{ fontSize: `${settings.terminalFontSize || 13}px` }}
        >
          {entries.length === 0 && !isRunning && !lastResult ? (
            <div
              className={`whitespace-pre-wrap py-2 font-mono ${
                isDark ? 'text-slate-500' : 'text-slate-400'
              }`}
            >
              {t.emptyTerminal}
            </div>
          ) : (
            <>
              {entries.map((entry) => {
                let colorClass = isDark ? 'text-slate-200' : 'text-slate-800';
                if (entry.type === 'command') {
                  colorClass = isDark ? 'text-[#FFD43B] font-semibold' : 'text-sky-700 font-semibold';
                }
                if (entry.type === 'stderr' || entry.type === 'error') {
                  colorClass = isDark ? 'text-rose-400 font-mono' : 'text-rose-600 font-mono font-medium';
                }
                if (entry.type === 'success') {
                  colorClass = isDark ? 'text-emerald-400 font-semibold' : 'text-emerald-600 font-semibold';
                }
                if (entry.type === 'system') {
                  colorClass = isDark ? 'text-sky-400/90' : 'text-sky-600 font-medium';
                }

                return (
                  <div key={entry.id} className="flex items-start space-x-2">
                    {settings.showTimestamps && entry.timestamp && (
                      <span
                        className={`text-[10px] select-none shrink-0 font-sans ${
                          isDark ? 'text-slate-600' : 'text-slate-400'
                        }`}
                      >
                        [{entry.timestamp}]
                      </span>
                    )}
                    <div className={`whitespace-pre-wrap break-all ${colorClass}`}>
                      {entry.text}
                    </div>
                  </div>
                );
              })}

              {/* Running indicator */}
              {isRunning && (
                <div
                  className={`flex items-center space-x-2 py-1 ${
                    isDark ? 'text-amber-300' : 'text-amber-600'
                  }`}
                >
                  <span className="inline-block h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                  <span className="font-sans text-xs">{t.statusRunning}</span>
                </div>
              )}
            </>
          )}
          <div ref={terminalEndRef} />
        </div>
      ) : (
        /* Problems Tab Body */
        <div className="flex-1 overflow-y-auto p-4 text-xs min-h-0">
          {error ? (
            <div className="space-y-3 font-sans">
              <div
                onClick={() => onSelectErrorLine && onSelectErrorLine(error.line)}
                className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 rounded-lg border p-3 transition cursor-pointer ${
                  isDark
                    ? 'border-rose-500/30 bg-rose-950/20 hover:bg-rose-950/30 text-slate-100'
                    : 'border-rose-200 bg-rose-50 hover:bg-rose-100/70 text-slate-800'
                }`}
              >
                <div className="flex items-start space-x-2.5">
                  <XCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-rose-500 font-mono">{error.type}</span>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-mono ${
                          isDark ? 'bg-rose-500/20 text-rose-300' : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {error.file}:{error.line}
                      </span>
                    </div>
                    <p className={`mt-1 text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      {error.message}
                    </p>
                    <p
                      className={`mt-1.5 text-[11px] italic ${
                        isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}
                    >
                      💡 {error.simpleExplanation}
                    </p>
                  </div>
                </div>
              </div>

              {/* Source Line preview */}
              {error.source && (
                <div
                  className={`rounded-md p-2 font-mono text-[11px] border ${
                    isDark
                      ? 'bg-[#07111F] border-[#1E3A5F] text-slate-300'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <span className={`mr-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    {error.line} |
                  </span>
                  <span className="text-rose-500 underline decoration-rose-500 decoration-wavy">
                    {error.source}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div
              className={`flex flex-col items-center justify-center h-full space-y-1.5 py-8 ${
                isDark ? 'text-slate-500' : 'text-slate-400'
              }`}
            >
              <Check className="h-6 w-6 text-emerald-500" />
              <p>{t.noProblems}</p>
            </div>
          )}
        </div>
      )}

      {/* Interactive Stdin Row */}
      {activeTab === 'terminal' && (
        <form
          onSubmit={handleStdinSubmit}
          className={`flex items-center border-t px-3 py-1.5 shrink-0 transition-colors ${
            isWaitingForInput
              ? isDark
                ? 'border-amber-400/80 bg-[#0B2747]'
                : 'border-amber-400 bg-amber-50'
              : isDark
              ? 'border-[#1E3A5F]/60 bg-[#071424]'
              : 'border-slate-200 bg-slate-50'
          }`}
        >
          <span
            className={`mr-2 font-bold font-mono text-xs ${
              isWaitingForInput
                ? 'text-amber-400 animate-pulse font-extrabold'
                : isDark
                ? 'text-[#FFD43B]'
                : 'text-sky-600'
            }`}
          >
            {isWaitingForInput ? '>' : '$'}
          </span>
          <input
            ref={inputRef}
            type="text"
            value={stdinInput}
            onChange={(e) => setStdinInput(e.target.value)}
            placeholder={
              isWaitingForInput
                ? (pendingPrompt ? `${pendingPrompt} (type here & Enter)` : 'Python waiting for input: type and press Enter...')
                : 'Type standard input (stdin) and press Enter...'
            }
            className={`flex-1 bg-transparent text-xs font-mono outline-none ${
              isDark
                ? 'text-slate-100 placeholder:text-slate-500'
                : 'text-slate-800 placeholder:text-slate-400'
            }`}
          />
          <button
            type="submit"
            className={`transition p-1 rounded ${
              isWaitingForInput
                ? isDark
                  ? 'bg-amber-400 text-[#071A2F] font-bold shadow-xs'
                  : 'bg-amber-500 text-white font-bold'
                : isDark
                ? 'text-slate-400 hover:text-[#FFD43B]'
                : 'text-slate-500 hover:text-sky-600'
            }`}
            title="Send Input (Enter)"
          >
            <CornerDownLeft className="h-3.5 w-3.5" />
          </button>
        </form>
      )}
    </div>
  );
};
