'use client';

import { Phone } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { CartButton } from '@/components/cart/cart-button';
import { Logo } from '@/components/ui/logo';
import { Link, usePathname } from '@/i18n/navigation';
import { formatPhoneForDisplay, phoneHref } from '@/lib/format';
import { brandName, primaryPhone } from '@/lib/site';
import { cn } from '@/lib/utils';
import { LanguageSwitcher } from './language-switcher';
import { MobileMenu } from './mobile-menu';
import { NAV_ITEMS, isActivePath } from './nav-items';

export function Header() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className="sticky top-0 z-50">
      <div
        className={cn(
          'border-b transition-[background-color,border-color,box-shadow] duration-500',
          scrolled
            ? 'border-ink-100/80 bg-white/80 shadow-[0_8px_30px_-18px_rgb(10_26_44_/_0.25)] backdrop-blur-xl backdrop-saturate-150'
            : 'border-transparent bg-foam/0',
        )}
      >
        <div className="container-page flex h-16 items-center justify-between gap-3 lg:h-[76px]">
          <Link href="/" aria-label={`${brandName}, ${t('home')}`} className="shrink-0 rounded-xl">
            <Logo />
          </Link>

          <nav aria-label={t('mainNav')} className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {NAV_ITEMS.map((item) => {
                const active = isActivePath(pathname, item.href);
                return (
                  <li key={item.key}>
                    <Link
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'relative block rounded-full px-4 py-2.5 text-[0.95rem] font-medium transition-colors duration-300',
                        active ? 'text-ink-950' : 'text-ink-600 hover:text-ink-950',
                      )}
                    >
                      {active && (
                        <motion.span
                          layoutId="nav-pill"
                          className="absolute inset-0 rounded-full bg-white shadow-[0_2px_10px_-3px_rgb(10_26_44_/_0.18)] ring-1 ring-ink-100"
                          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                        />
                      )}
                      <span className="relative">{item.key === 'delivery' ? t('deliveryShort') : t(item.key)}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {primaryPhone && (
              <a
                href={phoneHref(primaryPhone)}
                className="hidden items-center gap-2 rounded-full px-3 py-2 text-[0.95rem] font-semibold text-ink-900 transition-colors hover:text-sea-700 xl:inline-flex"
              >
                <Phone className="size-4 text-sea-600" aria-hidden />
                {formatPhoneForDisplay(primaryPhone)}
              </a>
            )}
            <LanguageSwitcher />
            <CartButton />
            <MobileMenu />
          </div>
        </div>
      </div>
    </header>
  );
}
