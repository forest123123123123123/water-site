import { ArrowRight, MapPin } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import type { CSSProperties } from 'react';
import { OrdersOpen } from '@/components/orders-open';
import { ProductVisual } from '@/components/product/product-visual';
import { ButtonLink } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { catalog, productTitle, volumeList, type Product } from '@/lib/catalog';
import { formatVolume } from '@/lib/format';
import type { Locale } from '@/lib/locale';
import { cn } from '@/lib/utils';

/** Товары для композиции: до трёх объёмов, самый большой — в центре. */
function heroProducts(): Product[] {
  return [...catalog]
    .filter((p) => p.volume)
    .sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0))
    .slice(0, 3);
}

const SLOTS: { className: string; delay: string }[] = [
  { className: 'left-1/2 bottom-[16%] h-[74%] -translate-x-1/2 z-10', delay: '0s' },
  { className: 'left-[1%] bottom-[5%] h-[54%] z-20', delay: '-2.4s' },
  { className: 'right-[2%] bottom-[4%] h-[50%] z-20', delay: '-4.6s' },
];

function Accent({ chunks }: { chunks: React.ReactNode }) {
  return (
    <span className="relative inline-block whitespace-nowrap">
      <span className="bg-[linear-gradient(100deg,var(--color-sea-400)_0%,var(--color-sea-600)_55%,var(--color-sea-800)_100%)] bg-clip-text text-transparent">
        {chunks}
      </span>
      <svg
        className="absolute -bottom-[0.12em] left-0 h-[0.28em] w-full text-sea-300"
        viewBox="0 0 300 20"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          d="M2 12 C 40 2, 70 2, 100 11 S 160 20, 200 10 S 260 2, 298 9"
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
          className="[stroke-dasharray:420] [stroke-dashoffset:420] motion-safe:animate-[draw_1.4s_0.5s_var(--ease-fluid)_forwards] motion-reduce:[stroke-dashoffset:0]"
        />
      </svg>
    </span>
  );
}

export function Hero() {
  const t = useTranslations('home.hero');
  const locale = useLocale() as Locale;
  const products = heroProducts();

  return (
    <section className="relative isolate overflow-hidden">
      {/* Фон: мягкие пятна света и круги на воде */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <div className="absolute -top-40 right-[-10%] size-[46rem] rounded-full bg-[radial-gradient(circle,var(--color-sea-200)_0%,transparent_62%)] opacity-70" />
        <div className="absolute top-40 -left-40 size-[34rem] rounded-full bg-[radial-gradient(circle,var(--color-sea-100)_0%,transparent_65%)]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-foam" />
      </div>

      <div className="container-page grid items-center gap-8 pt-6 pb-10 sm:pt-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-6 lg:pt-12 lg:pb-20">
        <div className="relative z-10">
          <p className="inline-flex animate-rise-in items-center gap-2 rounded-full bg-white/80 py-1.5 pr-4 pl-2 text-[0.85rem] font-semibold text-sea-800 shadow-soft ring-1 ring-sea-100 backdrop-blur">
            <span className="grid size-6 place-items-center rounded-full bg-sea-500 text-white">
              <MapPin className="size-3.5" aria-hidden />
            </span>
            {t('eyebrow')}
          </p>

          <h1 className="display-xl mt-6 animate-rise-in text-ink-950 [animation-delay:80ms]">
            {t.rich('title', { accent: (chunks) => <Accent chunks={chunks} /> })}
          </h1>

          <p className="lead mt-6 max-w-xl animate-rise-in [animation-delay:160ms]">{t('lead', { volumes: volumeList(locale) })}</p>

          <div className="mt-8 flex animate-rise-in flex-wrap gap-3 [animation-delay:240ms]">
            <ButtonLink href="/catalog" size="lg" className="w-full sm:w-auto">
              {t('ctaPrimary')}
              <ArrowRight className="size-5" aria-hidden />
            </ButtonLink>
            <OrdersOpen>
              <ButtonLink href="/#how" size="lg" variant="outline" className="w-full sm:w-auto">
                {t('ctaSecondary')}
              </ButtonLink>
            </OrdersOpen>
          </div>

          <ul
            aria-label={t('volumes')}
            className="mt-9 flex animate-rise-in flex-wrap gap-2.5 [animation-delay:320ms]"
          >
            {[...products].reverse().map((p) => (
              <li key={p.id}>
                <Link
                  href={`/catalog/${p.slug}`}
                  className="group inline-flex items-center gap-2.5 rounded-full bg-white py-2 pr-4 pl-2 text-[0.92rem] font-semibold text-ink-900 shadow-soft ring-1 ring-ink-100 transition-all duration-300 hover:-translate-y-0.5 hover:ring-sea-200"
                >
                  <span
                    className="grid size-7 place-items-center rounded-full text-white"
                    style={{ background: p.tone }}
                    aria-hidden
                  >
                    <svg viewBox="0 0 24 24" className="size-3.5" fill="currentColor">
                      <path d="M12 2.5S5 10.4 5 14.6a7 7 0 0 0 14 0C19 10.4 12 2.5 12 2.5Z" />
                    </svg>
                  </span>
                  <span className="sr-only">{productTitle(p, locale)}</span>
                  <span aria-hidden>{formatVolume(p.volume ?? 0, locale)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Композиция из объёмов в реальных пропорциях */}
        <div className="relative mx-auto h-[330px] w-full max-w-[640px] sm:h-[460px] lg:h-[580px]" aria-hidden>
          <div className="absolute top-[4%] left-1/2 aspect-square h-[88%] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_50%_40%,#ffffff_0%,var(--color-sea-100)_45%,transparent_70%)]" />
          <div className="absolute top-[6%] left-1/2 aspect-square h-[84%] -translate-x-1/2 rounded-full border border-sea-200/60" />
          <div className="absolute top-[14%] left-1/2 aspect-square h-[68%] -translate-x-1/2 rounded-full border border-dashed border-sea-200/70" />

          {/* Водная гладь и расходящиеся круги */}
          <div className="absolute bottom-[3%] left-1/2 h-[18%] w-[96%] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(closest-side,rgb(63_175_229_/_0.38),rgb(178_224_246_/_0.18)_60%,transparent)]" />
          {[0, 1.2, 2.4].map((delay) => (
            <div
              key={delay}
              className="absolute bottom-[7%] left-1/2 h-[12%] w-[78%] -translate-x-1/2 animate-ripple rounded-[50%] border-2 border-sea-300/60"
              style={{ animationDelay: `${delay}s` } as CSSProperties}
            />
          ))}

          {products.map((p, i) => (
            <div
              key={p.id}
              className={cn('absolute animate-float', SLOTS[i]?.className)}
              style={{ animationDelay: SLOTS[i]?.delay } as CSSProperties}
            >
              <div className="h-full animate-rise-in" style={{ animationDelay: `${200 + i * 120}ms` }}>
                <ProductVisual product={p} scaled={false} priority className="w-auto" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
