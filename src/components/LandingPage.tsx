import React, { useState } from 'react';
import {
  Code2,
  Play,
  Terminal,
  ShieldAlert,
  Globe,
  Sun,
  Moon,
  Zap,
  ArrowRight,
  Cpu,
  Layers,
  Sparkles,
} from 'lucide-react';
import { AppLanguage, AppTheme } from '../types';
import { getLocale } from '../locales';

interface LandingPageProps {
  onStartCoding: () => void;
  language: AppLanguage;
  onLanguageChange: (lang: AppLanguage) => void;
  theme: AppTheme;
  onThemeToggle: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartCoding,
  language,
  onLanguageChange,
  theme,
  onThemeToggle,
}) => {
  const t = getLocale(language);
  const isDark = theme === 'dark';
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);

  const languages: Array<{ code: AppLanguage; label: string; flag: string }> = [
    { code: 'en', label: 'English', flag: 'EN' },
    { code: 'uz', label: 'O‘zbekcha', flag: 'UZ' },
    { code: 'ru', label: 'Русский', flag: 'RU' },
    { code: 'uz-cyrl', label: 'Ўзбекча', flag: 'ЎЗ' },
  ];

  const currentLangObj = languages.find((l) => l.code === language) || languages[0];

  return (
    <div
      id="ilmhub-landing-page"
      className={`flex flex-col min-h-screen w-full transition-colors duration-150 ${
        isDark
          ? 'bg-[#071A2F] text-white selection:bg-[#FFD43B] selection:text-[#071A2F]'
          : 'bg-slate-50 text-slate-900 selection:bg-amber-400 selection:text-slate-950'
      }`}
    >
      {/* Top Navbar */}
      <header
        className={`flex h-16 w-full items-center justify-between border-b px-4 sm:px-8 lg:px-12 backdrop-blur sticky top-0 z-30 transition-colors ${
          isDark
            ? 'border-[#1E3A5F] bg-[#071A2F]/90 text-white'
            : 'border-slate-200 bg-white/90 text-slate-900 shadow-xs'
        }`}
      >
        <div
          onClick={onStartCoding}
          className="flex cursor-pointer items-center space-x-2.5 rounded-lg py-1 px-1.5 transition hover:opacity-90"
        >
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-xl border shadow-inner ${
              isDark
                ? 'bg-[#0B2747] border-[#FFD43B]/40 text-[#FFD43B]'
                : 'bg-amber-50 border-amber-300 text-amber-600'
            }`}
          >
            <Code2 className="h-5 w-5" />
          </div>
          <div className="flex items-baseline font-mono font-black text-2xl tracking-tight">
            <span className={isDark ? 'text-white' : 'text-slate-900'}>ILM</span>
            <span className={isDark ? 'text-[#FFD43B]' : 'text-amber-600'}>HUB</span>
          </div>
        </div>

        {/* Right Nav Actions */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Language Selector */}
          <div className="relative">
            <button
              onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
              className={`flex items-center space-x-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
                isDark
                  ? 'border-[#1E3A5F] bg-[#0B2747] text-slate-200 hover:bg-[#133863]'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
              }`}
              title="Change Language"
            >
              <Globe className="h-3.5 w-3.5" />
              <span>{currentLangObj.flag}</span>
            </button>

            {isLangDropdownOpen && (
              <div
                className={`absolute right-0 mt-1.5 w-36 rounded-xl border p-1 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100 ${
                  isDark
                    ? 'border-[#1E3A5F] bg-[#0B2747] text-slate-200'
                    : 'border-slate-200 bg-white text-slate-800'
                }`}
              >
                {languages.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => {
                      onLanguageChange(l.code);
                      setIsLangDropdownOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                      language === l.code
                        ? isDark
                          ? 'bg-[#1E3A5F] text-[#FFD43B] font-bold'
                          : 'bg-amber-50 text-amber-700 font-bold'
                        : isDark
                        ? 'hover:bg-[#071A2F]'
                        : 'hover:bg-slate-100'
                    }`}
                  >
                    <span>{l.label}</span>
                    <span className="font-mono text-[10px] opacity-60">{l.flag}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={onThemeToggle}
            className={`rounded-lg border p-2 text-xs transition ${
              isDark
                ? 'border-[#1E3A5F] bg-[#0B2747] text-[#FFD43B] hover:bg-[#133863]'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
            }`}
            title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* Start Coding Button */}
          <button
            onClick={onStartCoding}
            className={`flex items-center space-x-2 rounded-xl px-4 sm:px-5 py-2 text-xs sm:text-sm font-bold shadow-md transition active:scale-95 ${
              isDark
                ? 'bg-[#FFD43B] hover:bg-amber-300 text-[#071A2F]'
                : 'bg-amber-500 hover:bg-amber-600 text-white'
            }`}
          >
            <Play className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-current" />
            <span>{t.landing.startCoding}</span>
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-10 sm:py-16 text-center max-w-5xl mx-auto w-full">
        <div
          className={`inline-flex items-center space-x-2 rounded-full border px-3.5 py-1 text-xs font-semibold mb-6 shadow-xs ${
            isDark
              ? 'border-[#FFD43B]/30 bg-[#0B2747]/80 text-[#FFD43B]'
              : 'border-amber-300 bg-amber-50 text-amber-800'
          }`}
        >
          <Zap className="h-3.5 w-3.5" />
          <span>{t.appName}</span>
        </div>

        <h1
          className={`text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight font-sans ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}
        >
          <strong>{t.landing.heroTitle}</strong>
        </h1>

        <p
          className={`mt-4 sm:mt-5 text-sm sm:text-lg max-w-3xl leading-relaxed ${
            isDark ? 'text-slate-300' : 'text-slate-600'
          }`}
        >
          {t.landing.heroSubtitle}
        </p>

        <p
          className={`mt-3 max-w-3xl text-sm sm:text-base leading-relaxed ${
            isDark ? 'text-slate-300' : 'text-slate-600'
          }`}
        >
          {t.landing.heroDescription.split('Run')[0]}
          <strong>Run</strong>
          {t.landing.heroDescription.split('Run')[1]}
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <button
            onClick={onStartCoding}
            className={`flex w-full sm:w-auto items-center justify-center space-x-2 rounded-xl px-7 py-3.5 text-base font-bold shadow-xl transition active:scale-95 ${
              isDark
                ? 'bg-[#FFD43B] hover:bg-amber-300 text-[#071A2F]'
                : 'bg-amber-500 hover:bg-amber-600 text-white'
            }`}
          >
            <Play className="h-5 w-5 fill-current" />
            <span>{t.landing.startCoding}</span>
          </button>
        </div>

        {/* Interactive Editor Mock / Preview */}
        <div
          className={`mt-10 w-full rounded-2xl border shadow-2xl overflow-hidden text-left font-mono transition-colors ${
            isDark
              ? 'border-[#1E3A5F] bg-[#050B14]'
              : 'border-slate-300 bg-slate-900 text-slate-200'
          }`}
        >
          <div
            className={`flex h-9 items-center justify-between border-b px-4 select-none ${
              isDark
                ? 'border-[#1E3A5F] bg-[#071424]'
                : 'border-slate-700 bg-slate-800'
            }`}
          >
            <div className="flex items-center space-x-2">
              <span className="h-3 w-3 rounded-full bg-rose-500/90" />
              <span className="h-3 w-3 rounded-full bg-amber-500/90" />
              <span className="h-3 w-3 rounded-full bg-emerald-500/90" />
              <span className="text-xs text-slate-400 ml-2">main.py</span>
            </div>
            <button
              onClick={onStartCoding}
              className={`flex items-center space-x-1.5 rounded-md px-2.5 py-1 text-xs font-bold transition ${
                isDark
                  ? 'bg-[#FFD43B] text-[#071A2F] hover:bg-amber-300'
                  : 'bg-amber-500 text-white hover:bg-amber-600'
              }`}
            >
              <Play className="h-3 w-3 fill-current" />
              <span>{t.run}</span>
            </button>
          </div>
          <div className="p-4 sm:p-5 text-xs sm:text-sm text-slate-200 leading-relaxed overflow-x-auto">
            <pre>
              <span className="text-amber-400">ism</span> = <span className="text-sky-300">input</span>(<span className="text-emerald-300">"Ismingizni kiriting: "</span>){'\n'}
              <span className="text-sky-300">print</span>(<span className="text-emerald-300">f"Salom, &#123;ism&#125;! ILMHUB Python muharririga xush kelibsiz."</span>){'\n\n'}
              <span className="text-slate-400"># Barcha Python 3 sintaksislari va modullari qo'llab-quvvatlanadi</span>{'\n'}
              <span className="text-amber-400">kvadratlar</span> = [x**<span className="text-amber-300">2</span> <span className="text-amber-400">for</span> x <span className="text-amber-400">in</span> <span className="text-sky-300">range</span>(<span className="text-amber-300">1</span>, <span className="text-amber-300">6</span>)]{'\n'}
              <span className="text-sky-300">print</span>(<span className="text-emerald-300">"Kvadratlar:"</span>, kvadratlar)
            </pre>
          </div>
        </div>

        {/* 4 Feature Pillars */}
        <section className="mt-16 w-full text-left">
          <h2
            className={`text-xl sm:text-2xl font-bold text-center mb-8 ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            {t.landing.featuresTitle}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div
              className={`rounded-2xl border p-5 transition-all hover:scale-[1.01] ${
                isDark
                  ? 'border-[#1E3A5F] bg-[#0B2747]/60 hover:border-[#FFD43B]/40'
                  : 'border-slate-200 bg-white hover:border-amber-400 shadow-xs'
              }`}
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl mb-3 ${
                  isDark
                    ? 'bg-[#FFD43B]/10 text-[#FFD43B]'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                <Terminal className="h-5 w-5" />
              </div>
              <h3
                className={`text-sm font-bold mb-1.5 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                {t.landing.feature1Title}
              </h3>
              <p
                className={`text-xs leading-relaxed ${
                  isDark ? 'text-slate-300' : 'text-slate-600'
                }`}
              >
                {t.landing.feature1Desc}
              </p>
            </div>

            <div
              className={`rounded-2xl border p-5 transition-all hover:scale-[1.01] ${
                isDark
                  ? 'border-[#1E3A5F] bg-[#0B2747]/60 hover:border-rose-400/40'
                  : 'border-slate-200 bg-white hover:border-rose-400 shadow-xs'
              }`}
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl mb-3 ${
                  isDark
                    ? 'bg-rose-500/10 text-rose-400'
                    : 'bg-rose-100 text-rose-700'
                }`}
              >
                <ShieldAlert className="h-5 w-5" />
              </div>
              <h3
                className={`text-sm font-bold mb-1.5 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                {t.landing.feature2Title}
              </h3>
              <p
                className={`text-xs leading-relaxed ${
                  isDark ? 'text-slate-300' : 'text-slate-600'
                }`}
              >
                {t.landing.feature2Desc}
              </p>
            </div>

            <div
              className={`rounded-2xl border p-5 transition-all hover:scale-[1.01] ${
                isDark
                  ? 'border-[#1E3A5F] bg-[#0B2747]/60 hover:border-amber-400/40'
                  : 'border-slate-200 bg-white hover:border-amber-400 shadow-xs'
              }`}
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl mb-3 ${
                  isDark
                    ? 'bg-amber-500/10 text-amber-400'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                <Cpu className="h-5 w-5" />
              </div>
              <h3
                className={`text-sm font-bold mb-1.5 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                {t.landing.feature3Title}
              </h3>
              <p
                className={`text-xs leading-relaxed ${
                  isDark ? 'text-slate-300' : 'text-slate-600'
                }`}
              >
                {t.landing.feature3Desc}
              </p>
            </div>

            <div
              className={`rounded-2xl border p-5 transition-all hover:scale-[1.01] ${
                isDark
                  ? 'border-[#1E3A5F] bg-[#0B2747]/60 hover:border-sky-400/40'
                  : 'border-slate-200 bg-white hover:border-sky-400 shadow-xs'
              }`}
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl mb-3 ${
                  isDark
                    ? 'bg-sky-500/10 text-sky-400'
                    : 'bg-sky-100 text-sky-700'
                }`}
              >
                <Globe className="h-5 w-5" />
              </div>
              <h3
                className={`text-sm font-bold mb-1.5 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                {t.landing.feature4Title}
              </h3>
              <p
                className={`text-xs leading-relaxed ${
                  isDark ? 'text-slate-300' : 'text-slate-600'
                }`}
              >
                {t.landing.feature4Desc}
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer
        className={`border-t py-6 text-center text-xs font-mono transition-colors ${
          isDark
            ? 'border-[#1E3A5F] text-slate-500 bg-[#05111F]'
            : 'border-slate-200 text-slate-500 bg-white'
        }`}
      >
        © 2026 ILMHUB. Online Python 3 IDE & Execution Engine.
      </footer>
    </div>
  );
};
