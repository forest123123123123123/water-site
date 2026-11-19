import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { catalog, productTitle, type Product } from '@/lib/catalog';
import { formatVolume } from '@/lib/format';
import type { Locale } from '@/lib/locale';
import { cn } from '@/lib/utils';

/** Переключатель объёма на странице товара: каждый объём — своя страница. */
export function VolumeSwitcher({ current, className }: { current: Product; className?: string }) {
  const t = useTranslations('product');
  const locale = useLocale() as Locale;
  const options = catalog.filter((p) => p.volume);
  if (options.length < 2 || !current.volume) return null;

  return (
    <div className={className}>
      <p className="text-sm font-semibold text-ink-500">{t('chooseVolume')}</p>
      <ul className="mt-3 flex flex-wrap gap-2">
        {options.map((p) => {
          const active = p.id === current.id;
          return (
            <li key={p.id}>
              <Link
                href={`/catalog/${p.slug}`}
                scroll={false}
                aria-current={active ? 'page' : undefined}
                aria-label={productTitle(p, locale)}
                className={cn(
                  'inline-flex h-12 items-center gap-2.5 rounded-full px-5 font-display text-[0.95rem] font-semibold transition-all duration-300',
                  active
                    ? 'bg-ink-900 text-white shadow-[0_10px_24px_-12px_rgb(10_26_44_/_0.6)]'
                    : 'bg-white text-ink-800 ring-1 ring-ink-200 hover:ring-sea-300',
                  !p.inStock && !active && 'opacity-60',
                )}
              >
                <span className="size-2.5 rounded-full" style={{ background: p.tone }} aria-hidden />
                {formatVolume(p.volume ?? 0, locale)}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
