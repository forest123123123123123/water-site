import type { Metadata, Viewport } from 'next';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { Onest, Unbounded } from 'next/font/google';
import { notFound } from 'next/navigation';
import { locale as rootLocale } from 'next/root-params';
import { Suspense } from 'react';
import { CartRuntime } from '@/components/cart/cart-runtime';
import { MobileCartBar } from '@/components/cart/mobile-cart-bar';
import { Footer } from '@/components/layout/footer';
import { Header } from '@/components/layout/header';
import { routing } from '@/i18n/routing';
import { acceptsOrders } from '@/lib/order/availability';
import { catalogTextValues } from '@/lib/seo';
import { brandName, isIndexable, siteUrl } from '@/lib/site';
import '../globals.css';

const onest = Onest({
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  variable: '--font-onest',
  display: 'swap',
});

const unbounded = Unbounded({
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  variable: '--font-unbounded',
  display: 'swap',
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  themeColor: '#f5f9fc',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export async function generateMetadata(): Promise<Metadata> {
  const [t, values] = await Promise.all([getTranslations('meta'), catalogTextValues()]);
  return {
    metadataBase: new URL(siteUrl),
    title: { default: `${t('homeTitle', values)} | ${brandName}`, template: `%s | ${brandName}` },
    description: t('homeDescription', values),
    applicationName: brandName,
    robots: { index: isIndexable, follow: isIndexable },
    formatDetection: { telephone: false },
  };
}

async function CartBar() {
  return <MobileCartBar acceptsOrders={await acceptsOrders()} />;
}

export default async function LocaleLayout({ children }: LayoutProps<'/[locale]'>) {
  const locale = await rootLocale();
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations('nav');

  return (
    <html lang={locale} className={`${onest.variable} ${unbounded.variable}`}>
      <body className="flex min-h-dvh flex-col">
        <NextIntlClientProvider>
          <a
            href="#main"
            className="sr-only z-[100] rounded-full bg-ink-900 px-5 py-3 font-semibold text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
          >
            {t('skipToContent')}
          </a>
          <Header />
          <main id="main" className="flex-1">
            {children}
          </main>
          <Footer />
          <Suspense fallback={null}>
            <CartBar />
          </Suspense>
          <CartRuntime />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
