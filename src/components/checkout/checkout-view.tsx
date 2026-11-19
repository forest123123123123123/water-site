'use client';

import { deliveryConfig } from '@config/delivery';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, ChevronDown, Clock, LoaderCircle, Pencil, ShieldCheck } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useLayoutEffect, useRef, useState, type BaseSyntheticEvent, type ReactNode } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { CartTotals } from '@/components/cart/cart-totals';
import { ProductStage } from '@/components/product/product-stage';
import { ProductVisual } from '@/components/product/product-visual';
import { Button, ButtonLink } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { productTitle } from '@/lib/catalog';
import { computeCart, type CartSummary } from '@/lib/cart/compute';
import { useCart, useCartHydrated } from '@/lib/cart/store';
import { formatPrice, formatUzNational, formatVolume } from '@/lib/format';
import { tr, type Locale } from '@/lib/locale';
import { clearDetails, loadDetails, saveDetails } from '@/lib/order/remember';
import { checkoutFormSchema, type CheckoutFormValues } from '@/lib/order/schema';
import { submitOrder, type SubmitOutcome } from '@/lib/order/submit';
import { cn } from '@/lib/utils';
import { Field, inputStyles } from './field';
import { DirectContacts, OrderResult, Panel } from './order-result';
import { PhoneInput } from './phone-input';

const EMPTY_FORM: CheckoutFormValues = {
  name: '',
  phone: '',
  district: '',
  address: '',
  landmark: '',
  comment: '',
  remember: false,
};

export function CheckoutSkeleton() {
  return <div className="h-96 animate-pulse rounded-panel bg-white ring-1 ring-ink-100" aria-busy="true" />;
}

