import { getTranslations } from 'next-intl/server';
import { catalog, volumeList } from '@/lib/catalog';
import { formatVolume } from '@/lib/format';
import { isLocale } from '@/lib/locale';
import { OG_SIZE, renderOgImage } from '@/lib/og';
import { brandName } from '@/lib/site';

export const size = OG_SIZE;
export const contentType = 'image/png';

async function localeOf(params: Promise<{ locale: string }>) {
  const { locale } = await params;
  return isLocale(locale) ? locale : 'ru';
}

export async function generateImageMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await localeOf(params);
  const t = await getTranslations({ locale, namespace: 'meta' });
  return [{ id: 'main', alt: `${t('homeTitle', { volumes: volumeList(locale) })}, ${brandName}`, size: OG_SIZE, contentType }];
}

/** Картинка для превью ссылок на сайт (главная и все разделы без своей картинки). */
export default async function OpenGraphImage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await localeOf(params);
  const t = await getTranslations({ locale, namespace: 'meta' });
  return renderOgImage({
    title: t('ogTitle'),
    accent: t('ogAccent'),
    subtitle: t('ogSubtitle'),
    chips: catalog.filter((p) => p.volume).map((p) => formatVolume(p.volume ?? 0, locale)),
    products: catalog,
  });
}
