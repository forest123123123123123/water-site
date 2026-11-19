'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useCallback } from 'react';
import { toast } from 'sonner';
import { useRouter } from '@/i18n/navigation';
import { getProductById, productTitle } from '@/lib/catalog';
import { useCart } from '@/lib/cart/store';
import { bumpCartTargets, flyToCart } from './fly-to-cart';

/** Действия с корзиной вместе с обратной связью: анимация, уведомления, «Вернуть». */
export function useCartActions() {
  const t = useTranslations('cart');
  const locale = useLocale();
  const router = useRouter();

  const titleOf = useCallback(
    (id: string) => {
      const product = getProductById(id);
      return product ? productTitle(product, locale) : id;
    },
    [locale],
  );

  const add = useCallback(
    (id: string, qty = 1, origin?: HTMLElement | null) => {
      const wasInCart = useCart.getState().lines.some((l) => l.id === id);
      useCart.getState().add(id, qty);
      flyToCart(origin ?? null);
      if (!wasInCart) {
        toast(t('added', { title: titleOf(id) }), {
          id: `added-${id}`,
          action: { label: t('open'), onClick: () => router.push('/cart') },
        });
      }
    },
    [router, t, titleOf],
  );

  const remove = useCallback(
    (id: string) => {
      const { lines } = useCart.getState();
      const index = lines.findIndex((l) => l.id === id);
      if (index === -1) return;
      const line = lines[index];
      useCart.getState().remove(id);
      toast(t('removed', { title: titleOf(id) }), {
        id: `removed-${id}`,
        action: { label: t('undo'), onClick: () => useCart.getState().restore(line, index) },
      });
    },
    [t, titleOf],
  );

  const setQty = useCallback(
    (id: string, qty: number) => {
      if (qty <= 0) {
        remove(id);
        return;
      }
      const before = useCart.getState().lines.find((l) => l.id === id)?.qty ?? 0;
      useCart.getState().setQty(id, qty);
      if (qty > before) bumpCartTargets();
    },
    [remove],
  );

  return { add, setQty, remove };
}
