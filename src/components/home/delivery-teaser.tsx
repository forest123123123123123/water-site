import { ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { DeliveryFacts } from '@/components/delivery-facts';
import { ButtonLink } from '@/components/ui/button';
import { SectionHeading } from '@/components/ui/section-heading';

/** Блок о доставке на главной: что известно точно (Ташкент) + краткие условия из настроек. */
export function DeliveryTeaser() {
  const t = useTranslations('home.delivery');

  return (
    <section className="container-page py-16 lg:py-24" aria-labelledby="delivery-teaser-title">
      <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16">
        <div className="reveal">
          <SectionHeading id="delivery-teaser-title" eyebrow={t('eyebrow')} title={t('title')} text={t('text')} />
          <ButtonLink href="/delivery" variant="dark" className="mt-8">
            {t('link')}
            <ArrowRight className="size-4" aria-hidden />
          </ButtonLink>
        </div>
        <div className="reveal relative">
          <div
            className="pointer-events-none absolute -inset-4 -z-10 rounded-[2.5rem] sm:-inset-6 bg-[radial-gradient(70%_60%_at_60%_40%,var(--color-sea-100),transparent_70%)]"
            aria-hidden
          />
          <DeliveryFacts limit={3} className="lg:grid-cols-2" />
        </div>
      </div>
    </section>
  );
}
