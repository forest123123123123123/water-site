import { ArrowRight, Phone } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { OrdersOpen } from '@/components/orders-open';
import { ButtonAnchor, ButtonLink } from '@/components/ui/button';
import { SocialIcon } from '@/components/ui/social-icon';
import { formatPhoneForDisplay, phoneHref } from '@/lib/format';
import { volumeList } from '@/lib/catalog';
import type { Locale } from '@/lib/locale';
import { primaryPhone } from '@/lib/site';
import { SOCIAL_NAMES, getSocialLink } from '@/lib/social';

/**
 * Финальный призыв: каталог + звонок/мессенджеры, если они указаны в настройках.
 * Призыв заказать онлайн показывается только пока сайт принимает заказы.
 */
export function FinalCta() {
  const t = useTranslations('home.cta');
  const locale = useLocale() as Locale;
  const telegram = getSocialLink('telegram');
  const whatsapp = getSocialLink('whatsapp');

  return (
    <section className="container-page py-10 lg:py-14">
      <div className="reveal relative isolate overflow-hidden rounded-panel bg-[linear-gradient(135deg,var(--color-sea-500),var(--color-sea-800))] px-6 py-12 text-white sm:px-12 lg:px-16 lg:py-16">
        <svg
          className="absolute right-0 bottom-0 -z-10 h-full w-auto opacity-25"
          viewBox="0 0 400 400"
          aria-hidden
        >
          {[60, 110, 160, 210, 260].map((r) => (
            <circle key={r} cx="400" cy="400" r={r} fill="none" stroke="#fff" strokeWidth="1.5" />
          ))}
        </svg>
        <div className="max-w-2xl">
          <OrdersOpen
            otherwise={
              <>
                <h2 className="display-md text-white">{t('closedTitle', { volumes: volumeList(locale) })}</h2>
                <p className="lead mt-4 text-sea-50/85">{t('closedText')}</p>
              </>
            }
          >
            <h2 className="display-md text-white">{t('title')}</h2>
            <p className="lead mt-4 text-sea-50/85">{t('text')}</p>
          </OrdersOpen>
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/catalog" variant="white" size="lg" className="w-full sm:w-auto">
            {t('button')}
            <ArrowRight className="size-5" aria-hidden />
          </ButtonLink>
          {primaryPhone && (
            <ButtonAnchor
              href={phoneHref(primaryPhone)}
              size="lg"
              className="w-full bg-white/12 ring-1 ring-white/30 hover:bg-white/20 sm:w-auto"
              variant="ghost"
            >
              <Phone className="size-5 text-white" aria-hidden />
              <span className="text-white">{formatPhoneForDisplay(primaryPhone)}</span>
            </ButtonAnchor>
          )}
          {[telegram, whatsapp].map(
            (link) =>
              link && (
                <ButtonAnchor
                  key={link.network}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  size="lg"
                  variant="ghost"
                  className="w-full bg-white/12 text-white ring-1 ring-white/30 hover:bg-white/20 hover:text-white sm:w-auto"
                >
                  <SocialIcon network={link.network} className="size-5" />
                  {SOCIAL_NAMES[link.network]}
                </ButtonAnchor>
              ),
          )}
        </div>
      </div>
    </section>
  );
}
