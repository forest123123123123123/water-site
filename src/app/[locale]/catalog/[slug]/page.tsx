import { ArrowRight, Info, Truck } from 'lucide-react';
import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { AddToCart } from '@/components/cart/add-to-cart';
import { CartLink } from '@/components/cart/cart-link';
import { BreadcrumbJsonLd, ProductJsonLd } from '@/components/json-ld';
import { PriceTag } from '@/components/product/price-tag';
import { ProductCard } from '@/components/product/product-card';
import { ProductStage } from '@/components/product/product-stage';
import { ProductVisual } from '@/components/product/product-visual';
import { SizeCompare } from '@/components/product/size-compare';
import { StockBadge } from '@/components/product/stock-badge';
import { VolumeSwitcher } from '@/components/product/volume-switcher';
import { Breadcrumbs } from '@/components/ui/page-header';
import { SectionHeading } from '@/components/ui/section-heading';
import { Link } from '@/i18n/navigation';
import { catalog, getProductBySlug, otherProducts, productTitle } from '@/lib/catalog';
import { hasText, paragraphs, tr, type Locale } from '@/lib/locale';
import { buildMetadata } from '@/lib/seo';

export function generateStaticParams() {
  return catalog.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<'/[locale]/catalog/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return {};
  const [t, locale] = await Promise.all([getTranslations('meta'), getLocale()]);
  const title = productTitle(product, locale as Locale);
  return buildMetadata({
    path: `/catalog/${product.slug}`,
    title: t('productTitle', { title }),
    description: t('productDescription', { title, description: tr(product.shortDescription, locale as Locale) }),
    ownImage: true,
  });
}

/**
 * Содержимое зависит от адреса (slug), поэтому оно обёрнуто в Suspense:
 * при переходе из каталога сразу виден каркас страницы, а при прямом заходе
 * страница приходит полностью готовой — все товары пререндерятся при сборке.
 */
export default function ProductPage({ params }: PageProps<'/[locale]/catalog/[slug]'>) {
  return (
    <Suspense fallback={<ProductSkeleton />}>
      <ProductContent params={params} />
    </Suspense>
  );
}

function ProductSkeleton() {
  return (
    <section className="container-page pt-5 sm:pt-8" aria-busy="true">
      <div className="skeleton-line w-56" />
      <div className="mt-5 grid gap-6 sm:mt-8 lg:grid-cols-[1.08fr_1fr] lg:gap-14">
        <div className="h-[19rem] rounded-panel bg-white ring-1 ring-ink-100 sm:h-[28rem] lg:h-[36rem]" />
        <div className="space-y-5 pt-2">
          <div className="skeleton-line h-6 w-28" />
          <div className="skeleton-line h-12 w-4/5" />
          <div className="skeleton-line w-3/5" />
          <div className="skeleton-line h-10 w-40" />
          <div className="skeleton-line h-14 w-72 rounded-full" />
        </div>
      </div>
    </section>
  );
}

