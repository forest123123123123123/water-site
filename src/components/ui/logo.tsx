import { useId } from 'react';
import { siteConfig } from '@config/site';
import { brandName } from '@/lib/site';
import { cn } from '@/lib/utils';

/** Фирменный знак: капля с волной внутри. Используется, пока нет логотипа компании. */
export function LogoMark({ className }: { className?: string }) {
  const id = `logo-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <defs>
        <linearGradient id={id} x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0" stopColor="#5cc3f0" />
          <stop offset="1" stopColor="#0d5e93" />
        </linearGradient>
      </defs>
      <path d="M20 3.5C20 3.5 7 18 7 26a13 13 0 0 0 26 0C33 18 20 3.5 20 3.5Z" fill={`url(#${id})`} />
      <path
        d="M9.6 27.2c2.4-1.6 4.4-1.6 6.6 0s4.4 1.6 6.6 0 4.4-1.6 6.6 0"
        fill="none"
        stroke="#fff"
        strokeWidth="2.4"
        strokeLinecap="round"
        opacity="0.95"
      />
      <path d="M14.5 21.5c.6-2.6 2-5 3.4-6.9" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}

/**
 * Логотип в шапке и подвале. Если в config/site.ts указан файл логотипа —
 * показывается он, иначе знак-капля с названием компании.
 */
export function Logo({ onDark = false, className }: { onDark?: boolean; className?: string }) {
  const src = onDark ? siteConfig.brand.logoOnDark || siteConfig.brand.logo : siteConfig.brand.logo;

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- логотип может быть SVG любого размера
      <img src={src} alt={brandName} className={cn('h-9 w-auto', className)} />
    );
  }

  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark className="size-9 shrink-0" />
      <span
        className={cn(
          'font-display text-[1.35rem] leading-none font-semibold tracking-[-0.03em]',
          onDark ? 'text-white' : 'text-ink-950',
        )}
      >
        {brandName}
      </span>
    </span>
  );
}
