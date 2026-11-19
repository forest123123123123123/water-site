import { getTranslations } from 'next-intl/server';
import { catalog, getProductBySlug, productTitle } from '@/lib/catalog';
import { formatVolume } from '@/lib/format';
import { isLocale, tr } from '@/lib/locale';
import { OG_SIZE, renderOgImage } from '@/lib/og';
import { brandName } from '@/lib/site';

export const size = OG_SIZE;
export const contentType = 'image/png';

type Params = Promise<{ locale: string; slug: string }>;

async function resolve(params: Params) {
  const { locale, slug } = await params;
  return { locale: isLocale(locale) ? locale : ('ru' as const), product: getProductBySlug(slug) };
}

export async function generateImageMetadata({ params }: { params: Params }) {
  const { locale, product } = await resolve(params);
  const alt = product ? `${productTitle(product, locale)}, ${brandName}` : brandName;
  return [{ id: 'main', alt, size: OG_SIZE, contentType }];
}

/** Превью ссылки на конкретный товар: его объём выделен среди остальных. */
export default async function ProductOpenGraphImage({ params }: { params: Params }) {
  const { locale, product } = await resolve(params);
  const t = await getTranslations({ locale, namespace: 'meta' });
  return renderOgImage({
    title: product ? tr(product.name, locale) : t('ogTitle'),
    accent: product?.volume ? formatVolume(product.volume, locale) : undefined,
    subtitle: t('ogProductSubtitle'),
    chips: catalog.filter((p) => p.volume).map((p) => formatVolume(p.volume ?? 0, locale)),
    products: catalog,
    highlightId: product?.id,
  });
}