async function ProductContent({ params }: { params: PageProps<'/[locale]/catalog/[slug]'>['params'] }) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) notFound();

  const [t, tNav, locale] = await Promise.all([
    getTranslations('product'),
    getTranslations('nav'),
    getLocale() as Promise<Locale>,
  ]);
  const title = productTitle(product, locale);
  const lead = tr(product.shortDescription, locale);
  const description = paragraphs(tr(product.description, locale));
  const specs = product.specs.filter((s) => hasText(s.value));
  const others = otherProducts(product);

  return (
    <>
      <ProductJsonLd product={product} />
      <BreadcrumbJsonLd
        items={[
          { name: tNav('home'), path: '/' },
          { name: tNav('catalog'), path: '/catalog' },
          { name: title, path: `/catalog/${product.slug}` },
        ]}
      />

      <section className="container-page pt-5 sm:pt-8">
        <Breadcrumbs
          items={[
            { name: tNav('home'), href: '/' },
            { name: tNav('catalog'), href: '/catalog' },
            { name: title },
          ]}
        />

        <div className="mt-5 grid gap-6 sm:mt-8 lg:grid-cols-[1.08fr_1fr] lg:gap-14">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <ProductStage tone={product.tone} className="h-64 rounded-panel ring-1 ring-ink-100 sm:h-[28rem] lg:h-[36rem]">
              <div className="absolute inset-x-10 top-6 bottom-6 animate-rise-in sm:top-12 sm:bottom-12">
                <ProductVisual product={product} alt={title} priority scaled={false} sizes="(max-width: 1024px) 90vw, 600px" />
              </div>
            </ProductStage>
          </div>

          <div className="flex flex-col">
            <StockBadge product={product} className="self-start" />
            <h1 className="display-lg mt-3 animate-rise-in text-ink-950 sm:mt-4">{title}</h1>
            {lead && <p className="lead mt-3 animate-rise-in [animation-delay:80ms] sm:mt-4">{lead}</p>}

            <PriceTag product={product} size="lg" className="mt-5 sm:mt-7" />

            {/* На телефоне кнопка покупки идёт сразу после цены, выбор объёма — ниже; на компьютере наоборот. */}
            <div className="flex flex-col">
              <VolumeSwitcher current={product} className="order-1 mt-6 lg:order-none lg:mt-8" />
              <div className="mt-6 flex flex-col gap-3 sm:flex-row lg:mt-8">
                <AddToCart product={product} size="lg" long stretch className="sm:max-w-xs" />
                <CartLink className="w-full sm:w-auto" />
              </div>
            </div>

            {!product.inStock && <p className="mt-4 text-ink-500">{t('unavailableText')}</p>}

            {hasText(product.note) && (
              <div className="mt-8 flex gap-3 rounded-2xl bg-sun-50 p-4 text-[#6b4700] ring-1 ring-sun-300/60">
                <Info className="mt-0.5 size-5 shrink-0" aria-hidden />
                <div>
                  <p className="font-semibold">{t('note')}</p>
                  <p className="mt-1 leading-relaxed">{tr(product.note, locale)}</p>
                </div>
              </div>
            )}

            <Link
              href="/delivery"
              className="group mt-8 flex items-center gap-4 rounded-2xl bg-white p-4 shadow-soft ring-1 ring-ink-100 transition-colors hover:ring-sea-200 sm:p-5"
            >
              <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-sea-50 text-sea-700">
                <Truck className="size-6" strokeWidth={1.7} aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-ink-900">{t('deliveryTitle')}</span>
                <span className="block text-sm text-ink-500">{t('deliveryText')}</span>
              </span>
              <ArrowRight className="size-5 text-ink-300 transition-transform group-hover:translate-x-1" aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      <section className="container-page grid gap-6 pt-16 lg:grid-cols-2 lg:gap-8 lg:pt-24">
        <div className="reveal rounded-card bg-white p-6 shadow-soft ring-1 ring-ink-100 sm:p-8">
          <h2 className="text-lg font-semibold text-ink-950">{t('description')}</h2>
          <div className="mt-4 space-y-4 leading-relaxed text-ink-600">
            {description.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </div>

        {specs.length > 0 && (
          <div className="reveal rounded-card bg-white p-6 shadow-soft ring-1 ring-ink-100 sm:p-8">
            <h2 className="text-lg font-semibold text-ink-950">{t('specs')}</h2>
            <dl className="mt-4 divide-y divide-ink-100">
              {specs.map((spec, i) => (
                <div key={i} className="flex items-center justify-between gap-4 py-3.5">
                  <dt className="text-ink-500">{tr(spec.label, locale)}</dt>
                  <dd className="text-right font-semibold text-ink-900">{tr(spec.value, locale)}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        <SizeCompare current={product} className="reveal lg:col-span-2" />
      </section>

      {others.length > 0 && (
        <section className="container-page pt-16 lg:pt-24" aria-labelledby="others-title">
          <SectionHeading id="others-title" title={t('otherVolumes')} />
          <ul className={`mt-8 grid gap-5 sm:grid-cols-2 ${others.length >= 3 ? 'lg:grid-cols-3' : 'lg:max-w-4xl'}`}>
            {others.map((p) => (
              <li key={p.id} className="flex">
                <ProductCard product={p} className="w-full" />
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
