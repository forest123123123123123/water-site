import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';
import { catalog } from '@/lib/catalog';
import { localizedPath } from '@/lib/seo';
import { hasAboutContent, siteUrl } from '@/lib/site';

/** Карта сайта для поисковиков: все публичные страницы на обоих языках со ссылками друг на друга. */
export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    '/',
    '/catalog',
    ...catalog.map((p) => `/catalog/${p.slug}`),
    '/delivery',
    ...(hasAboutContent ? ['/about'] : []),
    '/contacts',
    '/privacy',
  ];

  return paths.flatMap((path) =>
    routing.locales.map((locale) => ({
      url: `${siteUrl}${localizedPath(path, locale)}`,
      changeFrequency: path.startsWith('/catalog') ? ('weekly' as const) : ('monthly' as const),
      priority: path === '/' ? 1 : path.startsWith('/catalog') ? 0.8 : 0.5,
      alternates: {
        languages: Object.fromEntries(routing.locales.map((l) => [l, `${siteUrl}${localizedPath(path, l)}`])),
      },
    })),
  );
}
