'use client';

import { ArrowLeft, Check, CircleAlert, Copy, Phone, RotateCcw, Send } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Button, ButtonAnchor, ButtonLink } from '@/components/ui/button';
import { SocialIcon } from '@/components/ui/social-icon';
import { formatPhoneForDisplay, phoneHref } from '@/lib/format';
import type { SubmitErrorCode, SubmitOutcome } from '@/lib/order/submit';
import { brandName, primaryPhone } from '@/lib/site';
import { SOCIAL_NAMES, messengerHref } from '@/lib/social';
import { cn } from '@/lib/utils';

function CopyButton({ text }: { text: string }) {
  const t = useTranslations('common');
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <Button
      variant="outline"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          clearTimeout(timer.current);
          timer.current = setTimeout(() => setCopied(false), 2200);
        } catch {
          // Буфер обмена недоступен — текст заказа всё равно виден на экране.
        }
      }}
    >
      {copied ? <Check className="size-4 text-mint-500" aria-hidden /> : <Copy className="size-4" aria-hidden />}
      {copied ? t('copied') : t('copy')}
    </Button>
  );
}

/** Превью заказа в виде сообщения мессенджера — так его увидит менеджер. */
function MessagePreview({ text, label }: { text: string; label: string }) {
  return (
    <figure className="mt-7 overflow-hidden rounded-[1.4rem] bg-[#e7eff5] p-3 ring-1 ring-ink-100 sm:p-4">
      <figcaption className="flex items-center gap-2 px-1 pb-3 text-xs font-semibold tracking-wide text-ink-500 uppercase">
        <Send className="size-3.5" aria-hidden />
        {label}
      </figcaption>
      <div className="max-w-full rounded-2xl rounded-tl-md bg-white px-4 py-3.5 shadow-[0_1px_1px_rgb(0_0_0_/_0.06)]">
        <p className="text-sm font-semibold text-sea-700">{brandName}</p>
        <pre className="mt-1.5 font-sans text-[0.9rem] leading-relaxed whitespace-pre-wrap text-ink-900">{text}</pre>
      </div>
    </figure>
  );
}

const PANEL_TONES = {
  success: 'bg-mint-50 text-[#0b7a5b] ring-mint-500/30',
  info: 'bg-sea-50 text-sea-700 ring-sea-200',
  error: 'bg-coral-50 text-coral-500 ring-coral-500/25',
} as const;

export function Panel({
  tone,
  icon,
  title,
  children,
}: {
  tone: keyof typeof PANEL_TONES;
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="animate-rise-in rounded-panel bg-white p-6 shadow-soft ring-1 ring-ink-100 sm:p-10" role="status" aria-live="polite">
      <span className={cn('grid size-14 place-items-center rounded-2xl ring-1', PANEL_TONES[tone])}>{icon}</span>
      <h2 className="display-md mt-6 text-ink-950">{title}</h2>
      {children}
    </div>
  );
}

/** Кнопки для заказа напрямую: телефон и мессенджеры, если они указаны в настройках. */
export function DirectContacts({ title, orderText }: { title: string; orderText?: string | null }) {
  const whatsapp = messengerHref('whatsapp', orderText);
  const telegram = messengerHref('telegram', orderText);
  if (!primaryPhone && !whatsapp && !telegram) return null;

  return (
    <div className="mt-8 border-t border-ink-100 pt-6">
      <p className="font-semibold text-ink-800">{title}</p>
      <div className="mt-4 flex flex-wrap gap-3">
        {primaryPhone && (
          <ButtonAnchor href={phoneHref(primaryPhone)} variant="outline">
            <Phone className="size-4" aria-hidden />
            {formatPhoneForDisplay(primaryPhone)}
          </ButtonAnchor>
        )}
        {whatsapp && (
          <ButtonAnchor href={whatsapp} target="_blank" rel="noopener noreferrer" variant="outline">
            <SocialIcon network="whatsapp" className="size-4" />
            {SOCIAL_NAMES.whatsapp}
          </ButtonAnchor>
        )}
        {telegram && (
          <ButtonAnchor href={telegram} target="_blank" rel="noopener noreferrer" variant="outline">
            <SocialIcon network="telegram" className="size-4" />
            {SOCIAL_NAMES.telegram}
          </ButtonAnchor>
        )}
      </div>
    </div>
  );
}

/** Ошибки состава заказа: повтор не поможет, нужно проверить корзину. */
const CART_ERRORS = new Set<SubmitErrorCode>(['empty', 'unavailable', 'changed']);

/** Итог оформления. «Заказ принят» показывается, только если сервер это подтвердил. */
export function OrderResult({
  outcome,
  phoneDisplay,
  onBack,
  onRetry,
  onMessengerDone,
}: {
  outcome: SubmitOutcome;
  phoneDisplay: string;
  onBack: () => void;
  onRetry: () => void;
  onMessengerDone: () => void;
}) {
  const t = useTranslations('checkout');

  if (outcome.kind === 'sent') {
    return (
      <Panel tone="success" icon={<Check className="size-7" aria-hidden />} title={t('sent.title', { id: outcome.orderId })}>
        <p className="lead mt-3">{t('sent.text', { phone: phoneDisplay })}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/" variant="dark">
            {t('sent.home')}
          </ButtonLink>
          <ButtonLink href="/catalog" variant="outline">
            {t('sent.catalog')}
          </ButtonLink>
        </div>
      </Panel>
    );
  }

  if (outcome.kind === 'messenger') {
    const name = SOCIAL_NAMES[outcome.channel];
    return (
      <Panel tone="info" icon={<SocialIcon network={outcome.channel} className="size-7" />} title={t('messenger.title')}>
        <p className="lead mt-3">{t('messenger.text', { channel: name })}</p>
        <div className="mt-7 flex flex-wrap gap-3">
          <ButtonAnchor href={outcome.href} target="_blank" rel="noopener noreferrer" size="lg">
            <SocialIcon network={outcome.channel} className="size-5" />
            {t('messenger.open', { channel: name })}
          </ButtonAnchor>
          <CopyButton text={outcome.text} />
        </div>
        <p className="mt-4 text-sm text-ink-500">{t('messenger.hint')}</p>
        <MessagePreview text={outcome.text} label={name} />
        <div className="mt-6 flex flex-wrap gap-3">
          <Button variant="dark" onClick={onMessengerDone}>
            <Check className="size-4" aria-hidden />
            {t('messenger.done')}
          </Button>
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="size-4" aria-hidden />
            {t('backToForm')}
          </Button>
        </div>
      </Panel>
    );
  }

  return (
    <Panel tone="error" icon={<CircleAlert className="size-7" aria-hidden />} title={t('error.title')}>
      <p className="lead mt-3">{t(`error.${outcome.code}`)}</p>
      <div className="mt-7 flex flex-wrap gap-3">
        {CART_ERRORS.has(outcome.code) ? (
          <ButtonLink href="/cart" variant="dark">
            {t('error.toCart')}
          </ButtonLink>
        ) : (
          outcome.code !== 'validation' && (
            <Button variant="dark" onClick={onRetry}>
              <RotateCcw className="size-4" aria-hidden />
              {t('error.retry')}
            </Button>
          )
        )}
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="size-4" aria-hidden />
          {t('backToForm')}
        </Button>
      </div>
      <DirectContacts title={t('directOrder')} orderText={outcome.text} />
    </Panel>
  );
}
