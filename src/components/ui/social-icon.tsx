import { siFacebook, siInstagram, siTelegram, siTiktok, siWhatsapp, siYoutube } from 'simple-icons';
import type { SocialNetwork } from '@config/types';

const ICONS: Record<SocialNetwork, { path: string; hex: string }> = {
  telegram: siTelegram,
  whatsapp: siWhatsapp,
  instagram: siInstagram,
  facebook: siFacebook,
  youtube: siYoutube,
  tiktok: siTiktok,
};

export function socialColor(network: SocialNetwork) {
  return `#${ICONS[network].hex}`;
}

/** Фирменная иконка соцсети (Simple Icons, лицензия CC0). */
export function SocialIcon({ network, className }: { network: SocialNetwork; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d={ICONS[network].path} />
    </svg>
  );
}
