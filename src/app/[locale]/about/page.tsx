import { aboutConfig } from '@config/content';
import type { Metadata } from 'next';
import Image from 'next/image';
import { getLocale, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { FinalCta } from '@/components/home/final-cta';
import { Lineup } from '@/components/home/lineup';
import { PageHeader } from '@/components/ui/page-header';
import { SectionHeading } from '@/components/ui/section-heading';
import { hasText, tr, type Locale } from '@/lib/locale';
import { buildMetadata } from '@/lib/seo';
import { brandName, hasAboutContent } from '@/lib/site';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta');
  return buildMetadata({
    path: '/about',
    title: t('aboutTitle'),
    description: t('aboutDescription', { brand: brandName }),
  });
}

export default async function AboutPage() {
  if (!hasAboutContent) notFound();

  const [t, tNav, locale] = await Promise.all([getTranslations('about'), getTranslations('nav'), getLocale()]);
  const lang = locale as Locale;
  const paragraphs = aboutConfig.paragraphs.filter((p) => hasText(p)).map((p) => tr(p, lang));
  const facts = aboutConfig.facts.filter((f) => f.value.trim());
  const photos = aboutConfig.photos.filter((p) => p.src.trim());

  return (
    <>
      <PageHeader crumbs={[{ name: tNav('home'), href: '/' }, { name: tNav('about') }]} title={t('title')} lead={t('lead')} />

      <section className="container-page">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr]">
          <div className="space-y-5 text-[1.08rem] leading-relaxed text-ink-700">
            {paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          {facts.length > 0 && (
            <dl className="grid grid-cols-2 gap-4 self-start">
              {facts.map((f, i) => (
                <div key={i} className="rounded-card bg-white p-6 shadow-soft ring-1 ring-ink-100">
                  <dt className="sr-only">{tr(f.label, lang)}</dt>
                  <dd className="font-display text-[2.2rem] leading-none font-semibold tracking-[-0.03em] text-sea-700">{f.value}</dd>
                  <dd className="mt-2 text-sm text-ink-500">{tr(f.label, lang)}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </section>

      {photos.length > 0 && (
        <section className="container-page pt-16" aria-labelledby="photos-title">
          <SectionHeading id="photos-title" title={t('photos')} />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {photos.map((photo, i) => (
              <div key={i} className="relative aspect-[4/3] overflow-hidden rounded-card bg-ink-100">
                <Image src={photo.src} alt={tr(photo.alt, lang)} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
              </div>
            ))}
          </div>
        </section>
      )}

      <Lineup />
      <FinalCta />
    </>
  );
}
