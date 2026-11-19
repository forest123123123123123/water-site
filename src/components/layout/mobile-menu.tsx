'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { ArrowUpRight, Menu, Phone, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { Logo } from '@/components/ui/logo';
import { SocialIcon } from '@/components/ui/social-icon';
import { Link, usePathname } from '@/i18n/navigation';
import { catalog } from '@/lib/catalog';
import { formatPhoneForDisplay, formatVolume, phoneHref } from '@/lib/format';
import { primaryPhone } from '@/lib/site';
import { SOCIAL_NAMES, getSocialLinks } from '@/lib/social';
import { cn } from '@/lib/utils';
import { NAV_ITEMS, isActivePath } from './nav-items';

export function MobileMenu() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [openedAt, setOpenedAt] = useState(pathname);
  const socials = getSocialLinks();

  // Меню закрывается при любом переходе на другую страницу (в том числе кнопкой «Назад»).
  if (openedAt !== pathname) {
    setOpenedAt(pathname);
    if (open) setOpen(false);
  }

  const links = [{ key: 'home' as const, href: '/' }, ...NAV_ITEMS, { key: 'cart' as const, href: '/cart' }];

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger
        className="grid size-11 place-items-center rounded-full bg-white text-ink-900 ring-1 ring-ink-100 transition-colors hover:bg-sea-50 lg:hidden"
        aria-label={t('openMenu')}
      >
        <Menu className="size-5" aria-hidden />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-ink-950/40 backdrop-blur-sm data-[state=closed]:animate-[overlay-out_0.25s_ease_both] data-[state=open]:animate-[overlay-in_0.3s_ease_both]" />
        <Dialog.Content
          className={cn(
            'fixed inset-x-2 top-2 bottom-2 z-[61] flex flex-col overflow-y-auto rounded-[1.75rem] bg-foam p-5 shadow-lift outline-none',
            'data-[state=closed]:animate-[menu-out_0.25s_var(--ease-fluid)_both] data-[state=open]:animate-[menu-in_0.45s_var(--ease-fluid)_both]',
          )}
        >
          <div className="flex items-center justify-between">
            <Dialog.Title className="sr-only">{t('menu')}</Dialog.Title>
            <Dialog.Description className="sr-only">{t('mainNav')}</Dialog.Description>
            <Logo />
            <Dialog.Close
              className="grid size-11 place-items-center rounded-full bg-white text-ink-900 ring-1 ring-ink-100"
              aria-label={t('closeMenu')}
            >
              <X className="size-5" aria-hidden />
            </Dialog.Close>
          </div>

          <nav aria-label={t('mainNav')} className="mt-8">
            <ul className="flex flex-col">
              {links.map((item, i) => {
                const active = item.href === '/' ? pathname === '/' : isActivePath(pathname, item.href);
                return (
                  <li key={item.key} style={{ animationDelay: `${80 + i * 40}ms` }} className="animate-rise-in">
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'flex items-center justify-between border-b border-ink-100 py-4 font-display text-[1.45rem] font-semibold tracking-[-0.02em]',
                        active ? 'text-sea-700' : 'text-ink-950',
                      )}
                    >
                      {t(item.key)}
                      <ArrowUpRight className="size-5 text-ink-300" aria-hidden />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="mt-6 flex flex-wrap gap-2">
            {catalog
              .filter((p) => p.volume)
              .map((p) => (
                <Link
                  key={p.id}
                  href={`/catalog/${p.slug}`}
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-ink-900 ring-1 ring-ink-100"
                >
                  <span className="size-2.5 rounded-full" style={{ background: p.tone }} aria-hidden />
                  {formatVolume(p.volume ?? 0, locale)}
                </Link>
              ))}
          </div>

          <div className="mt-auto flex flex-col gap-4 pt-8">
            {primaryPhone && (
              <a
                href={phoneHref(primaryPhone)}
                className="flex items-center gap-3 rounded-2xl bg-ink-900 px-5 py-4 text-white"
              >
                <Phone className="size-5 text-sea-300" aria-hidden />
                <span className="font-semibold">{formatPhoneForDisplay(primaryPhone)}</span>
              </a>
            )}
            {socials.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {socials.map((s) => (
                  <a
                    key={s.network}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={SOCIAL_NAMES[s.network]}
                    className="grid size-12 place-items-center rounded-full bg-white text-ink-800 ring-1 ring-ink-100"
                  >
                    <SocialIcon network={s.network} className="size-5" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
