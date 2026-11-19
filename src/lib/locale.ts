import type { Locale, Localized } from '@config/types';

export type { Locale, Localized };

export const LOCALES: Locale[] = ['ru', 'uz'];

export function isLocale(value: unknown): value is Locale {
  return value === 'ru' || value === 'uz';
}

/** Текст на нужном языке; если перевода нет — русский вариант, если нет и его — пустая строка. */
export function tr(text: Localized | null | undefined, locale: Locale): string {
  if (!text) return '';
  const value = (text[locale] ?? '').trim();
  return value || (text.ru ?? '').trim();
}

export function hasText(text: Localized | null | undefined): text is Localized {
  return Boolean(text && ((text.ru ?? '').trim() || (text.uz ?? '').trim()));
}

/** Делит текст на абзацы по пустой строке. */
export function paragraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}
