import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Calculator } from '@/components/home/calculator';
import { BreadcrumbJsonLd } from '@/components/json-ld';
import { CompareTable } from '@/components/product/compare-table';
import { ProductCard } from '@/components/product/product-card';
import { PageHeader } from '@/components/ui/page-header';
import { SectionHeading } from '@/components/ui/section-heading';
import { catalog } from '@/lib/catalog';
import { buildMetadata, catalogTextValues } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const [t, values] = await Promise.all([getTranslations('meta'), catalogTextValues()]);
  return buildMetadata({ path: '/catalog', title: t('catalogTitle'), description: t('catalogDescription', values) });
}

export default async function CatalogPage() {
  const [t, tNav] = await Promise.all([getTranslations('catalog'), getTranslations('nav')]);

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: tNav('home'), path: '/' },
          { name: tNav('catalog'), path: '/catalog' },
        ]}
      />
      <PageHeader
        crumbs={[{ name: tNav('home'), href: '/' }, { name: tNav('catalog') }]}
        title={t('title')}
        lead={t('lead')}
        aside={
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink-700 shadow-soft ring-1 ring-ink-100">
            <span className="size-2 rounded-full bg-mint-500" aria-hidden />
            {t('count', { count: catalog.length })}
          </span>
        }
      />

      <section className="container-page" aria-label={t('title')}>
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {catalog.map((product, i) => (
            <li key={product.id} className="flex">
              <ProductCard product={product} priority={i < 3} className="w-full" headingLevel="h2" />
            </li>
          ))}
        </ul>
      </section>

      <section className="container-page pt-20 lg:pt-28" aria-labelledby="compare-title">
        <SectionHeading id="compare-title" title={t('compareTitle')} />
        <CompareTable className="reveal mt-8" />
      </section>

      <div className="pt-16 lg:pt-24">
        <Calculator />
      </div>
    </>
  );
}
