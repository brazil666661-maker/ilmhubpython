import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  X,
  Check,
  Code,
  Terminal as TerminalIcon,
  Cpu,
  Sliders,
  PanelBottom,
  PanelRight,
  PanelLeft,
} from 'lucide-react';
import { AppSettings, AppLanguage, AppTheme } from '../types';
import { getLocale } from '../locales';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => void;
  language: AppLanguage;
  theme?: AppTheme;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  language,
  theme = 'dark',
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'editor' | 'terminal' | 'execution'>('general');
  const [localSettings, setLocalSettings] = useState<AppSettings>({ ...settings });

  // Sync state whenever settings change or modal opens
  useEffect(() => {
    if (isOpen) {
      setLocalSettings({ ...settings });
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const activeTheme = localSettings.theme || settings.theme || theme;
  const isDark = activeTheme === 'dark';
  const activeLang = localSettings.language || settings.language || language;
  const t = getLocale(activeLang);

  const handleSave = () => {
    onSaveSettings(localSettings);
    onClose();
  };

  const fontOptions = [
    "'Fira Code', monospace",
    "'JetBrains Mono', monospace",
    "'Source Code Pro', monospace",
    "'Courier New', monospace",
    "monospace",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div
        id="ilmhub-settings-modal"
        className={`flex flex-col h-[520px] w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden transition-all ${
          isDark
            ? 'border-[#1E3A5F] bg-[#071A2F] text-slate-100'
            : 'border-slate-300 bg-white text-slate-900'
        }`}
      >
        {/* Modal Header */}
        <div
          className={`flex h-14 items-center justify-between border-b px-5 select-none ${
            isDark
              ? 'border-[#1E3A5F] bg-[#0B2747]'
              : 'border-slate-200 bg-slate-100'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            <SettingsIcon className={`h-5 w-5 ${isDark ? 'text-[#FFD43B]' : 'text-sky-600'}`} />
            <h2 className={`text-sm font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {t.settingsModal.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className={`rounded-lg p-1 transition ${
              isDark
                ? 'text-slate-400 hover:bg-[#1E3A5F] hover:text-white'
                : 'text-slate-500 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Content with Tabs */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Tabs */}
          <div
            className={`w-44 border-r p-3 space-y-1 select-none ${
              isDark
                ? 'border-[#1E3A5F] bg-[#051120]'
                : 'border-slate-200 bg-slate-50'
            }`}
          >
            <button
              onClick={() => setActiveTab('general')}
              className={`flex w-full items-center space-x-2 rounded-lg px-3 py-2 text-xs font-medium transition ${
                activeTab === 'general'
                  ? isDark
                    ? 'bg-[#1E3A5F] text-[#FFD43B] font-bold'
                    : 'bg-white text-sky-700 font-bold shadow-xs border border-slate-200'
                  : isDark
                  ? 'text-slate-400 hover:bg-[#0B2747] hover:text-white'
                  : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              <Sliders className="h-4 w-4" />
              <span>{t.settingsModal.generalTab}</span>
            </button>

            <button
              onClick={() => setActiveTab('editor')}
              className={`flex w-full items-center space-x-2 rounded-lg px-3 py-2 text-xs font-medium transition ${
                activeTab === 'editor'
                  ? isDark
                    ? 'bg-[#1E3A5F] text-[#FFD43B] font-bold'
                    : 'bg-white text-sky-700 font-bold shadow-xs border border-slate-200'
                  : isDark
                  ? 'text-slate-400 hover:bg-[#0B2747] hover:text-white'
                  : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              <Code className="h-4 w-4" />
              <span>{t.settingsModal.editorTab}</span>
            </button>

            <button
              onClick={() => setActiveTab('terminal')}
              className={`flex w-full items-center space-x-2 rounded-lg px-3 py-2 text-xs font-medium transition ${
                activeTab === 'terminal'
                  ? isDark
                    ? 'bg-[#1E3A5F] text-[#FFD43B] font-bold'
                    : 'bg-white text-sky-700 font-bold shadow-xs border border-slate-200'
                  : isDark
                  ? 'text-slate-400 hover:bg-[#0B2747] hover:text-white'
                  : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              <TerminalIcon className="h-4 w-4" />
              <span>{t.settingsModal.terminalTab}</span>
            </button>

            <button
              onClick={() => setActiveTab('execution')}
              className={`flex w-full items-center space-x-2 rounded-lg px-3 py-2 text-xs font-medium transition ${
                activeTab === 'execution'
                  ? isDark
                    ? 'bg-[#1E3A5F] text-[#FFD43B] font-bold'
                    : 'bg-white text-sky-700 font-bold shadow-xs border border-slate-200'
                  : isDark
                  ? 'text-slate-400 hover:bg-[#0B2747] hover:text-white'
                  : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              <Cpu className="h-4 w-4" />
              <span>{t.settingsModal.executionTab}</span>
            </button>
          </div>

          {/* Tab Form Fields */}
          <div
            className={`flex-1 overflow-y-auto p-5 text-xs space-y-4 ${
              isDark ? 'bg-[#071A2F]' : 'bg-white'
            }`}
          >
            {/* General Tab */}
            {activeTab === 'general' && (
              <div className="space-y-4">
                <div>
                  <label className={`block font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    {t.settingsModal.language}
                  </label>
                  <select
                    value={localSettings.language}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, language: e.target.value as AppLanguage })
                    }
                    className={`w-full rounded-lg border p-2 outline-none transition ${
                      isDark
                        ? 'border-[#1E3A5F] bg-[#07111F] text-slate-200 focus:border-[#FFD43B]'
                        : 'border-slate-300 bg-white text-slate-900 focus:border-sky-600'
                    }`}
                  >
                    <option value="en">English (EN)</option>
                    <option value="uz">O‘zbekcha (Lotin / UZ)</option>
                    <option value="ru">Русский (RU)</option>
                    <option value="uz-cyrl">Ўзбекча (Кирилл / ЎЗ)</option>
                  </select>
                </div>

                <div>
                  <label className={`block font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    {t.settingsModal.theme}
                  </label>
                  <select
                    value={localSettings.theme}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, theme: e.target.value as AppTheme })
                    }
                    className={`w-full rounded-lg border p-2 outline-none transition ${
                      isDark
                        ? 'border-[#1E3A5F] bg-[#07111F] text-slate-200 focus:border-[#FFD43B]'
                        : 'border-slate-300 bg-white text-slate-900 focus:border-sky-600'
                    }`}
                  >
                    <option value="dark">{t.settingsModal.themeDark}</option>
                    <option value="light">{t.settingsModal.themeLight}</option>
                  </select>
                </div>

                <div
                  className={`flex items-center justify-between pt-2 border-t ${
                    isDark ? 'border-[#1E3A5F]/50' : 'border-slate-200'
                  }`}
                >
                  <div>
                    <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      {t.settingsModal.autosave}
                    </span>
                    <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Save code state in browser local storage
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={localSettings.autosave}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, autosave: e.target.checked })
                    }
                    className="h-4 w-4 rounded accent-[#0284C7] dark:accent-[#FFD43B]"
                  />
                </div>
              </div>
            )}

            {/* Editor Tab */}
            {activeTab === 'editor' && (
              <div className="space-y-4">
                <div>
                  <label className={`block font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    {t.settingsModal.fontSize} ({localSettings.fontSize}px)
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="24"
                    step="1"
                    value={localSettings.fontSize}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, fontSize: parseInt(e.target.value, 10) })
                    }
                    className="w-full accent-[#0284C7] dark:accent-[#FFD43B]"
                  />
                  <div className={`flex justify-between text-[10px] mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    <span>10px</span>
                    <span>14px ({t.defaultLabel})</span>
                    <span>24px</span>
                  </div>
                </div>

                <div>
                  <label className={`block font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    {t.settingsModal.editorFont}
                  </label>
                  <select
                    value={localSettings.editorFont}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, editorFont: e.target.value })
                    }
                    className={`w-full rounded-lg border p-2 outline-none font-mono transition ${
                      isDark
                        ? 'border-[#1E3A5F] bg-[#07111F] text-slate-200 focus:border-[#FFD43B]'
                        : 'border-slate-300 bg-white text-slate-900 focus:border-sky-600'
                    }`}
                  >
                    {fontOptions.map((f, idx) => (
                      <option key={idx} value={f}>
                        {f.split(',')[0].replace(/'/g, '')}
                      </option>
                    ))}
                  </select>
                </div>

                <div
                  className={`flex items-center justify-between pt-2 border-t ${
                    isDark ? 'border-[#1E3A5F]/50' : 'border-slate-200'
                  }`}
                >
                  <div>
                    <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      {t.settingsModal.wordWrap}
                    </span>
                    <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Wrap long lines to fit editor viewport
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={localSettings.wordWrap}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, wordWrap: e.target.checked })
                    }
                    className="h-4 w-4 rounded accent-[#0284C7] dark:accent-[#FFD43B]"
                  />
                </div>

                <div
                  className={`flex items-center justify-between pt-2 border-t ${
                    isDark ? 'border-[#1E3A5F]/50' : 'border-slate-200'
                  }`}
                >
                  <div>
                    <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      {t.settingsModal.minimap}
                    </span>
                    <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Display mini code preview on the right
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={localSettings.minimap}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, minimap: e.target.checked })
                    }
                    className="h-4 w-4 rounded accent-[#0284C7] dark:accent-[#FFD43B]"
                  />
                </div>
              </div>
            )}

            {/* Terminal Tab */}
            {activeTab === 'terminal' && (
              <div className="space-y-4">
                <div>
                  <label className={`block font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    {t.settingsModal.terminalPosition || 'Terminal Position & Layout'}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {/* Left Split */}
                    <button
                      type="button"
                      onClick={() =>
                        setLocalSettings({ ...localSettings, terminalPosition: 'left' })
                      }
                      className={`flex flex-col items-center justify-center rounded-xl border p-3 text-center transition ${
                        localSettings.terminalPosition === 'left'
                          ? isDark
                            ? 'border-[#FFD43B] bg-[#FFD43B]/10 text-white'
                            : 'border-sky-600 bg-sky-50 text-sky-900 font-bold shadow-xs'
                          : isDark
                          ? 'border-[#1E3A5F] bg-[#07111F] text-slate-400 hover:border-slate-500 hover:text-white'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:text-slate-900'
                      }`}
                    >
                      <PanelLeft className={`h-6 w-6 mb-1.5 ${
                        localSettings.terminalPosition === 'left'
                          ? isDark ? 'text-[#FFD43B]' : 'text-sky-600'
                          : isDark ? 'text-slate-400' : 'text-slate-500'
                      }`} />
                      <span className={`font-semibold text-xs ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                        {t.layoutLeftShort || 'Left Split'}
                      </span>
                      <span className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {t.terminalLeftCodeRight}
                      </span>
                    </button>

                    {/* Bottom Split */}
                    <button
                      type="button"
                      onClick={() =>
                        setLocalSettings({ ...localSettings, terminalPosition: 'bottom' })
                      }
                      className={`flex flex-col items-center justify-center rounded-xl border p-3 text-center transition ${
                        localSettings.terminalPosition === 'bottom'
                          ? isDark
                            ? 'border-[#FFD43B] bg-[#FFD43B]/10 text-white'
                            : 'border-sky-600 bg-sky-50 text-sky-900 font-bold shadow-xs'
                          : isDark
                          ? 'border-[#1E3A5F] bg-[#07111F] text-slate-400 hover:border-slate-500 hover:text-white'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:text-slate-900'
                      }`}
                    >
                      <PanelBottom className={`h-6 w-6 mb-1.5 ${
                        localSettings.terminalPosition === 'bottom'
                          ? isDark ? 'text-[#FFD43B]' : 'text-sky-600'
                          : isDark ? 'text-slate-400' : 'text-slate-500'
                      }`} />
                      <span className={`font-semibold text-xs ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                        {t.layoutBottomShort || 'Down (Bottom)'}
                      </span>
                      <span className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {t.codeTopTerminalBelow}
                      </span>
                    </button>

                    {/* Right Split */}
                    <button
                      type="button"
                      onClick={() =>
                        setLocalSettings({ ...localSettings, terminalPosition: 'right' })
                      }
                      className={`flex flex-col items-center justify-center rounded-xl border p-3 text-center transition ${
                        localSettings.terminalPosition === 'right'
                          ? isDark
                            ? 'border-[#FFD43B] bg-[#FFD43B]/10 text-white'
                            : 'border-sky-600 bg-sky-50 text-sky-900 font-bold shadow-xs'
                          : isDark
                          ? 'border-[#1E3A5F] bg-[#07111F] text-slate-400 hover:border-slate-500 hover:text-white'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:text-slate-900'
                      }`}
                    >
                      <PanelRight className={`h-6 w-6 mb-1.5 ${
                        localSettings.terminalPosition === 'right'
                          ? isDark ? 'text-[#FFD43B]' : 'text-sky-600'
                          : isDark ? 'text-slate-400' : 'text-slate-500'
                      }`} />
                      <span className={`font-semibold text-xs ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                        {t.layoutRightShort || 'Right Split'}
                      </span>
                      <span className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {t.codeLeftTerminalRight}
                      </span>
                    </button>
                  </div>
                </div>

                <div className={`pt-2 border-t ${isDark ? 'border-[#1E3A5F]/50' : 'border-slate-200'}`}>
                  <label className={`block font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    {t.settingsModal.terminalFontSize} ({localSettings.terminalFontSize}px)
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="20"
                    step="1"
                    value={localSettings.terminalFontSize}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        terminalFontSize: parseInt(e.target.value, 10),
                      })
                    }
                    className="w-full accent-[#0284C7] dark:accent-[#FFD43B]"
                  />
                </div>

                <div
                  className={`flex items-center justify-between pt-2 border-t ${
                    isDark ? 'border-[#1E3A5F]/50' : 'border-slate-200'
                  }`}
                >
                  <div>
                    <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      {t.settingsModal.clearOnRun}
                    </span>
                    <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {t.clearOutputHint}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={localSettings.clearOnRun}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, clearOnRun: e.target.checked })
                    }
                    className="h-4 w-4 rounded accent-[#0284C7] dark:accent-[#FFD43B]"
                  />
                </div>

                <div
                  className={`flex items-center justify-between pt-2 border-t ${
                    isDark ? 'border-[#1E3A5F]/50' : 'border-slate-200'
                  }`}
                >
                  <div>
                    <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      {t.settingsModal.showTimestamps}
                    </span>
                    <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {t.timestampsHint}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={localSettings.showTimestamps}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, showTimestamps: e.target.checked })
                    }
                    className="h-4 w-4 rounded accent-[#0284C7] dark:accent-[#FFD43B]"
                  />
                </div>
              </div>
            )}

            {/* Execution Tab */}
            {activeTab === 'execution' && (
              <div className="space-y-4">
                <div>
                  <label className={`block font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    {t.settingsModal.timeoutSeconds} ({localSettings.timeoutSeconds}s)
                  </label>
                  <input
                    type="range"
                    min="3"
                    max="30"
                    step="1"
                    value={localSettings.timeoutSeconds}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        timeoutSeconds: parseInt(e.target.value, 10),
                      })
                    }
                    className="w-full accent-[#0284C7] dark:accent-[#FFD43B]"
                  />
                  <p className={`text-[11px] mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {t.timeoutHint}
                  </p>
                </div>

                <div>
                  <label className={`block font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    {t.settingsModal.maxOutputSize} ({localSettings.maxOutputSizeKB} KB)
                  </label>
                  <input
                    type="range"
                    min="100"
                    max="2048"
                    step="100"
                    value={localSettings.maxOutputSizeKB}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        maxOutputSizeKB: parseInt(e.target.value, 10),
                      })
                    }
                    className="w-full accent-[#0284C7] dark:accent-[#FFD43B]"
                  />
                  <p className={`text-[11px] mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {t.outputBufferHint}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div
          className={`flex h-14 items-center justify-end border-t px-5 space-x-3 select-none ${
            isDark
              ? 'border-[#1E3A5F] bg-[#0B2747]'
              : 'border-slate-200 bg-slate-100'
          }`}
        >
          <button
            onClick={onClose}
            className={`rounded-lg border px-4 py-2 text-xs font-semibold transition ${
              isDark
                ? 'border-[#1E3A5F] text-slate-300 hover:bg-[#1E3A5F]'
                : 'border-slate-300 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {t.cancel}
          </button>

          <button
            onClick={handleSave}
            className={`flex items-center space-x-1.5 rounded-lg px-5 py-2 text-xs font-bold shadow transition active:scale-95 ${
              isDark
                ? 'bg-[#FFD43B] hover:bg-amber-300 text-[#071A2F]'
                : 'bg-sky-600 hover:bg-sky-700 text-white'
            }`}
          >
            <Check className="h-4 w-4" />
            <span>{t.settingsModal.saveSettings}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
