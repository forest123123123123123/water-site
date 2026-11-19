import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import { getPathname } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { volumeList } from './catalog';
import type { Locale } from './locale';
import { OG_SIZE } from './og';
import { brandName } from './site';

/** Путь страницы с учётом языка: '/catalog' → '/catalog' (ru) или '/uz/catalog' (uz). */
export function localizedPath(path: string, locale: Locale) {
  return getPathname({ href: path, locale });
}

/** Значения для текстов, зависящих от ассортимента ({volumes} в meta.*). */
export async function catalogTextValues() {
  return { volumes: volumeList((await getLocale()) as Locale) };
}

/**
 * Метаданные страницы: заголовок, описание, канонический адрес,
 * hreflang для русской и узбекской версий и Open Graph для превью ссылок.
 *
 * Объект openGraph страницы целиком заменяет унаследованный, поэтому картинка превью
 * указывается явно — общая картинка раздела ([locale]/opengraph-image). Страницам со своим
 * файлом opengraph-image (товары) нужен ownImage: true — иначе общая картинка заменит их собственную.
 */
export async function buildMetadata({
  path,
  title,
  description,
  absoluteTitle = false,
  ownImage = false,
}: {
  path: string;
  title: string;
  description: string;
  absoluteTitle?: boolean;
  ownImage?: boolean;
}): Promise<Metadata> {
  const locale = (await getLocale()) as Locale;
  const languages: Record<string, string> = Object.fromEntries(
    routing.locales.map((l) => [l, localizedPath(path, l)]),
  );
  languages['x-default'] = localizedPath(path, routing.defaultLocale);
  // Даже images: undefined отключает файловую картинку — поэтому ключа не должно быть вовсе.
  const images = ownImage ? {} : { images: [{ url: `/${locale}/opengraph-image/main`, ...OG_SIZE, alt: `${title}, ${brandName}` }] };

  return {
    title: absoluteTitle ? { absolute: `${title} | ${brandName}` } : title,
    description,
    alternates: { canonical: localizedPath(path, locale), languages },
    openGraph: {
      type: 'website',
      siteName: brandName,
      title,
      description,
      url: localizedPath(path, locale),
      locale: locale === 'uz' ? 'uz_UZ' : 'ru_RU',
      alternateLocale: routing.locales.filter((l) => l !== locale).map((l) => (l === 'uz' ? 'uz_UZ' : 'ru_RU')),
      ...images,
    },
    twitter: { card: 'summary_large_image', title, description, ...images },
  };
}
