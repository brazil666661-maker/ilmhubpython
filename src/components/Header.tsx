import React, { useState } from 'react';
import {
  Play,
  Square,
  Save,
  Download,
  Copy,
  Check,
  Trash2,
  Settings,
  Sun,
  Moon,
  Globe,
  Menu,
  X,
  Code2,
  Terminal as TerminalIcon,
  Info,
} from 'lucide-react';
import { AppLanguage, AppTheme, ExecutionState, TerminalPosition } from '../types';
import { getLocale } from '../locales';
import { PanelBottom, PanelRight, PanelLeft } from 'lucide-react';

interface HeaderProps {
  language: AppLanguage;
  onLanguageChange: (lang: AppLanguage) => void;
  theme: AppTheme;
  onThemeToggle: () => void;
  executionState: ExecutionState;
  onRun: () => void;
  onStop: () => void;
  onSave: () => void;
  lastSavedTime: string | null;
  onDownload: () => void;
  onCopy: () => void;
  isCopied: boolean;
  onClear: () => void;
  onOpenSettings: () => void;
  onOpenLanding?: () => void;
  currentFilename: string;
  terminalPosition?: TerminalPosition;
  onChangeTerminalPosition?: (pos: TerminalPosition) => void;
}

export const Header: React.FC<HeaderProps> = ({
  language,
  onLanguageChange,
  theme,
  onThemeToggle,
  executionState,
  onRun,
  onStop,
  onSave,
  lastSavedTime,
  onDownload,
  onCopy,
  isCopied,
  onClear,
  onOpenSettings,
  onOpenLanding,
  currentFilename,
  terminalPosition = 'bottom',
  onChangeTerminalPosition,
}) => {
  const t = getLocale(language);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);

  const isRunning = executionState === 'running';

  const languages: Array<{ code: AppLanguage; label: string; flag: string }> = [
    { code: 'en', label: 'English', flag: 'EN' },
    { code: 'uz', label: 'O‘zbekcha', flag: 'UZ' },
    { code: 'ru', label: 'Русский', flag: 'RU' },
    { code: 'uz-cyrl', label: 'Ўзбекча', flag: 'ЎЗ' },
  ];

  const currentLangObj = languages.find((l) => l.code === language) || languages[0];

  const isDark = theme === 'dark';

  return (
    <header
      id="ilmhub-header"
      className={`sticky top-0 z-40 w-full border-b select-none transition-colors ${
        isDark
          ? 'border-[#1E3A5F]/60 bg-[#071A2F] text-white shadow-md'
          : 'border-slate-200 bg-white text-slate-900 shadow-sm'
      }`}
    >
      <div className="flex h-14 items-center justify-between px-3 sm:px-4 md:px-6">
        {/* Left Section: Logo & Breadcrumbs */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div
            id="ilmhub-logo-btn"
            onClick={onOpenLanding}
            className="flex cursor-pointer items-center space-x-2 rounded-lg py-1 px-1.5 transition hover:opacity-90"
            title="ILMHUB Home"
          >
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-lg border shadow-inner ${
                isDark
                  ? 'bg-[#0B2747] border-[#FFD43B]/40'
                  : 'bg-amber-50 border-amber-300/80'
              }`}
            >
              <Code2 className={`h-5 w-5 ${isDark ? 'text-[#FFD43B]' : 'text-amber-600'}`} />
            </div>
            <div className="flex items-baseline">
              <span
                className={`text-xl font-black tracking-tight font-mono ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                ILM
              </span>
              <span
                className={`text-xl font-black tracking-tight font-mono ${
                  isDark ? 'text-[#FFD43B]' : 'text-amber-600'
                }`}
              >
                HUB
              </span>
            </div>
          </div>

          {/* Active File indicator (Desktop) */}
          <div
            className={`hidden lg:flex items-center space-x-2 text-xs border-l pl-3 ${
              isDark ? 'text-slate-400 border-[#1E3A5F]' : 'text-slate-500 border-slate-200'
            }`}
          >
            <span
              className={`rounded px-2 py-0.5 font-mono border ${
                isDark
                  ? 'bg-[#0B2747] text-slate-300 border-[#1E3A5F]'
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              {currentFilename}
            </span>
            {lastSavedTime && (
              <span className="text-[11px] text-emerald-500 font-medium flex items-center gap-1">
                <Check className="h-3 w-3" />
                {t.saved} {lastSavedTime}
              </span>
            )}
          </div>
        </div>

        {/* Center / Action Section: Run, Stop, Save, Download, Copy */}
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          {/* Main Run Button */}
          {!isRunning ? (
            <button
              id="ilmhub-run-button"
              onClick={onRun}
              className={`flex items-center space-x-1.5 rounded-lg px-3 py-1.5 text-xs font-bold shadow-md transition-all active:scale-95 ${
                executionState === 'error'
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                  : isDark
                  ? 'bg-[#FFD43B] hover:bg-[#ffe066] text-[#071A2F]'
                  : 'bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold'
              }`}
              title="Run Python Code (Ctrl+Enter)"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span className="tracking-wide">
                {executionState === 'error' ? t.statusError : t.run}
              </span>
            </button>
          ) : (
            <button
              id="ilmhub-stop-button"
              onClick={onStop}
              className="flex items-center space-x-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white shadow-md transition-all hover:bg-rose-500 active:scale-95 animate-pulse"
              title="Stop Python Execution"
            >
              <Square className="h-3.5 w-3.5 fill-current" />
              <span>{t.stop}</span>
            </button>
          )}

          {/* About ILMHUB Button */}
          {onOpenLanding && (
            <button
              id="ilmhub-about-btn"
              onClick={onOpenLanding}
              className={`hidden sm:flex items-center space-x-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                isDark
                  ? 'border-[#1E3A5F] bg-[#0B2747] text-slate-200 hover:bg-[#133863] hover:text-[#FFD43B]'
                  : 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
              }`}
              title="About ILMHUB"
            >
              <Info className={`h-3.5 w-3.5 ${isDark ? 'text-[#FFD43B]' : 'text-amber-600'}`} />
              <span>{language === 'uz' ? 'Haqida' : language === 'uz-cyrl' ? 'Ҳақида' : language === 'ru' ? 'О проекте' : 'About'}</span>
            </button>
          )}

          {/* Quick File Actions (Desktop) */}
          <div
            className={`hidden md:flex items-center space-x-1 border-l border-r px-1.5 mx-1 ${
              isDark ? 'border-[#1E3A5F]' : 'border-slate-200'
            }`}
          >
            <button
              id="ilmhub-save-btn"
              onClick={onSave}
              className={`flex items-center space-x-1 rounded-md px-2.5 py-1.5 text-xs transition ${
                isDark
                  ? 'text-slate-300 hover:bg-[#0B2747] hover:text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
              title="Save (Ctrl+S)"
            >
              <Save className="h-3.5 w-3.5" />
              <span className="hidden lg:inline">{t.save}</span>
            </button>

            <button
              id="ilmhub-copy-btn"
              onClick={onCopy}
              className={`flex items-center space-x-1 rounded-md px-2.5 py-1.5 text-xs transition ${
                isDark
                  ? 'text-slate-300 hover:bg-[#0B2747] hover:text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
              title="Copy Code to Clipboard"
            >
              {isCopied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-emerald-500 font-medium">{t.copied}</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span className="hidden lg:inline">{t.copy}</span>
                </>
              )}
            </button>

            <button
              id="ilmhub-download-btn"
              onClick={onDownload}
              className={`flex items-center space-x-1 rounded-md px-2.5 py-1.5 text-xs transition ${
                isDark
                  ? 'text-slate-300 hover:bg-[#0B2747] hover:text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
              title="Download .py file"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden lg:inline">{t.download}</span>
            </button>

            <button
              id="ilmhub-clear-btn"
              onClick={onClear}
              className={`flex items-center space-x-1 rounded-md px-2.5 py-1.5 text-xs transition ${
                isDark
                  ? 'text-slate-300 hover:bg-rose-950/40 hover:text-rose-300'
                  : 'text-slate-600 hover:bg-rose-50 hover:text-rose-600'
              }`}
              title="Clear Editor"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="hidden lg:inline">{t.clear}</span>
            </button>
          </div>

          {/* Terminal Layout Selector (Desktop) */}
          {onChangeTerminalPosition && (
            <div
              className={`hidden xl:flex items-center space-x-0.5 p-1 rounded-lg border ${
                isDark
                  ? 'bg-[#051120] border-[#1E3A5F]'
                  : 'bg-slate-100 border-slate-200'
              }`}
            >
              <span
                className={`text-[10px] font-mono px-1.5 uppercase tracking-wider select-none font-bold ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                {t.layout || 'Layout'}
              </span>
              <button
                onClick={() => onChangeTerminalPosition('left')}
                className={`flex items-center space-x-1 rounded px-2 py-1 text-xs transition ${
                  terminalPosition === 'left'
                    ? isDark
                      ? 'bg-[#1E3A5F] text-[#FFD43B] font-bold shadow-sm'
                      : 'bg-white text-sky-700 font-bold shadow-xs'
                    : isDark
                    ? 'text-slate-400 hover:text-white hover:bg-[#0B2747]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
                title={t.layoutLeft}
              >
                <PanelLeft className="h-3.5 w-3.5" />
                <span className="text-[11px]">{t.layoutLeftShort || 'Left'}</span>
              </button>
              <button
                onClick={() => onChangeTerminalPosition('bottom')}
                className={`flex items-center space-x-1 rounded px-2 py-1 text-xs transition ${
                  terminalPosition === 'bottom'
                    ? isDark
                      ? 'bg-[#1E3A5F] text-[#FFD43B] font-bold shadow-sm'
                      : 'bg-white text-sky-700 font-bold shadow-xs'
                    : isDark
                    ? 'text-slate-400 hover:text-white hover:bg-[#0B2747]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
                title={t.layoutBottom}
              >
                <PanelBottom className="h-3.5 w-3.5" />
                <span className="text-[11px]">{t.layoutBottomShort || 'Down'}</span>
              </button>
              <button
                onClick={() => onChangeTerminalPosition('right')}
                className={`flex items-center space-x-1 rounded px-2 py-1 text-xs transition ${
                  terminalPosition === 'right'
                    ? isDark
                      ? 'bg-[#1E3A5F] text-[#FFD43B] font-bold shadow-sm'
                      : 'bg-white text-sky-700 font-bold shadow-xs'
                    : isDark
                    ? 'text-slate-400 hover:text-white hover:bg-[#0B2747]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
                title={t.layoutRight}
              >
                <PanelRight className="h-3.5 w-3.5" />
                <span className="text-[11px]">{t.layoutRightShort || 'Right'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Right Section: Language, Theme, Settings, Mobile Menu */}
        <div className="flex items-center space-x-1 sm:space-x-2">
          {/* Language Selector Dropdown */}
          <div className="relative">
            <button
              id="ilmhub-lang-selector"
              onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
              className={`flex items-center space-x-1 rounded-lg border px-2.5 py-1.5 text-xs font-bold transition ${
                isDark
                  ? 'border-[#1E3A5F] bg-[#0B2747] text-slate-200 hover:bg-[#133863]'
                  : 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
              title="Change Language"
            >
              <Globe className={`h-3.5 w-3.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
              <span>{currentLangObj.flag}</span>
            </button>

            {isLangDropdownOpen && (
              <div
                className={`absolute right-0 mt-1.5 w-36 rounded-lg border py-1 shadow-xl z-50 ${
                  isDark
                    ? 'border-[#1E3A5F] bg-[#0B2747]'
                    : 'border-slate-200 bg-white shadow-lg'
                }`}
              >
                {languages.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => {
                      onLanguageChange(l.code);
                      setIsLangDropdownOpen(false);
                    }}
                    className={`flex w-full items-center justify-between px-3 py-1.5 text-xs text-left transition ${
                      language === l.code
                        ? isDark
                          ? 'bg-[#133863] text-[#FFD43B] font-bold'
                          : 'bg-amber-50 text-amber-700 font-bold'
                        : isDark
                        ? 'text-slate-300 hover:bg-[#1E3A5F] hover:text-white'
                        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <span>{l.label}</span>
                    <span className="text-[10px] font-mono opacity-70">{l.flag}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Theme Toggle Button */}
          <button
            id="ilmhub-theme-toggle"
            onClick={onThemeToggle}
            className={`flex h-8 w-8 items-center justify-center rounded-lg border transition ${
              isDark
                ? 'border-[#1E3A5F] bg-[#0B2747] text-slate-300 hover:bg-[#133863] hover:text-white'
                : 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
            }`}
            title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          >
            {isDark ? (
              <Sun className="h-4 w-4 text-[#FFD43B]" />
            ) : (
              <Moon className="h-4 w-4 text-slate-700" />
            )}
          </button>

          {/* Settings Modal Button */}
          <button
            id="ilmhub-settings-btn"
            onClick={onOpenSettings}
            className={`hidden sm:flex h-8 w-8 items-center justify-center rounded-lg border transition ${
              isDark
                ? 'border-[#1E3A5F] bg-[#0B2747] text-slate-300 hover:bg-[#133863] hover:text-white'
                : 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
            }`}
            title={t.settings}
          >
            <Settings className="h-4 w-4" />
          </button>

          {/* Mobile Menu Button */}
          <button
            id="ilmhub-mobile-menu-btn"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`flex md:hidden h-8 w-8 items-center justify-center rounded-lg border ${
              isDark
                ? 'border-[#1E3A5F] bg-[#0B2747] text-slate-300 hover:text-white'
                : 'border-slate-300 bg-slate-100 text-slate-700 hover:text-slate-900'
            }`}
          >
            {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div
          className={`md:hidden border-t px-4 py-3 space-y-3 ${
            isDark
              ? 'border-[#1E3A5F] bg-[#071A2F]'
              : 'border-slate-200 bg-white'
          }`}
        >
          {onChangeTerminalPosition && (
            <div
              className={`rounded-lg border p-2 ${
                isDark
                  ? 'border-[#1E3A5F] bg-[#0B2747]'
                  : 'border-slate-200 bg-slate-50'
              }`}
            >
              <span
                className={`text-[11px] font-semibold block mb-1.5 font-mono ${
                  isDark ? 'text-slate-300' : 'text-slate-700'
                }`}
              >
                {t.layout || 'Terminal Layout'}:
              </span>
              <div className="grid grid-cols-3 gap-1">
                <button
                  onClick={() => {
                    onChangeTerminalPosition('left');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`flex items-center justify-center space-x-1 rounded p-2 text-xs font-semibold ${
                    terminalPosition === 'left'
                      ? isDark
                        ? 'bg-[#FFD43B] text-[#071A2F]'
                        : 'bg-amber-400 text-slate-950'
                      : isDark
                      ? 'bg-[#071A2F] text-slate-300'
                      : 'bg-white text-slate-700 border border-slate-200'
                  }`}
                >
                  <PanelLeft className="h-3.5 w-3.5" />
                  <span>{t.layoutLeftShort || 'Left'}</span>
                </button>
                <button
                  onClick={() => {
                    onChangeTerminalPosition('bottom');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`flex items-center justify-center space-x-1 rounded p-2 text-xs font-semibold ${
                    terminalPosition === 'bottom'
                      ? isDark
                        ? 'bg-[#FFD43B] text-[#071A2F]'
                        : 'bg-amber-400 text-slate-950'
                      : isDark
                      ? 'bg-[#071A2F] text-slate-300'
                      : 'bg-white text-slate-700 border border-slate-200'
                  }`}
                >
                  <PanelBottom className="h-3.5 w-3.5" />
                  <span>{t.layoutBottomShort || 'Down'}</span>
                </button>
                <button
                  onClick={() => {
                    onChangeTerminalPosition('right');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`flex items-center justify-center space-x-1 rounded p-2 text-xs font-semibold ${
                    terminalPosition === 'right'
                      ? isDark
                        ? 'bg-[#FFD43B] text-[#071A2F]'
                        : 'bg-amber-400 text-slate-950'
                      : isDark
                      ? 'bg-[#071A2F] text-slate-300'
                      : 'bg-white text-slate-700 border border-slate-200'
                  }`}
                >
                  <PanelRight className="h-3.5 w-3.5" />
                  <span>{t.layoutRightShort || 'Right'}</span>
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            {onOpenLanding && (
              <button
                onClick={() => {
                  onOpenLanding();
                  setIsMobileMenuOpen(false);
                }}
                className={`flex items-center space-x-2 rounded-lg border p-2.5 text-xs col-span-2 ${
                  isDark
                    ? 'border-[#1E3A5F] bg-[#0B2747] text-slate-200'
                    : 'border-slate-200 bg-slate-50 text-slate-700'
                }`}
              >
                <Info className={`h-4 w-4 ${isDark ? 'text-[#FFD43B]' : 'text-amber-600'}`} />
                <span>{language === 'uz' ? 'ILMHUB Haqida' : language === 'uz-cyrl' ? 'ILMHUB Ҳақида' : language === 'ru' ? 'О проекте ILMHUB' : 'About ILMHUB'}</span>
              </button>
            )}

            <button
              onClick={() => {
                onSave();
                setIsMobileMenuOpen(false);
              }}
              className={`flex items-center space-x-2 rounded-lg border p-2.5 text-xs ${
                isDark
                  ? 'border-[#1E3A5F] bg-[#0B2747] text-slate-200'
                  : 'border-slate-200 bg-slate-50 text-slate-700'
              }`}
            >
              <Save className="h-4 w-4 text-emerald-500" />
              <span>{t.save}</span>
            </button>

            <button
              onClick={() => {
                onDownload();
                setIsMobileMenuOpen(false);
              }}
              className={`flex items-center space-x-2 rounded-lg border p-2.5 text-xs ${
                isDark
                  ? 'border-[#1E3A5F] bg-[#0B2747] text-slate-200'
                  : 'border-slate-200 bg-slate-50 text-slate-700'
              }`}
            >
              <Download className="h-4 w-4 text-sky-500" />
              <span>{t.download}</span>
            </button>

            <button
              onClick={() => {
                onCopy();
                setIsMobileMenuOpen(false);
              }}
              className={`flex items-center space-x-2 rounded-lg border p-2.5 text-xs ${
                isDark
                  ? 'border-[#1E3A5F] bg-[#0B2747] text-slate-200'
                  : 'border-slate-200 bg-slate-50 text-slate-700'
              }`}
            >
              <Copy className="h-4 w-4 text-purple-500" />
              <span>{t.copy}</span>
            </button>

            <button
              onClick={() => {
                onClear();
                setIsMobileMenuOpen(false);
              }}
              className={`flex items-center space-x-2 rounded-lg border p-2.5 text-xs ${
                isDark
                  ? 'border-rose-900/50 bg-rose-950/30 text-rose-300'
                  : 'border-rose-200 bg-rose-50 text-rose-700'
              }`}
            >
              <Trash2 className="h-4 w-4" />
              <span>{t.clear}</span>
            </button>

            <button
              onClick={() => {
                onOpenSettings();
                setIsMobileMenuOpen(false);
              }}
              className={`flex items-center space-x-2 rounded-lg border p-2.5 text-xs ${
                isDark
                  ? 'border-[#1E3A5F] bg-[#0B2747] text-slate-200'
                  : 'border-slate-200 bg-slate-50 text-slate-700'
              }`}
            >
              <Settings className="h-4 w-4 text-slate-500" />
              <span>{t.settings}</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
