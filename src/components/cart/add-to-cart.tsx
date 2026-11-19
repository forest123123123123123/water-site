'use client';

import { Plus } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useRef } from 'react';
import { buttonStyles } from '@/components/ui/button';
import { productTitle, type Product } from '@/lib/catalog';
import { useLineQty } from '@/lib/cart/store';
import { cn } from '@/lib/utils';
import { QuantityStepper } from './quantity-stepper';
import { useCartActions } from './use-cart-actions';

/**
 * Кнопка «В корзину», которая после нажатия превращается в счётчик.
 * Счётчик всегда показывает реальное количество в корзине — без двусмысленности
 * «сколько я выбрал» и «сколько уже лежит в корзине».
 */
export function AddToCart({
  product,
  size = 'md',
  stretch = false,
  long = false,
  className,
}: {
  product: Product;
  size?: 'sm' | 'md' | 'lg';
  stretch?: boolean;
  long?: boolean;
  className?: string;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const qty = useLineQty(product.id);
  const { add, setQty } = useCartActions();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const title = productTitle(product, locale);

  if (!product.inStock) {
    return (
      <button type="button" disabled className={buttonStyles({ variant: 'outline', size, className: cn(stretch && 'w-full', className) })}>
        {t('common.outOfStock')}
      </button>
    );
  }

  if (qty > 0) {
    return (
      <QuantityStepper
        key="stepper"
        value={qty}
        onChange={(n) => setQty(product.id, n)}
        label={title}
        size={size}
        stretch={stretch}
        className={cn('animate-fade-in', className)}
      />
    );
  }

  return (
    <button
      key="button"
      ref={buttonRef}
      type="button"
      onClick={() => add(product.id, 1, buttonRef.current)}
      aria-label={`${t('cart.addLong')}: ${title}`}
      className={buttonStyles({ variant: 'primary', size, className: cn('animate-fade-in', stretch && 'w-full', className) })}
    >
      <Plus className="size-[1.1em]" aria-hidden />
      {long ? t('cart.addLong') : t('cart.add')}
    </button>
  );
}
