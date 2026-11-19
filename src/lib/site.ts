import { aboutConfig } from '@config/content';
import { siteConfig } from '@config/site';
import { hasText } from './locale';
import { getSocialLink, getSocialLinks } from './social';

export const brandName = siteConfig.brand.name.trim() || 'Water';

const publicUrl = (process.env.NEXT_PUBLIC_SITE_URL || siteConfig.url).trim().replace(/\/+$/, '');

/** Базовый адрес для канонических ссылок, карты сайта и превью. */
export const siteUrl = publicUrl || 'http://localhost:3000';

/** Без публичного адреса канонические ссылки указывали бы на localhost, поэтому индексация закрыта. */
export const isIndexable = publicUrl !== '';

export const phones = siteConfig.contacts.phones.map((p) => p.trim()).filter(Boolean);
export const primaryPhone = phones[0] ?? null;

export const hasAnyContact =
  phones.length > 0 ||
  Boolean(siteConfig.contacts.email.trim()) ||
  getSocialLinks().length > 0 ||
  hasText(siteConfig.contacts.address);

/** Страница «О компании» публикуется, только когда о компании есть текст. */
export const hasAboutContent = aboutConfig.paragraphs.some((p) => hasText(p));

/**
 * Способ приёма заказов с учётом заполненных контактов.
 * 'unconfigured' — выбран мессенджер, но его контакт не указан.
 */
export type OrderMode = 'api' | 'whatsapp' | 'telegram' | 'unconfigured';

export function getOrderMode(): OrderMode {
  const { channel } = siteConfig.orders;
  if (channel === 'api') return 'api';
  return getSocialLink(channel) ? channel : 'unconfigured';
}
