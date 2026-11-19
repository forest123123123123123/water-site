import type { MetadataRoute } from 'next';
import { siteConfig } from '@config/site';
import { brandName } from '@/lib/site';

/** Манифест: название и иконки при добавлении сайта на главный экран телефона. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${brandName} · ${siteConfig.brand.tagline.ru}`,
    short_name: brandName,
    description: siteConfig.brand.tagline.ru,
    start_url: '/',
    display: 'standalone',
    background_color: '#f5f9fc',
    theme_color: '#0e75b6',
    lang: 'ru',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
