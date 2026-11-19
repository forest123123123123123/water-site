import { ArrowRight } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { AddToCart } from '@/components/cart/add-to-cart';
import { PriceTag } from '@/components/product/price-tag';
import { ProductStage } from '@/components/product/product-stage';
import { ProductVisual } from '@/components/product/product-visual';
import { StockBadge } from '@/components/product/stock-badge';
import { ButtonLink } from '@/components/ui/button';
import { SectionHeading } from '@/components/ui/section-heading';
import { Link } from '@/i18n/navigation';
import { catalog, productTitle } from '@/lib/catalog';
import { formatNumber, literLabel } from '@/lib/format';
import { tr, type Locale } from '@/lib/locale';
import { cn } from '@/lib/utils';

/**
 * «Полка» объёмов: все товары стоят на одной линии в реальных пропорциях —
 * разница между 5, 10 и 20 литрами видна сразу. На телефоне — компактные строки.
 */
export function Lineup() {
  const t = useTranslations('home.lineup');
  const locale = useLocale() as Locale;
  const products = catalog;

  return (
    <section className="container-page py-16 lg:py-24" aria-labelledby="lineup-title">
      <SectionHeading
        id="lineup-title"
        eyebrow={t('eyebrow')}
        title={t('title')}
        text={t('text')}
        action={
          <ButtonLink href="/catalog" variant="outline" className="hidden md:inline-flex">
            {t('all')}
            <ArrowRight className="size-4" aria-hidden />
          </ButtonLink>
        }
      />

      {/* Телефон: строки */}
      <ul className="mt-10 grid gap-4 md:hidden">
        {products.map((p) => {
          const title = productTitle(p, locale);
          return (
            <li key={p.id} className="reveal relative flex overflow-hidden rounded-card bg-white shadow-soft ring-1 ring-ink-100">
              <ProductStage tone={p.tone} className="w-[38%] shrink-0" wave={false}>
                <div className="absolute inset-x-2 top-4 bottom-3">
                  <ProductVisual product={p} alt={title} />
                </div>
              </ProductStage>
              <div className="flex min-w-0 flex-1 flex-col p-4">
                <div className="flex items-start justify-between gap-2">
                  {p.volume != null && (
                    <span className="font-display text-[2rem] leading-none font-semibold tracking-[-0.04em] text-ink-950">
                      {formatNumber(p.volume)}
                      <span className="ml-1 text-base tracking-normal text-ink-400">{literLabel(locale)}</span>
                    </span>
                  )}
                </div>
                <h3 className="mt-2 text-[0.95rem] leading-snug font-semibold text-ink-900">
                  <Link href={`/catalog/${p.slug}`} className="after:absolute after:inset-0 after:content-['']">
                    {title}
                  </Link>
                </h3>
                <PriceTag product={p} size="sm" showPerLiter={false} className="mt-1.5 text-sm" />
                <div className="relative z-10 mt-auto pt-3">
                  <AddToCart product={p} size="sm" stretch />
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Планшет и компьютер: полка */}
      <div className="reveal mt-12 hidden overflow-hidden rounded-panel bg-white shadow-soft ring-1 ring-ink-100 md:block">
        <div className={cn('grid divide-x divide-ink-100')} style={{ gridTemplateColumns: `repeat(${products.length}, minmax(0, 1fr))` }}>
          {products.map((p, i) => {
            const title = productTitle(p, locale);
            return (
              <article key={p.id} className="group relative flex flex-col">
                <ProductStage tone={p.tone} className="h-[340px] lg:h-[400px]">
                  <div className="absolute top-5 left-5 z-10">
                    <StockBadge product={p} />
                  </div>
                  <div className="absolute inset-x-8 top-8 bottom-6 transition-transform duration-700 ease-fluid group-hover:-translate-y-2">
                    <ProductVisual product={p} alt={title} priority={i === 0} />
                  </div>
                </ProductStage>
                <div className="flex flex-1 flex-col p-6 lg:p-8">
                  {p.volume != null && (
                    <span className="font-display text-[3.2rem] leading-none font-semibold tracking-[-0.045em] text-ink-950 lg:text-[3.8rem]">
                      {formatNumber(p.volume)}
                      <span className="ml-1.5 text-[1.4rem] tracking-normal text-ink-400">{literLabel(locale)}</span>
                    </span>
                  )}
                  <h3 className="mt-4 text-lg font-semibold text-ink-900">
                    <Link
                      href={`/catalog/${p.slug}`}
                      className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
                    >
                      {title}
                    </Link>
                  </h3>
                  <p className="mt-2 leading-relaxed text-ink-500">{tr(p.shortDescription, locale)}</p>
                  <div className="mt-auto pt-6">
                    <PriceTag product={p} />
                    <div className="relative z-10 mt-4">
                      <AddToCart product={p} stretch />
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
