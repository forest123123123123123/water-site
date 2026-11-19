'use client';

import { ArrowRight, Plus, Trash2, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { DirectContacts } from '@/components/checkout/order-result';
import { ProductStage } from '@/components/product/product-stage';
import { ProductVisual } from '@/components/product/product-visual';
import { ButtonLink, buttonStyles } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { catalog, productTitle } from '@/lib/catalog';
import { computeCart, type CartItemView } from '@/lib/cart/compute';
import { useCart, useCartHydrated } from '@/lib/cart/store';
import { formatPrice, formatVolume } from '@/lib/format';
import type { Locale } from '@/lib/locale';
import { cn } from '@/lib/utils';
import { CartTotals } from './cart-totals';
import { QuantityStepper } from './quantity-stepper';
import { useCartActions } from './use-cart-actions';

export function CartView({ acceptsOrders }: { acceptsOrders: boolean }) {
  const t = useTranslations('cart');
  const tCheckout = useTranslations('checkout');
  const hydrated = useCartHydrated();
  const lines = useCart((s) => s.lines);

  if (!hydrated) return <CartSkeleton />;
  if (lines.length === 0) return <EmptyCart />;

  const cart = computeCart(lines);

  const clearAll = () => {
    const snapshot = useCart.getState().lines;
    useCart.getState().clear();
    toast(t('cleared'), {
      action: { label: t('undo'), onClick: () => useCart.setState({ lines: snapshot }) },
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_24rem] lg:gap-10">
      <div>
        {cart.hasUnavailable && (
          <p role="alert" className="mb-4 rounded-2xl bg-coral-50 p-4 text-[0.95rem] font-medium text-coral-500 ring-1 ring-coral-500/20">
            {t('hasUnavailable')}
          </p>
        )}
        <ul className="space-y-3">
          <AnimatePresence initial={false}>
            {cart.items.map((item) => (
              <motion.li
                key={item.product.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -40, transition: { duration: 0.25 } }}
                transition={{ type: 'spring', stiffness: 420, damping: 36 }}
              >
                <CartLine item={item} />
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <Link href="/catalog" className={buttonStyles({ variant: 'ghost', size: 'sm' })}>
            <Plus className="size-4" aria-hidden />
            {t('continue')}
          </Link>
          <button type="button" onClick={clearAll} className={buttonStyles({ variant: 'ghost', size: 'sm', className: 'text-ink-500' })}>
            <Trash2 className="size-4" aria-hidden />
            {t('clear')}
          </button>
        </div>
      </div>

      <div className="lg:sticky lg:top-28 lg:self-start">
        <CartTotals cart={cart}>
          {acceptsOrders ? (
            <ButtonLink
              href="/checkout"
              size="lg"
              className={cn('mt-6 w-full', !cart.canCheckout && 'pointer-events-none opacity-45')}
              aria-disabled={!cart.canCheckout}
              tabIndex={cart.canCheckout ? undefined : -1}
            >
              {t('checkout')}
              <ArrowRight className="size-5" aria-hidden />
            </ButtonLink>
          ) : (
            <div className="mt-6">
              <p className="font-semibold text-ink-950">{tCheckout('unavailable.title')}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-500">{tCheckout('unavailable.text')}</p>
              <DirectContacts title={tCheckout('directOrder')} />
            </div>
          )}
          {acceptsOrders && <p className="mt-4 text-center text-xs leading-relaxed text-ink-400">{t('storedHint')}</p>}
        </CartTotals>
      </div>
    </div>
  );
}

function CartLine({ item }: { item: CartItemView }) {
  const t = useTranslations('cart');
  const tc = useTranslations('common');
  const locale = useLocale() as Locale;
  const { setQty, remove } = useCartActions();
  const { product, qty, lineTotal, available } = item;
  const title = productTitle(product, locale);

  return (
    <article
      className={cn(
        'relative flex gap-4 rounded-card bg-white p-3 shadow-soft ring-1 ring-ink-100 sm:gap-5 sm:p-4',
        !available && 'ring-coral-500/30',
      )}
    >
      <Link href={`/catalog/${product.slug}`} className="shrink-0" tabIndex={-1} aria-hidden>
        <ProductStage tone={product.tone} wave={false} className="h-28 w-24 rounded-2xl sm:h-32 sm:w-28">
          <div className="absolute inset-x-3 top-3 bottom-2">
            <ProductVisual product={product} animated={false} />
          </div>
        </ProductStage>
      </Link>

      <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="min-w-0 pr-8 sm:pr-0">
          <h2 className="font-semibold leading-snug text-ink-950">
            <Link href={`/catalog/${product.slug}`} className="hover:text-sea-700">
              {title}
            </Link>
          </h2>
          <p className="mt-1 text-sm text-ink-500">
            {product.price != null ? t('unitPrice', { price: formatPrice(product.price, locale) }) : tc('priceOnRequest')}
          </p>
          {!available && <p className="mt-1 text-sm font-semibold text-coral-500">{t('unavailableItem')}</p>}
        </div>

        <div className="flex items-center justify-between gap-4 sm:justify-end sm:gap-6">
          <QuantityStepper value={qty} onChange={(n) => setQty(product.id, n)} label={title} size="sm" />
          <div className="min-w-[5.5rem] text-right">
            {lineTotal != null ? (
              <>
                <p className="font-display font-semibold text-ink-950">{formatPrice(lineTotal, locale)}</p>
                {product.volume != null && (
                  <p className="text-xs text-ink-400">{formatVolume(product.volume * qty, locale)}</p>
                )}
              </>
            ) : (
              product.volume != null && (
                <p className="font-display font-semibold text-ink-950">{formatVolume(product.volume * qty, locale)}</p>
              )
            )}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => remove(product.id)}
        aria-label={`${t('remove')}: ${title}`}
        className="absolute top-3 right-3 grid size-8 place-items-center rounded-full text-ink-400 transition-colors hover:bg-coral-50 hover:text-coral-500 sm:static sm:size-10 sm:self-center"
      >
        <X className="size-4" aria-hidden />
      </button>
    </article>
  );
}

function EmptyCart() {
  const t = useTranslations('cart');
  const tc = useTranslations('common');
  const locale = useLocale() as Locale;
  const { add } = useCartActions();
  const showcase = catalog.find((p) => p.illustration === 'cooler') ?? catalog[0];

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center py-6 text-center">
      {showcase && (
        <div className="relative h-56 w-40">
          <div className="absolute inset-x-0 bottom-0 mx-auto h-6 w-36 rounded-[50%] bg-[radial-gradient(closest-side,rgb(63_175_229_/_0.25),transparent)]" />
          <ProductVisual product={showcase} level={0.07} scaled={false} />
        </div>
      )}
      <h2 className="display-md mt-6 text-ink-950">{t('empty')}</h2>
      <p className="lead mt-3">{t('emptyText')}</p>
      <ButtonLink href="/catalog" size="lg" className="mt-8">
        {tc('toCatalog')}
        <ArrowRight className="size-5" aria-hidden />
      </ButtonLink>
      <div className="mt-10 w-full">
        <p className="text-sm font-semibold text-ink-500">{t('quickAdd')}</p>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {catalog
            .filter((p) => p.inStock)
            .map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={(e) => add(p.id, 1, e.currentTarget)}
                className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-ink-900 shadow-soft ring-1 ring-ink-100 transition-all hover:-translate-y-0.5 hover:ring-sea-200"
              >
                <Plus className="size-4 text-sea-600" aria-hidden />
                {productTitle(p, locale)}
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}

export function CartSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_24rem] lg:gap-10" aria-busy="true">
      <div className="space-y-3">
        {[0, 1].map((i) => (
          <div key={i} className="flex gap-4 rounded-card bg-white p-4 ring-1 ring-ink-100">
            <div className="h-28 w-24 rounded-2xl bg-ink-50" />
            <div className="flex-1 space-y-3 py-2">
              <div className="skeleton-line w-1/2" />
              <div className="skeleton-line w-1/3" />
            </div>
          </div>
        ))}
      </div>
      <div className="h-72 rounded-card bg-white ring-1 ring-ink-100" />
    </div>
  );
}
