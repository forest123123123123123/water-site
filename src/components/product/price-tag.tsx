import { useLocale, useTranslations } from 'next-intl';
import { pricePerLiter, type Product } from '@/lib/catalog';
import { formatPrice } from '@/lib/format';
import type { Locale } from '@/lib/locale';
import { cn } from '@/lib/utils';

/**
 * Цена товара. Если цена не задана в config/products.ts — честное «Цена уточняется»,
 * никаких выдуманных сумм. Цена за литр считается автоматически.
 */
export function PriceTag({
  product,
  size = 'md',
  showPerLiter = true,
  className,
}: {
  product: Product;
  size?: 'sm' | 'md' | 'lg';
  showPerLiter?: boolean;
  className?: string;
}) {
  const t = useTranslations('common');
  const locale = useLocale() as Locale;
  const perLiter = pricePerLiter(product);

  if (product.price == null) {
    return (
      <p className={cn('flex items-center gap-2 font-medium text-ink-500', size === 'lg' && 'text-lg', className)}>
        <span className="size-1.5 rounded-full bg-ink-300" aria-hidden />
        {t('priceOnRequest')}
      </p>
    );
  }

  return (
    <p className={cn('flex flex-wrap items-baseline gap-x-3 gap-y-1', className)}>
      <span
        className={cn(
          'font-display font-semibold tracking-[-0.02em] text-ink-950',
          size === 'sm' && 'text-lg',
          size === 'md' && 'text-[1.4rem]',
          size === 'lg' && 'text-[2rem] sm:text-[2.4rem]',
        )}
      >
        {formatPrice(product.price, locale)}
      </span>
      {showPerLiter && perLiter != null && product.volume && product.volume > 1 && (
        <span className="text-sm text-ink-500">{t('perLiter', { price: formatPrice(perLiter, locale) })}</span>
      )}
    </p>
  );
}
