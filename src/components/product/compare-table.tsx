import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { catalog, pricePerLiter, productTitle } from '@/lib/catalog';
import { formatPrice, formatVolume } from '@/lib/format';
import type { Locale } from '@/lib/locale';
import { cn } from '@/lib/utils';

/**
 * Сравнение объёмов: цена и цена за литр считаются автоматически,
 * как только в config/products.ts появятся цены.
 */
export function CompareTable({ className }: { className?: string }) {
  const t = useTranslations('catalog');
  const tc = useTranslations('common');
  const locale = useLocale() as Locale;

  return (
    <div className={cn('overflow-hidden rounded-card bg-white shadow-soft ring-1 ring-ink-100', className)}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[34rem] text-left">
          <caption className="sr-only">{t('compareTitle')}</caption>
          <thead>
            <tr className="border-b border-ink-100 text-sm text-ink-500">
              <th scope="col" className="px-5 py-4 font-medium sm:px-7">{t('compareProduct')}</th>
              <th scope="col" className="px-5 py-4 font-medium">{t('compareVolume')}</th>
              <th scope="col" className="px-5 py-4 font-medium">{t('comparePrice')}</th>
              <th scope="col" className="px-5 py-4 font-medium">{t('comparePerLiter')}</th>
              <th scope="col" className="px-5 py-4 font-medium sm:px-7">{t('compareStock')}</th>
            </tr>
          </thead>
          <tbody>
            {catalog.map((p) => {
              const perLiter = pricePerLiter(p);
              return (
                <tr key={p.id} className="border-b border-ink-100 last:border-0">
                  <th scope="row" className="px-5 py-4 font-semibold text-ink-900 sm:px-7">
                    <Link href={`/catalog/${p.slug}`} className="inline-flex items-center gap-3 hover:text-sea-700">
                      <span className="size-3 shrink-0 rounded-full" style={{ background: p.tone }} aria-hidden />
                      {productTitle(p, locale)}
                    </Link>
                  </th>
                  <td className="px-5 py-4 font-display font-semibold">{p.volume ? formatVolume(p.volume, locale) : '—'}</td>
                  <td className="px-5 py-4">{p.price != null ? formatPrice(p.price, locale) : <span className="text-ink-400">{tc('priceOnRequest')}</span>}</td>
                  <td className="px-5 py-4">{perLiter != null ? formatPrice(perLiter, locale) : <span className="text-ink-400">—</span>}</td>
                  <td className="px-5 py-4 sm:px-7">
                    <span className={cn('text-sm font-semibold', p.inStock ? 'text-[#0b7a5b]' : 'text-ink-400')}>
                      {p.inStock ? tc('inStock') : tc('outOfStock')}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
