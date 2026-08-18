import { AppLanguage } from '../types';
import { en } from './en';
import { uz } from './uz';
import { ru } from './ru';
import { uzCyrl } from './uz-cyrl';

export const locales = {
  en,
  uz,
  ru,
  'uz-cyrl': uzCyrl,
};

export function getLocale(lang: AppLanguage) {
  return locales[lang] || locales.en;
}
