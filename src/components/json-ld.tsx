import { siteConfig } from '@config/site';
import { getLocale } from 'next-intl/server';
import { visibleFaq } from '@/components/faq';
import { productTitle, type Product } from '@/lib/catalog';
import { normalizeUzPhone } from '@/lib/format';
import { tr, type Locale } from '@/lib/locale';
import { localizedPath } from '@/lib/seo';
import { brandName, phones, siteUrl } from '@/lib/site';
import { getSocialLinks } from '@/lib/social';

function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // JSON-LD: символ «<» экранируется, чтобы текст из настроек не мог закрыть тег.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  );
}

/** Сведения об организации для поисковых систем — только из заполненных настроек. */
export async function OrganizationJsonLd() {
  const locale = (await getLocale()) as Locale;
  const sameAs = getSocialLinks()
    .filter((s) => s.network !== 'whatsapp')
    .map((s) => s.href);
  const address = tr(siteConfig.contacts.address, locale);

  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: brandName,
        url: `${siteUrl}${localizedPath('/', locale)}`,
        ...(siteConfig.brand.logo ? { logo: `${siteUrl}${siteConfig.brand.logo}` } : {}),
        ...(sameAs.length ? { sameAs } : {}),
        ...(phones.length
          ? {
              contactPoint: phones.map((p) => ({
                '@type': 'ContactPoint',
                telephone: normalizeUzPhone(p) ?? p,
                contactType: 'customer service',
                areaServed: 'UZ',
                availableLanguage: ['ru', 'uz'],
              })),
            }
          : {}),
        ...(address ? { address: { '@type': 'PostalAddress', streetAddress: address, addressLocality: 'Tashkent', addressCountry: 'UZ' } } : {}),
      }}
    />
  );
}

/** Карточка товара для поисковиков. Цена указывается только если она реально задана. */
export async function ProductJsonLd({ product }: { product: Product }) {
  const locale = (await getLocale()) as Locale;
  const url = `${siteUrl}${localizedPath(`/catalog/${product.slug}`, locale)}`;
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: productTitle(product, locale),
        description: tr(product.shortDescription, locale),
        brand: { '@type': 'Brand', name: brandName },
        sku: product.id,
        url,
        ...(product.image ? { image: `${siteUrl}${product.image}` } : {}),
        ...(product.price != null
          ? {
              offers: {
                '@type': 'Offer',
                price: product.price,
                priceCurrency: 'UZS',
                availability: product.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
                url,
                areaServed: 'Tashkent',
              },
            }
          : {}),
      }}
    />
  );
}

export async function BreadcrumbJsonLd({ items }: { items: { name: string; path: string }[] }) {
  const locale = (await getLocale()) as Locale;
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: item.name,
          item: `${siteUrl}${localizedPath(item.path, locale)}`,
        })),
      }}
    />
  );
}

export async function FaqJsonLd() {
  if (visibleFaq.length === 0) return null;
  const locale = (await getLocale()) as Locale;
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: visibleFaq.map((item) => ({
          '@type': 'Question',
          name: tr(item.question, locale),
          acceptedAnswer: { '@type': 'Answer', text: tr(item.answer, locale) },
        })),
      }}
    />
  );
}
