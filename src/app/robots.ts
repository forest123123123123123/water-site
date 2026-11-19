import type { MetadataRoute } from 'next';
import { isIndexable, siteUrl } from '@/lib/site';

/**
 * Пока не указан публичный адрес сайта, индексация закрыта целиком.
 * Корзина и оформление не запрещены здесь: им нужен meta robots noindex, а запрет
 * обхода не дал бы поисковику его увидеть (страница могла бы попасть в выдачу без описания).
 */
export default function robots(): MetadataRoute.Robots {
  if (!isIndexable) {
    return { rules: { userAgent: '*', disallow: '/' } };
  }
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/'],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
