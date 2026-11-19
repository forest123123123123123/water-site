'use client';

import { ShoppingBag } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useCart, useCartHydrated } from '@/lib/cart/store';
import { cn } from '@/lib/utils';

/** Кнопка корзины в шапке: счётчик штук, «пружинит», когда в корзину что-то падает. */
export function CartButton({ className }: { className?: string }) {
  const t = useTranslations('cart');
  const hydrated = useCartHydrated();
  const units = useCart((s) => s.lines.reduce((sum, l) => sum + l.qty, 0));
  const count = hydrated ? units : 0;

  return (
    <Link
      href="/cart"
      data-cart-target
      aria-label={t('buttonLabel', { count })}
      className={cn(
        'relative inline-flex h-11 items-center gap-2 rounded-full bg-ink-900 pr-4 pl-3.5 text-sm font-semibold text-white',
        'transition-[background-color,transform] duration-300 hover:bg-ink-800 active:scale-95',
        className,
      )}
    >
      <ShoppingBag className="size-[1.15rem]" aria-hidden />
      <span className="hidden sm:inline">{t('title')}</span>
      <span
        aria-hidden
        className={cn(
          'grid h-6 min-w-6 place-items-center rounded-full px-1.5 font-display text-[0.75rem] leading-none tabular-nums transition-colors',
          count > 0 ? 'bg-sea-400 text-ink-950' : 'bg-white/15 text-white/80',
        )}
      >
        {count}
      </span>
    </Link>
  );
}
