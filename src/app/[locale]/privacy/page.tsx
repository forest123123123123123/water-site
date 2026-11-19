import { siteConfig } from '@config/site';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { PageHeader } from '@/components/ui/page-header';
import { buildMetadata } from '@/lib/seo';
import { brandName } from '@/lib/site';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta');
  return buildMetadata({ path: '/privacy', title: t('privacyTitle'), description: t('privacyTitle') });
}

const SECTIONS = ['s1', 's2', 's3', 's4', 's5', 's6'] as const;

export default async function PrivacyPage() {
  const [t, tNav] = await Promise.all([getTranslations('privacy'), getTranslations('nav')]);
  const company = siteConfig.brand.legalName.trim() || brandName;

  return (
    <>
      <PageHeader crumbs={[{ name: tNav('home'), href: '/' }, { name: tNav('privacy') }]} title={t('title')} />
      <section className="container-page">
        <div className="max-w-3xl">
          <div className="space-y-9">
            {SECTIONS.map((key, i) => (
              <section key={key}>
                <h2 className="flex items-baseline gap-3 text-xl font-semibold text-ink-950">
                  <span className="font-display text-sm text-sea-600">{String(i + 1).padStart(2, '0')}</span>
                  {t(`${key}Title`)}
                </h2>
                <p className="mt-3 leading-relaxed text-ink-600">{t(`${key}Text`, { brand: company })}</p>
              </section>
            ))}
          </div>
          <p className="mt-10 border-t border-ink-100 pt-6 text-sm text-ink-400">{t('updated')}</p>
        </div>
      </section>
    </>
  );
}
