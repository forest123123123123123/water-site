import { siteConfig } from '@config/site';
import { getProductById } from '../catalog';
import type { Locale } from '../locale';
import { getOrderMode } from '../site';
import { messengerHref } from '../social';
import { attemptKey, finishAttempt } from './attempt';
import type { CustomerData } from './schema';
import { buildOrderSnapshot, formatOrderText } from './snapshot';

export type SubmitErrorCode =
  | 'not_configured'
  | 'delivery_failed'
  | 'network'
  | 'validation'
  | 'unavailable'
  | 'changed'
  | 'empty'
  | 'rate_limited'
  | 'server';

/** Результат оформления. 'sent' возможен, только когда сервер подтвердил доставку заказа хотя бы одному адресату. */
export type SubmitOutcome =
  | { kind: 'sent'; orderId: string }
  | { kind: 'messenger'; channel: 'whatsapp' | 'telegram'; href: string; text: string }
  | { kind: 'error'; code: SubmitErrorCode; text: string | null };

/** Сколько ждать ответа сервера. Дольше — результат неизвестен, и повтор безопасен благодаря ключу операции. */
export const REQUEST_TIMEOUT_MS = 30_000;

const SERVER_CODES: SubmitErrorCode[] = [
  'not_configured',
  'delivery_failed',
  'validation',
  'unavailable',
  'changed',
  'empty',
  'rate_limited',
];

export async function submitOrder(params: {
  lines: { id: string; qty: number }[];
  customer: CustomerData;
  locale: Locale;
  honeypot?: string;
}): Promise<SubmitOutcome> {
  const { lines, customer, locale } = params;
  const mode = getOrderMode();
  const operatorLocale = siteConfig.orders.operatorLocale;

  const built = buildOrderSnapshot({ lines, customer, customerLocale: locale, operatorLocale });
  if (!built.ok) return { kind: 'error', code: built.error, text: null };

  const text = formatOrderText(built.order, operatorLocale);

  if (mode === 'whatsapp' || mode === 'telegram') {
    const href = messengerHref(mode, text);
    return href
      ? { kind: 'messenger', channel: mode, href, text }
      : { kind: 'error', code: 'not_configured', text };
  }

  if (mode !== 'api') return { kind: 'error', code: 'not_configured', text };

  // Цена, которую видит покупатель: если на сервере она другая, заказ не будет создан молча.
  const items = lines.map(({ id, qty }) => ({ id, qty, price: getProductById(id)?.price ?? null }));
  const content = { items, customer, locale };
  const idempotencyKey = attemptKey(content);

  let res: Response;
  try {
    res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...content, idempotencyKey, website: params.honeypot ?? '' }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    // Ответа нет: заказ мог дойти. Ключ сохраняется, чтобы повтор не создал второй заказ.
    return { kind: 'error', code: 'network', text };
  }

  const data = (await res.json().catch(() => null)) as
    | { ok: true; orderId: string }
    | { ok: false; error: string }
    | null;

  if (res.ok && data?.ok) {
    finishAttempt();
    return { kind: 'sent', orderId: data.orderId };
  }

  const code = data && !data.ok ? data.error : 'server';
  // Ключ уже использован для другого содержимого — следующая попытка получит новый.
  if (code === 'conflict') finishAttempt();
  return { kind: 'error', code: (SERVER_CODES as string[]).includes(code) ? (code as SubmitErrorCode) : 'server', text };
}
