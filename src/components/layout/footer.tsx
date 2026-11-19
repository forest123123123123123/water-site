import { siteConfig } from '@config/site';
import { Mail, MapPin, Phone } from 'lucide-react';
import { cacheLife } from 'next/cache';
import { getLocale, getTranslations } from 'next-intl/server';
import { Logo } from '@/components/ui/logo';
import { SocialIcon } from '@/components/ui/social-icon';
import { Link } from '@/i18n/navigation';
import { catalog, productTitle, volumeList } from '@/lib/catalog';
import { formatPhoneForDisplay, phoneHref } from '@/lib/format';
import { tr } from '@/lib/locale';
import { brandName, phones } from '@/lib/site';
import { SOCIAL_NAMES, getSocialLinks } from '@/lib/social';
import { NAV_ITEMS } from './nav-items';

/** Год для копирайта: кэшируется на сутки, чтобы страницы оставались статическими. */
async function currentYear() {
  'use cache';
  cacheLife('days');
  return new Date().getFullYear();
}

export async function Footer() {
  const [t, tNav, locale, year] = await Promise.all([
    getTranslations('footer'),
    getTranslations('nav'),
    getLocale(),
    currentYear(),
  ]);
  const socials = getSocialLinks();
  const email = siteConfig.contacts.email.trim();
  const address = tr(siteConfig.contacts.address, locale);

  return (
    <footer className="relative mt-24 bg-ink-950 text-ink-200 lg:mt-32">
      <svg
        className="absolute top-px left-0 h-10 w-full -translate-y-full text-ink-950 lg:h-16"
        viewBox="0 0 1440 64"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          d="M0 40 C 180 8 360 8 540 30 S 900 64 1080 40 S 1320 10 1440 26 V64 H0 Z"
          fill="currentColor"
        />
      </svg>

      <div className="container-page grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr] lg:py-20">
        <div className="max-w-sm">
          <Link href="/" aria-label={brandName} className="inline-block rounded-xl">
            <Logo onDark />
          </Link>
          <p className="mt-5 leading-relaxed text-ink-300">{t('about', { volumes: volumeList(locale) })}</p>
          {socials.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {socials.map((s) => (
                <a
                  key={s.network}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={SOCIAL_NAMES[s.network]}
                  className="grid size-11 place-items-center rounded-full bg-white/8 text-white transition-colors hover:bg-white/15"
                >
                  <SocialIcon network={s.network} className="size-[1.1rem]" />
                </a>
              ))}
            </div>
          )}
        </div>

        <nav aria-label={t('navigation')}>
          <h2 className="text-sm font-semibold tracking-[0.12em] text-white uppercase">{t('navigation')}</h2>
          <ul className="mt-5 space-y-3">
            {[{ key: 'home' as const, href: '/' }, ...NAV_ITEMS, { key: 'cart' as const, href: '/cart' }].map(
              (item) => (
                <li key={item.key}>
                  <Link href={item.href} className="transition-colors hover:text-white">
                    {tNav(item.key)}
                  </Link>
                </li>
              ),
            )}
          </ul>
        </nav>

        <div>
          <h2 className="text-sm font-semibold tracking-[0.12em] text-white uppercase">{t('catalog')}</h2>
          <ul className="mt-5 space-y-3">
            {catalog.map((p) => (
              <li key={p.id}>
                <Link href={`/catalog/${p.slug}`} className="transition-colors hover:text-white">
                  {productTitle(p, locale)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold tracking-[0.12em] text-white uppercase">{t('contacts')}</h2>
          <ul className="mt-5 space-y-3">
            {phones.map((phone) => (
              <li key={phone}>
                <a href={phoneHref(phone)} className="inline-flex items-center gap-2.5 font-semibold text-white hover:text-sea-300">
                  <Phone className="size-4 text-sea-400" aria-hidden />
                  {formatPhoneForDisplay(phone)}
                </a>
              </li>
            ))}
            {email && (
              <li>
                <a href={`mailto:${email}`} className="inline-flex items-center gap-2.5 hover:text-white">
                  <Mail className="size-4 text-sea-400" aria-hidden />
                  {email}
                </a>
              </li>
            )}
            {address && (
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 size-4 shrink-0 text-sea-400" aria-hidden />
                {address}
              </li>
            )}
            <li>
              <Link href="/contacts" className="link-underline decoration-ink-600 hover:decoration-sea-400">
                {tNav('contacts')}
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/8">
        <div className="container-page flex flex-col gap-3 py-6 text-sm text-ink-300 sm:flex-row sm:items-center sm:justify-between">
          <p>
            {t('rights', { year, brand: brandName })}
            {siteConfig.brand.legalName.trim() && <span> · {siteConfig.brand.legalName.trim()}</span>}
          </p>
          <Link href="/privacy" className="hover:text-white">
            {tNav('privacy')}
          </Link>
        </div>
      </div>
    </footer>
  );
}
