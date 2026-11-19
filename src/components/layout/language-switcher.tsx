'use client';

import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { getPathname, usePathname } from '@/i18n/navigation';
import { localeCookie } from '@/i18n/routing';
import { LOCALES } from '@/lib/locale';
import { cn } from '@/lib/utils';

const LABELS = { ru: 'RU', uz: 'UZ' } as const;
const NAMES = { ru: 'Русский', uz: 'Oʻzbekcha' } as const;

/**
 * Переключатель языка: сохраняет текущую страницу (/catalog ↔ /uz/catalog).
 *
 * Ссылки ведут на канонические адреса. Link из next-intl с пропом locale всегда добавляет
 * префикс (/ru/catalog), который потом редиректит proxy; клиентский роутер Next о таком
 * редиректе не знает и оставляет в адресной строке /ru/catalog.
 * Выбранный язык запоминаем в cookie сами — как это делает Link из next-intl.
 */
export function LanguageSwitcher({ className, tone = 'light' }: { className?: string; tone?: 'light' | 'dark' }) {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations('common');

  return (
    <div
      role="group"
      aria-label={t('language')}
      className={cn(
        'inline-flex h-10 items-center rounded-full p-0.5 sm:h-11 sm:p-1',
        tone === 'light' ? 'bg-ink-100/70' : 'bg-white/10',
        className,
      )}
    >
      {LOCALES.map((l) => {
        const active = l === locale;
        return (
          <Link
            key={l}
            href={getPathname({ href: pathname, locale: l })}
            hrefLang={l}
            scroll={false}
            onClick={() => {
              document.cookie = `${localeCookie.name}=${l}; path=/; max-age=${localeCookie.maxAge}; samesite=${localeCookie.sameSite}`;
            }}
            aria-current={active ? 'true' : undefined}
            title={NAMES[l]}
            className={cn(
              'grid h-9 min-w-9 place-items-center rounded-full px-2 text-[0.8rem] font-bold tracking-wide transition-all duration-300 sm:min-w-11 sm:px-2.5',
              active
                ? tone === 'light'
                  ? 'bg-white text-ink-950 shadow-[0_2px_8px_-2px_rgb(10_26_44_/_0.2)]'
                  : 'bg-white text-ink-950'
                : tone === 'light'
                  ? 'text-ink-500 hover:text-ink-900'
                  : 'text-white/70 hover:text-white',
            )}
          >
            <span lang={l}>{LABELS[l]}</span>
          </Link>
        );
      })}
    </div>
  );
}
