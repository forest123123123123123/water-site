import { ClipboardCheck, Droplets, ShoppingBag, Truck } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { SectionHeading } from '@/components/ui/section-heading';
import { volumeList } from '@/lib/catalog';
import type { Locale } from '@/lib/locale';

const STEPS = [
  { key: 's1', Icon: Droplets },
  { key: 's2', Icon: ShoppingBag },
  { key: 's3', Icon: ClipboardCheck },
  { key: 's4', Icon: Truck },
] as const;

/** «Как заказать»: четыре шага, связанные «течением» — волнистой линией. */
export function Steps() {
  const t = useTranslations('home.steps');
  const volumes = volumeList(useLocale() as Locale, 'disjunction');

  return (
    <section id="how" className="container-page py-16 lg:py-24" aria-labelledby="steps-title">
      <SectionHeading id="steps-title" eyebrow={t('eyebrow')} title={t('title')} />

      <div className="relative mt-12">
        <div className="pointer-events-none absolute top-[2.6rem] right-[calc(25%_-_0.4rem)] left-[6rem] hidden -translate-y-1/2 lg:block" aria-hidden>
          <svg className="h-6 w-full text-sea-200" viewBox="0 0 600 24" preserveAspectRatio="none">
            <path
              d="M0 12 C 50 0, 100 0, 150 12 S 250 24, 300 12 S 400 0, 450 12 S 550 24, 600 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeDasharray="2 9"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {STEPS.map(({ key, Icon }, i) => (
            <li
              key={key}
              className="reveal relative flex gap-5 rounded-card bg-white p-6 shadow-soft ring-1 ring-ink-100 lg:flex-col lg:bg-transparent lg:p-0 lg:shadow-none lg:ring-0"
            >
              <div className="relative shrink-0">
                <span className="grid size-[4.2rem] place-items-center rounded-[1.4rem] bg-white text-sea-600 shadow-soft ring-1 ring-ink-100 lg:size-[5.2rem] lg:rounded-[1.7rem]">
                  <Icon className="size-7 lg:size-8" strokeWidth={1.6} aria-hidden />
                </span>
                <span className="absolute -top-2.5 -left-2.5 grid size-7 place-items-center rounded-full bg-ink-900 font-display text-[0.75rem] leading-none font-semibold text-white ring-4 ring-white lg:ring-foam">
                  {i + 1}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-ink-950 lg:mt-1 lg:text-xl">{t(`${key}.title`)}</h3>
                <p className="mt-1.5 leading-relaxed text-ink-500">{t(`${key}.text`, { volumes })}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
