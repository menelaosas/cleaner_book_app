import { en } from './en';
import { gr } from './gr';

export type Locale = 'en' | 'gr';

export type Translations = typeof en;

export const translations: Record<Locale, Translations> = {
  en,
  gr,
};
