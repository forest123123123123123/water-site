import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { DeliveryFacts, hasDeliveryInfo } from '@/components/delivery-facts';
import { Faq, visibleFaq } from '@/components/faq';
import { FinalCta } from '@/components/home/final-cta';
import { Steps } from '@/components/home/steps';
import { BreadcrumbJsonLd, FaqJsonLd } from '@/components/json-ld';
import { OrdersOpen } from '@/components/orders-open';
import { PageHeader } from '@/components/ui/page-header';
import { SectionHeading } from '@/components/ui/section-heading';
import { buildMetadata } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta');
  return buildMetadata({ path: '/delivery', title: t('deliveryTitle'), description: t('deliveryDescription') });
}

export default async function DeliveryPage() {
  const [t, tNav] = await Promise.all([getTranslations('delivery'), getTranslations('nav')]);

  return (
    <>
      <BreadcrumbJsonLd items={[{ name: tNav('home'), path: '/' }, { name: tNav('delivery'), path: '/delivery' }]} />
      <FaqJsonLd />
      <PageHeader crumbs={[{ name: tNav('home'), href: '/' }, { name: tNav('delivery') }]} title={t('title')} lead={t('lead')} />

      <section id="conditions" className="container-page scroll-mt-28" aria-labelledby="conditions-title">
        <SectionHeading id="conditions-title" title={t('conditions')} />
        <DeliveryFacts className="mt-8" />
        {!hasDeliveryInfo && <p className="lead mt-6">{t('noInfo')}</p>}
      </section>

      <OrdersOpen>
        <div className="pt-6">
          <Steps />
        </div>
      </OrdersOpen>

      {visibleFaq.length > 0 && (
        <section className="container-page" aria-labelledby="faq-title">
          <SectionHeading id="faq-title" title={t('faq')} />
          <div className="reveal mt-8">
            <Faq />
          </div>
        </section>
      )}

      <div className="pt-16 lg:pt-20">
        <FinalCta />
      </div>
    </>
  );
}
