import { useTranslations } from 'next-intl';
import type { Product } from '@/lib/catalog';
import { cn } from '@/lib/utils';

export function StockBadge({ product, className }: { product: Product; className?: string }) {
  const t = useTranslations('common');
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.78rem] font-semibold',
        product.inStock ? 'bg-mint-50 text-[#0b7a5b]' : 'bg-ink-100 text-ink-500',
        className,
      )}
    >
      <span className={cn('size-1.5 rounded-full', product.inStock ? 'bg-mint-500' : 'bg-ink-400')} aria-hidden />
      {product.inStock ? t('inStock') : t('outOfStock')}
    </span>
  );
}
