import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { CartSkeleton, CartView } from '@/components/cart/cart-view';
import { PageHeader } from '@/components/ui/page-header';
import { acceptsOrders } from '@/lib/order/availability';
import { buildMetadata, catalogTextValues } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const [t, values] = await Promise.all([getTranslations('meta'), catalogTextValues()]);
  return {
    ...(await buildMetadata({ path: '/cart', title: t('cartTitle'), description: t('homeDescription', values) })),
    robots: { index: false, follow: true },
  };
}

async function Cart() {
  return <CartView acceptsOrders={await acceptsOrders()} />;
}

export default async function CartPage() {
  const [t, tNav] = await Promise.all([getTranslations('cart'), getTranslations('nav')]);
  return (
    <>
      <PageHeader crumbs={[{ name: tNav('home'), href: '/' }, { name: tNav('cart') }]} title={t('title')} />
      <section className="container-page">
        <Suspense fallback={<CartSkeleton />}>
          <Cart />
        </Suspense>
      </section>
    </>
  );
}
