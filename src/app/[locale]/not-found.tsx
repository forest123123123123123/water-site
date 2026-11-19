import { ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ProductVisual } from '@/components/product/product-visual';
import { ButtonLink } from '@/components/ui/button';
import { catalog } from '@/lib/catalog';

/** Фирменная 404: «страница утекла» — пустая бутыль и путь обратно в каталог. */
export default function NotFound() {
  const t = useTranslations('notFound');
  const bottle = catalog.find((p) => p.illustration === 'jug') ?? catalog[0];

  return (
    <section className="container-page flex min-h-[70vh] flex-col items-center justify-center py-16 text-center">
      {bottle && (
        <div className="relative h-52 w-36 rotate-[-14deg] sm:h-64 sm:w-44">
          <ProductVisual product={bottle} level={0.04} scaled={false} />
          <span className="absolute right-[-1.5rem] bottom-2 size-3 animate-ping rounded-full bg-sea-300" aria-hidden />
        </div>
      )}
      <p className="eyebrow mt-10">{t('code')}</p>
      <h1 className="display-lg mt-3 text-ink-950">{t('title')}</h1>
      <p className="lead mt-4 max-w-lg">{t('text')}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <ButtonLink href="/catalog" size="lg">
          {t('catalog')}
          <ArrowRight className="size-5" aria-hidden />
        </ButtonLink>
        <ButtonLink href="/" size="lg" variant="outline">
          {t('home')}
        </ButtonLink>
      </div>
    </section>
  );
}
