import { defineRouting } from 'next-intl/routing';

/** Cookie с выбранным языком: proxy использует её при заходе на адрес без префикса. */
export const localeCookie = { name: 'NEXT_LOCALE', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' } as const;

/**
 * Русский — основной язык (адреса без префикса: /catalog),
 * узбекский (латиница) — с префиксом /uz (/uz/catalog).
 */
export const routing = defineRouting({
  locales: ['ru', 'uz'],
  defaultLocale: 'ru',
  localePrefix: 'as-needed',
  localeCookie,
});
