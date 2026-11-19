import { hasAboutContent } from '@/lib/site';

export type NavKey = 'catalog' | 'delivery' | 'about' | 'contacts';

/** Пункты главного меню. «О компании» появляется, когда о компании есть текст. */
export const NAV_ITEMS: { key: NavKey; href: string }[] = [
  { key: 'catalog', href: '/catalog' },
  { key: 'delivery', href: '/delivery' },
  ...(hasAboutContent ? [{ key: 'about' as const, href: '/about' }] : []),
  { key: 'contacts', href: '/contacts' },
];

export function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
