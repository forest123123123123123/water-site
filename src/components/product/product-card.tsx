import { useLocale } from 'next-intl';
import { AddToCart } from '@/components/cart/add-to-cart';
import { Link } from '@/i18n/navigation';
import { productTitle, type Product } from '@/lib/catalog';
import { formatNumber, literLabel } from '@/lib/format';
import { tr, type Locale } from '@/lib/locale';
import { cn } from '@/lib/utils';
import { PriceTag } from './price-tag';
import { ProductStage } from './product-stage';
import { ProductVisual } from './product-visual';
import { StockBadge } from './stock-badge';

/**
 * Карточка товара для каталога. Вся карточка ведёт на страницу товара
 * (растянутая ссылка), а кнопка «В корзину» работает поверх неё.
 */
export function ProductCard({
  product,
  priority,
  className,
  headingLevel = 'h3',
}: {
  product: Product;
  priority?: boolean;
  className?: string;
  /** h2 — если над карточками нет своего заголовка раздела (страница каталога). */
  headingLevel?: 'h2' | 'h3';
}) {
  const Heading = headingLevel;
  const locale = useLocale() as Locale;
  const title = productTitle(product, locale);
  const description = tr(product.shortDescription, locale);

  return (
    <article
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-card bg-white shadow-soft ring-1 ring-ink-100',
        'transition-[box-shadow,transform] duration-500 ease-fluid hover:-translate-y-1 hover:shadow-lift',
        'has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-sea-500',
        className,
      )}
    >
      <ProductStage tone={product.tone} className="h-56 sm:h-72">
        <div className="absolute top-4 left-4 z-10">
          <StockBadge product={product} />
        </div>
        <div className="absolute inset-x-6 top-10 bottom-5 transition-transform duration-700 ease-fluid group-hover:-translate-y-1.5">
          <ProductVisual product={product} alt={title} priority={priority} />
        </div>
      </ProductStage>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-baseline gap-2">
          {product.volume != null && (
            <span className="font-display text-[2.6rem] leading-none font-semibold tracking-[-0.04em] text-ink-950">
              {formatNumber(product.volume)}
              <span className="ml-1 text-[1.3rem] tracking-normal text-ink-400">{literLabel(locale)}</span>
            </span>
          )}
        </div>
        <Heading className="mt-3 text-lg leading-snug font-semibold text-ink-900">
          <Link
            href={`/catalog/${product.slug}`}
            className="rounded-md after:absolute after:inset-0 after:z-0 after:content-[''] focus-visible:outline-none"
          >
            {title}
          </Link>
        </Heading>
        {description && <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-500">{description}</p>}
        <div className="mt-auto pt-5">
          <PriceTag product={product} />
          <div className="relative z-10 mt-4 flex items-center gap-3">
            <AddToCart product={product} stretch className="flex-1" />
          </div>
        </div>
      </div>
    </article>
  );
}
