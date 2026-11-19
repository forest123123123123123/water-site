import { siteConfig } from '@config/site';
import { Clock, ExternalLink, Mail, MapPin, MessageCircle, Phone, type LucideIcon } from 'lucide-react';
import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';
import { FinalCta } from '@/components/home/final-cta';
import { BreadcrumbJsonLd } from '@/components/json-ld';
import { ButtonAnchor } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { SocialIcon, socialColor } from '@/components/ui/social-icon';
import { formatPhoneForDisplay, phoneHref } from '@/lib/format';
import { tr, type Locale } from '@/lib/locale';
import { buildMetadata } from '@/lib/seo';
import { brandName, hasAnyContact, phones } from '@/lib/site';
import { SOCIAL_NAMES, getOtherLinks, getSocialLinks } from '@/lib/social';
import { cn } from '@/lib/utils';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta');
  return buildMetadata({
    path: '/contacts',
    title: t('contactsTitle'),
    description: t('contactsDescription', { brand: brandName }),
  });
}

function Card({ Icon, title, children, className }: { Icon: LucideIcon; title: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn('reveal flex flex-col rounded-card bg-white p-6 shadow-soft ring-1 ring-ink-100 sm:p-7', className)}>
      <div className="flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-xl bg-sea-50 text-sea-700">
          <Icon className="size-5" strokeWidth={1.8} aria-hidden />
        </span>
        <h2 className="text-lg font-semibold text-ink-950">{title}</h2>
      </div>
      <div className="mt-5 flex flex-1 flex-col gap-3">{children}</div>
    </div>
  );
}

export default async function ContactsPage() {
  const [t, tNav, locale] = await Promise.all([getTranslations('contacts'), getTranslations('nav'), getLocale()]);
  const lang = locale as Locale;
  const socials = getSocialLinks();
  const messengers = socials.filter((s) => s.network === 'telegram' || s.network === 'whatsapp');
  const networks = socials.filter((s) => s.network !== 'telegram' && s.network !== 'whatsapp');
  const other = getOtherLinks();
  const email = siteConfig.contacts.email.trim();
  const address = tr(siteConfig.contacts.address, lang);
  const hours = tr(siteConfig.contacts.workingHours, lang);
  const map = siteConfig.contacts.mapEmbedUrl.trim();

  return (
    <>
      <BreadcrumbJsonLd items={[{ name: tNav('home'), path: '/' }, { name: tNav('contacts'), path: '/contacts' }]} />
      <PageHeader crumbs={[{ name: tNav('home'), href: '/' }, { name: tNav('contacts') }]} title={t('title')} lead={t('lead')} />

      <section className="container-page">
        {!hasAnyContact ? (
          <p className="lead">{t('empty')}</p>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {phones.length > 0 && (
              <Card Icon={Phone} title={t('phone')}>
                {phones.map((p) => (
                  <a key={p} href={phoneHref(p)} className="group flex items-center justify-between gap-3 rounded-2xl bg-sea-50 px-4 py-3.5 transition-colors hover:bg-sea-100">
                    <span className="font-display text-lg font-semibold text-ink-950">{formatPhoneForDisplay(p)}</span>
                    <span className="text-sm font-semibold text-sea-700">{t('call')}</span>
                  </a>
                ))}
              </Card>
            )}

            {messengers.length > 0 && (
              <Card Icon={MessageCircle} title={t('messengers')}>
                {messengers.map((s) => (
                  <ButtonAnchor
                    key={s.network}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="outline"
                    size="lg"
                    className="justify-start"
                  >
                    <span style={{ color: socialColor(s.network) }}>
                      <SocialIcon network={s.network} className="size-5" />
                    </span>
                    {SOCIAL_NAMES[s.network]}
                    <span className="ml-auto text-sm font-medium text-ink-400">{s.handle}</span>
                  </ButtonAnchor>
                ))}
              </Card>
            )}

            {networks.length > 0 && (
              <Card Icon={ExternalLink} title={t('social')}>
                <div className="flex flex-wrap gap-2">
                  {networks.map((s) => (
                    <a
                      key={s.network}
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-12 items-center gap-2.5 rounded-full bg-white px-4 font-semibold text-ink-900 ring-1 ring-ink-200 transition-colors hover:ring-sea-300"
                    >
                      <span style={{ color: socialColor(s.network) }}>
                        <SocialIcon network={s.network} className="size-5" />
                      </span>
                      {SOCIAL_NAMES[s.network]}
                    </a>
                  ))}
                </div>
              </Card>
            )}

            {email && (
              <Card Icon={Mail} title={t('email')}>
                <a href={`mailto:${email}`} className="link-underline self-start text-lg font-semibold text-ink-900">
                  {email}
                </a>
              </Card>
            )}

            {address && (
              <Card Icon={MapPin} title={t('address')}>
                <p className="text-lg leading-relaxed text-ink-800">{address}</p>
              </Card>
            )}

            {hours && (
              <Card Icon={Clock} title={t('hours')}>
                <p className="text-lg leading-relaxed text-ink-800">{hours}</p>
              </Card>
            )}

            {other.length > 0 && (
              <Card Icon={ExternalLink} title={t('links')}>
                {other.map((link) => (
                  <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer" className="link-underline self-start font-semibold text-ink-900">
                    {tr(link.label, lang)}
                  </a>
                ))}
              </Card>
            )}
          </div>
        )}

        {map && (
          <div className="reveal mt-8 overflow-hidden rounded-panel ring-1 ring-ink-100">
            <h2 className="sr-only">{t('map')}</h2>
            <iframe src={map} title={t('map')} loading="lazy" className="h-[420px] w-full border-0" referrerPolicy="no-referrer-when-downgrade" />
          </div>
        )}
      </section>

      <div className="pt-16 lg:pt-20">
        <FinalCta />
      </div>
    </>
  );
}
