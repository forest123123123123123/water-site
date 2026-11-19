'use client';

import { ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ButtonLink } from '@/components/ui/button';
import { useCart, useCartHydrated } from '@/lib/cart/store';

/** «Перейти в корзину» — появляется, когда в корзине уже что-то есть. */
export function CartLink({ size = 'lg', className }: { size?: 'md' | 'lg'; className?: string }) {
  const t = useTranslations('product');
  const hydrated = useCartHydrated();
  const hasItems = useCart((s) => s.lines.length > 0);
  if (!hydrated || !hasItems) return null;

  return (
    <ButtonLink href="/cart" variant="dark" size={size} className={className}>
      {t('toCart')}
      <ArrowRight className="size-5" aria-hidden />
    </ButtonLink>
  );
}
