import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Calculator } from '@/components/home/calculator';
import { DeliveryTeaser } from '@/components/home/delivery-teaser';
import { FinalCta } from '@/components/home/final-cta';
import { Hero } from '@/components/home/hero';
import { Lineup } from '@/components/home/lineup';
import { Steps } from '@/components/home/steps';
import { OrganizationJsonLd } from '@/components/json-ld';
import { OrdersOpen } from '@/components/orders-open';
import { buildMetadata, catalogTextValues } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const [t, values] = await Promise.all([getTranslations('meta'), catalogTextValues()]);
  return buildMetadata({ path: '/', title: t('homeTitle', values), description: t('homeDescription', values), absoluteTitle: true });
}

export default function HomePage() {
  return (
    <>
      <OrganizationJsonLd />
      <Hero />
      <Lineup />
      <OrdersOpen>
        <Steps />
      </OrdersOpen>
      <Calculator />
      <DeliveryTeaser />
      <FinalCta />
    </>
  );
}
