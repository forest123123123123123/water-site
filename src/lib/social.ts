import { siteConfig } from '@config/site';
import type { Localized, SocialNetwork } from '@config/types';
import { digitsOnly, formatPhoneForDisplay } from './format';

export type SocialLink = {
  network: SocialNetwork;
  href: string;
  /** Отображаемое имя: @mycompany, +998 90 … */
  handle: string;
};

const SOCIAL_ORDER: SocialNetwork[] = [
  'telegram',
  'whatsapp',
  'instagram',
  'facebook',
  'youtube',
  'tiktok',
];

export const SOCIAL_NAMES: Record<SocialNetwork, string> = {
  telegram: 'Telegram',
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  facebook: 'Facebook',
  youtube: 'YouTube',
  tiktok: 'TikTok',
};

const BASE: Record<Exclude<SocialNetwork, 'whatsapp'>, (handle: string) => string> = {
  telegram: (h) => `https://t.me/${h}`,
  instagram: (h) => `https://instagram.com/${h}`,
  facebook: (h) => `https://facebook.com/${h}`,
  youtube: (h) => `https://youtube.com/@${h}`,
  tiktok: (h) => `https://tiktok.com/@${h}`,
};

function isUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

function lastPathSegment(url: string) {
  try {
    const { pathname } = new URL(url);
    const segment = pathname.split('/').filter(Boolean).pop() ?? '';
    return segment.replace(/^@/, '');
  } catch {
    return url;
  }
}

/** Превращает значение из настроек (имя, @имя, номер или ссылку) в готовую ссылку. */
export function resolveSocial(network: SocialNetwork, rawValue: string): SocialLink | null {
  const value = rawValue.trim();
  if (!value) return null;

  if (network === 'whatsapp') {
    if (isUrl(value)) return { network, href: value, handle: 'WhatsApp' };
    const digits = digitsOnly(value);
    if (digits.length < 9) return null;
    const international = digits.length === 9 ? `998${digits}` : digits;
    return { network, href: `https://wa.me/${international}`, handle: formatPhoneForDisplay(`+${international}`) };
  }

  if (isUrl(value)) {
    return { network, href: value, handle: `@${lastPathSegment(value)}` };
  }

  const handle = value.replace(/^@/, '');
  return { network, href: BASE[network](handle), handle: `@${handle}` };
}

/** Все заполненные соцсети в правильном порядке. Пустые не попадают в список. */
export function getSocialLinks(): SocialLink[] {
  return SOCIAL_ORDER.map((network) => resolveSocial(network, siteConfig.social[network] ?? '')).filter(
    (link): link is SocialLink => link !== null,
  );
}

export function getSocialLink(network: SocialNetwork): SocialLink | null {
  return resolveSocial(network, siteConfig.social[network] ?? '');
}

export function getOtherLinks(): { label: Localized; url: string }[] {
  return siteConfig.otherLinks.filter((link) => link.url.trim() && (link.label.ru || link.label.uz));
}

/** Ссылка на чат компании в мессенджере; если передан текст — он подставляется в сообщение. */
export function messengerHref(network: 'whatsapp' | 'telegram', text?: string | null): string | null {
  const link = getSocialLink(network);
  if (!link) return null;
  if (!text) return link.href;
  return `${link.href.split('?')[0]}?text=${encodeURIComponent(text)}`;
}
