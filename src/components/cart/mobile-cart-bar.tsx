'use client';

import { ArrowRight, ShoppingBag } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { computeCart } from '@/lib/cart/compute';
import { useCart, useCartHydrated } from '@/lib/cart/store';
import { formatPrice, formatVolume } from '@/lib/format';
import { cn } from '@/lib/utils';

const HIDDEN_ON = ['/cart', '/checkout'];

/**
 * Плавающая панель корзины на телефонах: видна, когда в корзине что-то есть.
 * Если сайт принимает заказы, ведёт сразу к оформлению. На страницах корзины и оформления скрыта.
 */
export function MobileCartBar({ acceptsOrders }: { acceptsOrders: boolean }) {
  const t = useTranslations('cart');
  const locale = useLocale();
  const pathname = usePathname();
  const hydrated = useCartHydrated();
  const lines = useCart((s) => s.lines);

  if (!hydrated || lines.length === 0 || HIDDEN_ON.some((p) => pathname.startsWith(p))) return null;

  const cart = computeCart(lines);
  const liters = formatVolume(cart.liters, locale);

  return (
    <>
      {/* Отступ, чтобы панель не перекрывала конец страницы */}
      <div className="h-24 lg:hidden" aria-hidden />
      <div
        className={cn(
          'fixed inset-x-3 z-40 flex items-center gap-3 rounded-[1.4rem] bg-ink-900/95 p-2 pl-3 text-white shadow-lift backdrop-blur-xl lg:hidden',
          'animate-[bar-in_0.5s_var(--ease-fluid)_both]',
        )}
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.75rem)' }}
      >
        <Link href="/cart" className="flex min-w-0 flex-1 items-center gap-3" aria-label={t('open')}>
          <span data-cart-target className="relative grid size-11 shrink-0 place-items-center rounded-full bg-white/10">
            <ShoppingBag className="size-5" aria-hidden />
            <span className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-sea-400 px-1 font-display text-[0.7rem] text-ink-950">
              {cart.units}
            </span>
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-[0.95rem] font-semibold">
              {cart.total != null ? formatPrice(cart.total, locale) : t('barLabel')}
            </span>
            <span className="block truncate text-[0.8rem] text-white/60">
              {t('barSummary', { units: cart.units, liters })}
            </span>
          </span>
        </Link>
        {acceptsOrders && (
          <Link
            href="/checkout"
            className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-[linear-gradient(135deg,var(--color-sea-400),var(--color-sea-600))] px-4 text-[0.9rem] font-semibold text-white"
          >
            {t('checkout')}
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        )}
      </div>
    </>
  );
}