/** acceptsOrders — настроен ли хотя бы один способ приёма заказов; без него вместо формы показываются контакты. */
export function CheckoutView({ acceptsOrders }: { acceptsOrders: boolean }) {
  const t = useTranslations('checkout');
  const tc = useTranslations('common');
  const tCart = useTranslations('cart');
  const locale = useLocale() as Locale;
  const hydrated = useCartHydrated();
  const lines = useCart((s) => s.lines);
  const [outcome, setOutcome] = useState<SubmitOutcome | null>(null);
  const [submittedPhone, setSubmittedPhone] = useState('');
  // Данные, которые покупатель раньше сам разрешил запомнить. На сервере их нет (null), но до
  // восстановления корзины форма всё равно не показывается, поэтому разметка совпадает.
  const [saved] = useState(loadDetails);
  const [hasSaved, setHasSaved] = useState(saved !== null);
  /** Состав последнего отправленного заказа — из корзины убирается именно он. */
  const orderedRef = useRef<{ id: string; qty: number }[]>([]);
  const honeypotRef = useRef<HTMLInputElement>(null);
  const topRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: { ...EMPTY_FORM, ...saved, remember: saved !== null },
    mode: 'onTouched',
  });

  const forgetDetails = () => {
    clearDetails();
    setHasSaved(false);
  };

  // Когда страница скрывается при навигации, сбрасываем экран результата.
  useLayoutEffect(() => () => setOutcome(null), []);

  useEffect(() => {
    if (outcome) topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [outcome]);

  const onSubmit = async (values: CheckoutFormValues) => {
    const customer = {
      name: values.name,
      phone: values.phone,
      district: values.district,
      address: values.address,
      landmark: values.landmark,
      comment: values.comment,
    };
    const ordered = useCart.getState().lines;
    const result = await submitOrder({ lines: ordered, customer, locale, honeypot: honeypotRef.current?.value });
    orderedRef.current = ordered;
    setSubmittedPhone(`+998 ${formatUzNational(values.phone)}`);
    // Данные запоминаются только с согласия покупателя и только после оформления, не во время ввода.
    if ((result.kind === 'sent' || result.kind === 'messenger') && values.remember) {
      saveDetails(values);
      setHasSaved(true);
    }
    if (result.kind === 'sent') {
      useCart.getState().removeOrdered(ordered);
      setValue('comment', '');
    }
    setOutcome(result);
  };

  // handleSubmit вызывается только из обработчиков событий, не во время рендера.
  const submit = (event?: BaseSyntheticEvent) => handleSubmit(onSubmit)(event);

  if (!hydrated) return <CheckoutSkeleton />;

  if (outcome) {
    return (
      <div ref={topRef} className="mx-auto max-w-3xl scroll-mt-28">
        <OrderResult
          outcome={outcome}
          phoneDisplay={submittedPhone}
          onBack={() => setOutcome(null)}
          onRetry={() => {
            setOutcome(null);
            void submit();
          }}
          onMessengerDone={() => {
            useCart.getState().removeOrdered(orderedRef.current);
            setValue('comment', '');
            setOutcome(null);
            toast(tCart('cleared'));
          }}
        />
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-xl rounded-panel bg-white p-8 text-center shadow-soft ring-1 ring-ink-100 sm:p-12">
        <h2 className="display-md text-ink-950">{t('emptyTitle')}</h2>
        <p className="lead mt-3">{t('emptyText')}</p>
        <ButtonLink href="/catalog" size="lg" className="mt-8">
          {tc('toCatalog')}
          <ArrowRight className="size-5" aria-hidden />
        </ButtonLink>
      </div>
    );
  }

  const cart = computeCart(lines);
  const districts = deliveryConfig.districts;

  return (
    <div ref={topRef} className="grid gap-8 lg:grid-cols-[1fr_25rem] lg:gap-12">
      <div className="min-w-0">
        <MobileSummary cart={cart} />

        {!acceptsOrders ? (
          <Panel tone="info" icon={<Clock className="size-7" aria-hidden />} title={t('unavailable.title')}>
            <p className="lead mt-3">{t('unavailable.text')}</p>
            <DirectContacts title={t('directOrder')} />
          </Panel>
        ) : (
          <form onSubmit={submit} noValidate className="space-y-5">
            {/* Поле-ловушка для спам-ботов: людям не видно */}
            <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
              <label>
                Website
                <input ref={honeypotRef} type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
              </label>
            </div>

            <FormSection index={1} title={t('contactsTitle')}>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field id="name" label={t('name')} error={errors.name && t(`errors.${errors.name.message as 'nameShort'}`)}>
                  <input
                    id="name"
                    type="text"
                    autoComplete="name"
                    placeholder={t('namePlaceholder')}
                    aria-invalid={errors.name ? true : undefined}
                    aria-describedby={errors.name ? 'name-error' : undefined}
                    className={cn(inputStyles(Boolean(errors.name)), 'h-14')}
                    {...register('name')}
                  />
                </Field>
                <Field
                  id="phone"
                  label={t('phone')}
                  hint={t('phoneHint')}
                  error={errors.phone && t(`errors.${errors.phone.message as 'phoneInvalid'}`)}
                >
                  <Controller
                    control={control}
                    name="phone"
                    render={({ field, fieldState }) => (
                      <PhoneInput
                        id="phone"
                        name={field.name}
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        inputRef={field.ref}
                        invalid={Boolean(fieldState.error)}
                        describedBy={fieldState.error ? 'phone-error' : 'phone-hint'}
                      />
                    )}
                  />
                </Field>
              </div>
            </FormSection>

            <FormSection index={2} title={t('addressTitle')}>
              <div className="grid gap-5">
                {districts.length > 0 && (
                  <Field id="district" label={t('district')} optionalLabel={tc('optional')}>
                    <div className="relative">
                      <select id="district" className={cn(inputStyles(), 'h-14 appearance-none pr-12')} {...register('district')}>
                        <option value="">{t('districtPlaceholder')}</option>
                        {districts.map((d) => (
                          <option key={d.id} value={d.id}>
                            {tr(d.name, locale)}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute top-1/2 right-4 size-5 -translate-y-1/2 text-ink-400" aria-hidden />
                    </div>
                  </Field>
                )}
                <Field id="address" label={t('address')} error={errors.address && t(`errors.${errors.address.message as 'addressShort'}`)}>
                  <textarea
                    id="address"
                    rows={2}
                    autoComplete="street-address"
                    placeholder={t('addressPlaceholder')}
                    aria-invalid={errors.address ? true : undefined}
                    aria-describedby={errors.address ? 'address-error' : undefined}
                    className={cn(inputStyles(Boolean(errors.address)), 'min-h-[5.5rem] resize-y py-3.5 leading-relaxed')}
                    {...register('address')}
                  />
                </Field>
                <Field
                  id="landmark"
                  label={t('landmark')}
                  optionalLabel={tc('optional')}
                  error={errors.landmark && t(`errors.${errors.landmark.message as 'tooLong'}`)}
                >
                  <input
                    id="landmark"
                    type="text"
                    placeholder={t('landmarkPlaceholder')}
                    className={cn(inputStyles(Boolean(errors.landmark)), 'h-14')}
                    {...register('landmark')}
                  />
                </Field>
              </div>
            </FormSection>

            <FormSection index={3} title={t('commentTitle')}>
              <Field
                id="comment"
                label={t('comment')}
                optionalLabel={tc('optional')}
                error={errors.comment && t(`errors.${errors.comment.message as 'tooLong'}`)}
              >
                <textarea
                  id="comment"
                  rows={3}
                  placeholder={t('commentPlaceholder')}
                  className={cn(inputStyles(Boolean(errors.comment)), 'min-h-[6.5rem] resize-y py-3.5 leading-relaxed')}
                  {...register('comment')}
                />
              </Field>
              <label className="mt-5 flex cursor-pointer items-start gap-3 text-[0.95rem] text-ink-700">
                <input
                  type="checkbox"
                  className="mt-0.5 size-5 shrink-0 cursor-pointer accent-sea-600"
                  {...register('remember', {
                    // Снятая галочка — явный отказ: сохранённое удаляется сразу.
                    onChange: (event: { target: { checked: boolean } }) => {
                      if (!event.target.checked) forgetDetails();
                    },
                  })}
                />
                {t('remember')}
              </label>
              {hasSaved && (
                <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 pl-8 text-sm text-ink-500">
                  {t('rememberSaved')}
                  <button
                    type="button"
                    className="font-semibold text-sea-700 underline-offset-2 hover:underline"
                    onClick={() => {
                      forgetDetails();
                      setValue('remember', false);
                      toast(t('rememberDeleted'));
                    }}
                  >
                    {t('rememberDelete')}
                  </button>
                </p>
              )}
            </FormSection>

            <div className="rounded-card bg-white p-5 shadow-soft ring-1 ring-ink-100 sm:p-7">
              {!cart.canCheckout && (
                <p role="alert" className="mb-5 rounded-2xl bg-coral-50 p-4 text-[0.93rem] font-medium text-coral-500">
                  {t('error.unavailable')}{' '}
                  <Link href="/cart" className="underline">
                    {t('editCart')}
                  </Link>
                </p>
              )}
              <Button type="submit" size="lg" className="w-full" disabled={isSubmitting || !cart.canCheckout}>
                {isSubmitting ? (
                  <>
                    <LoaderCircle className="size-5 animate-spin" aria-hidden />
                    {t('submitting')}
                  </>
                ) : (
                  <>
                    {t('submit')}
                    <ArrowRight className="size-5" aria-hidden />
                  </>
                )}
              </Button>
              <p className="mt-4 flex gap-2.5 text-[0.82rem] leading-relaxed text-ink-400">
                <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
                <span>
                  {t.rich('consent', {
                    link: (chunks) => (
                      <Link href="/privacy" className="link-underline text-ink-600">
                        {chunks}
                      </Link>
                    ),
                  })}
                </span>
              </p>
            </div>
          </form>
        )}
      </div>

      <aside className="hidden lg:block">
        <div className="sticky top-28">
          <OrderSummary cart={cart} />
        </div>
      </aside>
    </div>
  );
}

function FormSection({ index, title, children }: { index: number; title: string; children: ReactNode }) {
  return (
    <fieldset className="rounded-card bg-white p-5 shadow-soft ring-1 ring-ink-100 sm:p-7">
      <legend className="float-left mb-6 flex w-full items-center gap-3">
        <span className="grid size-8 place-items-center rounded-full bg-sea-50 font-display text-sm font-semibold text-sea-700 ring-1 ring-sea-100">
          {index}
        </span>
        <span className="text-lg font-semibold text-ink-950">{title}</span>
      </legend>
      <div className="clear-both">{children}</div>
    </fieldset>
  );
}

function SummaryItems({ cart }: { cart: CartSummary }) {
  const locale = useLocale() as Locale;
  return (
    <ul className="space-y-3">
      {cart.items.map(({ product, qty, lineTotal }) => (
        <li key={product.id} className="flex items-center gap-3">
          <ProductStage tone={product.tone} wave={false} className="h-16 w-14 shrink-0 rounded-xl">
            <div className="absolute inset-x-2 top-2 bottom-1.5">
              <ProductVisual product={product} animated={false} />
            </div>
          </ProductStage>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-ink-900">{productTitle(product, locale)}</p>
            <p className="text-sm text-ink-500">
              × {qty}
              {product.volume ? ` · ${formatVolume(product.volume * qty, locale)}` : ''}
            </p>
          </div>
          {lineTotal != null && <p className="font-semibold text-ink-900">{formatPrice(lineTotal, locale)}</p>}
        </li>
      ))}
    </ul>
  );
}

function OrderSummary({ cart }: { cart: CartSummary }) {
  const t = useTranslations('checkout');
  return (
    <CartTotals cart={cart}>
      <div className="mt-6 border-t border-ink-100 pt-5">
        <SummaryItems cart={cart} />
        <Link href="/cart" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-sea-700 hover:text-sea-800">
          <Pencil className="size-4" aria-hidden />
          {t('editCart')}
        </Link>
      </div>
    </CartTotals>
  );
}

/** На телефоне состав заказа сворачивается, чтобы форма была сразу под рукой. */
function MobileSummary({ cart }: { cart: CartSummary }) {
  const t = useTranslations('checkout');
  const tCart = useTranslations('cart');
  const locale = useLocale() as Locale;
  return (
    <details className="faq-item group mb-5 rounded-card bg-white shadow-soft ring-1 ring-ink-100 lg:hidden">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5">
        <span>
          <span className="block font-semibold text-ink-950">{t('summaryToggle')}</span>
          <span className="block text-sm text-ink-500">
            {tCart('barSummary', { units: cart.units, liters: formatVolume(cart.liters, locale) })}
            {cart.total != null && ` · ${formatPrice(cart.total, locale)}`}
          </span>
        </span>
        <ChevronDown className="size-5 text-ink-400 transition-transform duration-300 group-open:rotate-180" aria-hidden />
      </summary>
      <div className="px-5 pb-5">
        <SummaryItems cart={cart} />
        <Link href="/cart" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-sea-700">
          <Pencil className="size-4" aria-hidden />
          {t('editCart')}
        </Link>
      </div>
    </details>
  );
}
