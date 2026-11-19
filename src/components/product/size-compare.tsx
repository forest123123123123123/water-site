import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { catalog, productTitle, type Product } from '@/lib/catalog';
import { formatVolume } from '@/lib/format';
import type { Locale } from '@/lib/locale';
import { cn } from '@/lib/utils';
import { ProductVisual } from './product-visual';

/** Все объёмы рядом в реальных пропорциях; текущий товар выделен. */
export function SizeCompare({ current, className }: { current: Product; className?: string }) {
  const t = useTranslations('product');
  const locale = useLocale() as Locale;
  const items = catalog.filter((p) => p.volume);
  if (items.length < 2) return null;

  return (
    <div className={cn('rounded-card bg-white p-6 shadow-soft ring-1 ring-ink-100 sm:p-8', className)}>
      <h2 className="text-lg font-semibold text-ink-950">{t('compareTitle')}</h2>
      <div className="relative mt-6 flex h-56 items-end justify-center gap-4 border-b-2 border-ink-100 sm:h-64 sm:gap-10">
        {items.map((p) => {
          const active = p.id === current.id;
          return (
            <Link
              key={p.id}
              href={`/catalog/${p.slug}`}
              scroll={false}
              aria-label={productTitle(p, locale)}
              className={cn(
                'group relative h-full w-1/4 max-w-[9rem] transition-all duration-500',
                active ? 'opacity-100' : 'opacity-35 grayscale-[0.4] hover:opacity-70',
              )}
            >
              <ProductVisual product={p} animated={active} />
            </Link>
          );
        })}
      </div>
      <div className="flex justify-center gap-4 sm:gap-10">
        {items.map((p) => (
          <p
            key={p.id}
            className={cn(
              'mt-3 w-1/4 max-w-[9rem] text-center font-display text-sm font-semibold',
              p.id === current.id ? 'text-ink-950' : 'text-ink-400',
            )}
          >
            {formatVolume(p.volume ?? 0, locale)}
          </p>
        ))}
      </div>
      <p className="mt-4 text-xs text-ink-400">{t('compareHint')}</p>
    </div>
  );
}
