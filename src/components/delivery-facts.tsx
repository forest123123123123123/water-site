import { deliveryConfig } from '@config/delivery';
import type { DeliveryInfoKey } from '@config/types';
import { CalendarClock, Clock, CreditCard, MapPin, Package, Recycle, Wallet, type LucideIcon } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { hasText, tr, type Locale } from '@/lib/locale';
import { cn } from '@/lib/utils';

const INFO: { key: DeliveryInfoKey; Icon: LucideIcon }[] = [
  { key: 'time', Icon: Clock },
  { key: 'hours', Icon: CalendarClock },
  { key: 'cost', Icon: Wallet },
  { key: 'minOrder', Icon: Package },
  { key: 'payment', Icon: CreditCard },
  { key: 'containers', Icon: Recycle },
];

const filledInfo = INFO.filter(({ key }) => hasText(deliveryConfig.info[key]));

/** Есть ли хоть одно заполненное условие доставки, кроме города. */
export const hasDeliveryInfo = filledInfo.length > 0 || deliveryConfig.extra.length > 0;

/**
 * Условия доставки из config/delivery.ts: город и заполненные пункты.
 * limit — краткая версия для главной (без дополнительных пунктов).
 */
export function DeliveryFacts({ limit, className }: { limit?: number; className?: string }) {
  const t = useTranslations('delivery');
  const locale = useLocale() as Locale;
  const zones = deliveryConfig.zones.filter((z) => hasText(z));
  const extra = limit === undefined ? deliveryConfig.extra : [];

  return (
    <ul className={cn('grid gap-3 sm:grid-cols-2 lg:grid-cols-3', className)}>
      <Fact Icon={MapPin} title={t('city')} highlight>
        <span className="font-semibold text-ink-950">{tr(deliveryConfig.city, locale)}</span>
        {zones.length > 0 && (
          <span className="mt-2 flex flex-wrap gap-1.5">
            {zones.map((z, i) => (
              <span key={i} className="rounded-full bg-sea-50 px-2.5 py-1 text-[0.8rem] font-medium text-sea-800">
                {tr(z, locale)}
              </span>
            ))}
          </span>
        )}
      </Fact>
      {filledInfo.slice(0, limit).map(({ key, Icon }) => (
        <Fact key={key} Icon={Icon} title={t(key)}>
          {tr(deliveryConfig.info[key], locale)}
        </Fact>
      ))}
      {extra.map((item, i) => (
        <Fact key={`extra-${i}`} Icon={Package} title={tr(item.title, locale)}>
          {tr(item.text, locale)}
        </Fact>
      ))}
    </ul>
  );
}

function Fact({ Icon, title, children, highlight }: { Icon: LucideIcon; title: string; children: ReactNode; highlight?: boolean }) {
  return (
    <li className="flex gap-4 rounded-2xl bg-white p-5 shadow-soft ring-1 ring-ink-100 sm:p-6">
      <span
        className={cn(
          'grid size-11 shrink-0 place-items-center rounded-xl',
          highlight ? 'bg-sea-500 text-white' : 'bg-sea-50 text-sea-700',
        )}
      >
        <Icon className="size-5" strokeWidth={1.8} aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink-500">{title}</p>
        <div className="mt-1 flex flex-col items-start leading-relaxed text-ink-800">{children}</div>
      </div>
    </li>
  );
}
