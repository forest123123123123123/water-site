'use client';

import { Minus, Plus, ShoppingBag } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useId, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { flyToCart } from '@/components/cart/fly-to-cart';
import { ProductVisual } from '@/components/product/product-visual';
import { useRouter } from '@/i18n/navigation';
import { LITERS_PER_PERSON_PER_DAY, litersNeeded, recommendContainers } from '@/lib/calculator';
import { catalog, getProductById } from '@/lib/catalog';
import { useCart } from '@/lib/cart/store';
import { formatNumber, formatPrice, formatVolume } from '@/lib/format';
import type { Locale } from '@/lib/locale';
import { cn } from '@/lib/utils';

const PERIODS = [
  { days: 7, key: 'week' },
  { days: 14, key: 'twoWeeks' },
  { days: 30, key: 'month' },
] as const;

const MAX_PEOPLE = 20;

/**
 * Калькулятор запаса воды: люди × дни × ~2 л → подбор набора тары
 * из того, что есть в наличии, и добавление всего набора в корзину одним нажатием.
 */
export function Calculator({ className }: { className?: string }) {
  const t = useTranslations('calculator');
  const tCart = useTranslations('cart');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const sliderId = useId();
  const patternId = `calc-ripples-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const [people, setPeople] = useState(3);
  const [days, setDays] = useState<number>(7);
  const addRef = useRef<HTMLButtonElement>(null);

  const containers = useMemo(
    () => catalog.filter((p) => p.inStock && p.volume).map((p) => ({ id: p.id, volume: p.volume as number })),
    [],
  );
  const liters = litersNeeded(people, days);
  const rec = useMemo(() => recommendContainers(liters, containers), [liters, containers]);

  const estimate = useMemo(() => {
    if (!rec) return null;
    let sum = 0;
    for (const item of rec.items) {
      const price = getProductById(item.id)?.price;
      if (price == null) return null;
      sum += price * item.qty;
    }
    return sum;
  }, [rec]);

  const addSet = () => {
    if (!rec) return;
    const { add } = useCart.getState();
    for (const item of rec.items) add(item.id, item.qty);
    flyToCart(addRef.current);
    toast(t('added'), { action: { label: tCart('open'), onClick: () => router.push('/cart') } });
  };

  return (
    <section className={cn('container-page py-6 lg:py-10', className)} aria-labelledby="calc-title">
      <div className="relative isolate overflow-hidden rounded-panel bg-ink-950 px-5 py-10 text-white sm:px-10 lg:px-14 lg:py-16">
        <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
          <div className="absolute -top-32 -left-24 size-[30rem] rounded-full bg-[radial-gradient(circle,rgb(26_146_212_/_0.45),transparent_65%)]" />
          <div className="absolute -right-24 -bottom-40 size-[34rem] rounded-full bg-[radial-gradient(circle,rgb(63_175_229_/_0.3),transparent_65%)]" />
          <svg className="absolute inset-0 h-full w-full opacity-[0.07]" aria-hidden>
            <defs>
              <pattern id={patternId} width="120" height="120" patternUnits="userSpaceOnUse">
                <circle cx="60" cy="60" r="20" fill="none" stroke="#fff" />
                <circle cx="60" cy="60" r="40" fill="none" stroke="#fff" />
                <circle cx="60" cy="60" r="58" fill="none" stroke="#fff" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#${patternId})`} />
          </svg>
        </div>

        <div className="grid gap-10 lg:grid-cols-[1fr_1.05fr] lg:gap-14">
          <div>
            <p className="eyebrow text-sea-300">
              <span className="h-px w-6 bg-current opacity-60" aria-hidden />
              {t('eyebrow')}
            </p>
            <h2 id="calc-title" className="display-md mt-4 text-white">
              {t('title')}
            </h2>
            <p className="lead mt-4 text-ink-300">{t('text')}</p>

            <div className="mt-9 space-y-8">
              <div>
                <label htmlFor={sliderId} className="text-sm font-semibold tracking-wide text-ink-300">
                  {t('people')}
                </label>
                <div className="mt-3 flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setPeople((n) => Math.max(1, n - 1))}
                    disabled={people <= 1}
                    aria-label={t('decrease')}
                    className="grid size-12 shrink-0 place-items-center rounded-full bg-white/10 transition-colors hover:bg-white/20 disabled:opacity-40"
                  >
                    <Minus className="size-5" aria-hidden />
                  </button>
                  <output
                    htmlFor={sliderId}
                    aria-live="polite"
                    className="min-w-[8.5rem] text-center font-display text-[1.6rem] font-semibold tracking-[-0.02em] tabular-nums"
                  >
                    {t('peopleValue', { count: people })}
                  </output>
                  <button
                    type="button"
                    onClick={() => setPeople((n) => Math.min(MAX_PEOPLE, n + 1))}
                    disabled={people >= MAX_PEOPLE}
                    aria-label={t('increase')}
                    className="grid size-12 shrink-0 place-items-center rounded-full bg-white/10 transition-colors hover:bg-white/20 disabled:opacity-40"
                  >
                    <Plus className="size-5" aria-hidden />
                  </button>
                </div>
                <input
                  id={sliderId}
                  type="range"
                  min={1}
                  max={MAX_PEOPLE}
                  value={people}
                  onChange={(e) => setPeople(Number(e.target.value))}
                  className="mt-5 h-2 w-full max-w-sm cursor-pointer appearance-none rounded-full bg-white/15 accent-sea-400 [&::-webkit-slider-thumb]:size-6 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_0_0_6px_rgb(63_175_229_/_0.35)]"
                  style={{
                    background: `linear-gradient(90deg, var(--color-sea-400) ${((people - 1) / (MAX_PEOPLE - 1)) * 100}%, rgb(255 255 255 / 0.15) 0)`,
                  }}
                />
              </div>

              <fieldset>
                <legend className="text-sm font-semibold tracking-wide text-ink-300">{t('period')}</legend>
                <div className="mt-3 inline-flex flex-wrap gap-1 rounded-full bg-white/8 p-1">
                  {PERIODS.map((p) => (
                    <label
                      key={p.days}
                      className={cn(
                        'cursor-pointer rounded-full px-4 py-2.5 text-sm font-semibold transition-colors duration-300 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-sea-400 sm:px-5',
                        days === p.days ? 'bg-white text-ink-950' : 'text-white/75 hover:text-white',
                      )}
                    >
                      <input
                        type="radio"
                        name="calc-period"
                        value={p.days}
                        checked={days === p.days}
                        onChange={() => setDays(p.days)}
                        className="sr-only"
                      />
                      {t(p.key)}
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
          </div>

          <div className="rounded-[1.75rem] bg-white p-5 text-ink-900 shadow-lift sm:p-7" aria-live="polite">
            <p className="text-sm font-semibold text-ink-500">{t('need')}</p>
            <p className="mt-1 font-display text-[2.6rem] leading-none font-semibold tracking-[-0.04em] text-ink-950 sm:text-[3.2rem]">
              {formatVolume(liters, locale)}
            </p>

            {rec ? (
              <>
                <p className="mt-7 text-sm font-semibold text-ink-500">{t('recommend')}</p>
                <ul className="mt-3 flex flex-wrap items-end gap-3">
                  {rec.items.map((item) => {
                    const product = getProductById(item.id);
                    if (!product) return null;
                    return (
                      <li
                        key={item.id}
                        className="flex items-end gap-2 rounded-2xl bg-sea-50 py-3 pr-4 pl-3 ring-1 ring-sea-100"
                      >
                        <div className="h-20 w-12">
                          <ProductVisual product={product} animated={false} />
                        </div>
                        <div className="pb-1">
                          <p className="font-display text-xl font-semibold tabular-nums">×{item.qty}</p>
                          <p className="text-sm text-ink-500">{formatVolume(item.volume, locale)}</p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
                <dl className="mt-6 space-y-2 border-t border-ink-100 pt-5 text-[0.95rem]">
                  <div className="flex justify-between gap-4">
                    <dt className="text-ink-500">{t('total')}</dt>
                    <dd className="font-semibold">{formatVolume(rec.totalLiters, locale)}</dd>
                  </div>
                  {estimate != null && (
                    <div className="flex justify-between gap-4">
                      <dt className="text-ink-500">{t('estimate')}</dt>
                      <dd className="font-semibold">{formatPrice(estimate, locale)}</dd>
                    </div>
                  )}
                </dl>
                <button
                  ref={addRef}
                  type="button"
                  onClick={addSet}
                  className="mt-6 inline-flex h-14 w-full items-center justify-center gap-2.5 rounded-full bg-[linear-gradient(135deg,var(--color-sea-500),var(--color-sea-700))] px-6 font-semibold text-white shadow-glow transition-[filter,transform] hover:brightness-110 active:scale-[0.98]"
                >
                  <ShoppingBag className="size-5" aria-hidden />
                  {t('add')}
                </button>
              </>
            ) : (
              <p className="mt-6 text-ink-500">{t('unavailable')}</p>
            )}
            <p className="mt-5 text-[0.82rem] leading-relaxed text-ink-400">
              {t('note', { liters: formatNumber(LITERS_PER_PERSON_PER_DAY) })}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
