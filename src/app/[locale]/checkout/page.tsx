import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { CheckoutSkeleton, CheckoutView } from '@/components/checkout/checkout-view';
import { PageHeader } from '@/components/ui/page-header';
import { acceptsOrders } from '@/lib/order/availability';
import { buildMetadata, catalogTextValues } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const [t, values] = await Promise.all([getTranslations('meta'), catalogTextValues()]);
  return {
    ...(await buildMetadata({ path: '/checkout', title: t('checkoutTitle'), description: t('homeDescription', values) })),
    robots: { index: false, follow: false },
  };
}

async function Checkout() {
  return <CheckoutView acceptsOrders={await acceptsOrders()} />;
}

export default async function CheckoutPage() {
  const [t, tNav] = await Promise.all([getTranslations('checkout'), getTranslations('nav')]);
  return (
    <>
      <PageHeader
        crumbs={[{ name: tNav('home'), href: '/' }, { name: tNav('cart'), href: '/cart' }, { name: tNav('checkout') }]}
        title={t('title')}
      />
      <section className="container-page">
        <Suspense fallback={<CheckoutSkeleton />}>
          <Checkout />
        </Suspense>
      </section>
    </>
  );
}
