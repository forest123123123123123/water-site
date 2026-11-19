'use client';

import { useLocale, useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { Link } from '@/i18n/navigation';
import type { CartSummary as Summary } from '@/lib/cart/compute';
import { formatPrice, formatVolume } from '@/lib/format';
import type { Locale } from '@/lib/locale';
import { cn } from '@/lib/utils';

/**
 * Итоги корзины. Сумма показывается только если цены известны у всех товаров —
 * иначе честно пишем, что она будет известна позже. Стоимость доставки не выдумываем.
 */
export function CartTotals({ cart, className, children }: { cart: Summary; className?: string; children?: ReactNode }) {
  const t = useTranslations('cart');
  const tc = useTranslations('common');
  const locale = useLocale() as Locale;

  return (
    <div className={cn('rounded-card bg-white p-6 shadow-soft ring-1 ring-ink-100 sm:p-7', className)}>
      <h2 className="font-display text-xl font-semibold tracking-[-0.02em] text-ink-950">{t('summary')}</h2>
      <dl className="mt-5 space-y-3 text-[0.97rem]">
        <Row label={t('units')} value={tc('pieces', { count: cart.units })} />
        <Row label={t('liters')} value={formatVolume(cart.liters, locale)} />
        <Row
          label={t('delivery')}
          value={
            <Link href="/delivery" className="link-underline text-ink-700">
              {t('deliveryTerms')}
            </Link>
          }
        />
      </dl>
      <div className="mt-5 border-t border-dashed border-ink-200 pt-5">
        {cart.total != null ? (
          <div className="flex items-baseline justify-between gap-4">
            <span className="font-semibold text-ink-900">{t('total')}</span>
            <span className="font-display text-[1.7rem] font-semibold tracking-[-0.02em] text-ink-950">
              {formatPrice(cart.total, locale)}
            </span>
          </div>
        ) : (
          <div>
            <span className="font-semibold text-ink-900">{t('total')}</span>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-500">{t('totalUnknown')}</p>
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-ink-500">{label}</dt>
      <dd className="text-right font-semibold text-ink-900">{value}</dd>
    </div>
  );
}
