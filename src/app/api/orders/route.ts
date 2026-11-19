import { after, NextResponse } from 'next/server';
import { siteConfig } from '@config/site';
import { hasConfiguredChannel } from '@/lib/order/channels';
import { fingerprintOf, processOrder, retryPendingTargets } from '@/lib/order/intake';
import { orderRequestSchema } from '@/lib/order/schema';
import { buildOrderSnapshot, formatOrderText } from '@/lib/order/snapshot';
import { clientAddress, createRateLimiter } from '@/lib/rate-limit';

/**
 * Приём заказов. Сервер не доверяет данным из браузера: заново проверяет поля,
 * берёт названия и цены из каталога, проверяет наличие и только потом
 * пересылает заказ адресатам (чаты Telegram, webhook CRM).
 *
 * Ответ: { ok: true, orderId } или { ok: false, error: '<код>' }.
 * Повтор с тем же idempotencyKey возвращает тот же номер и не создаёт новый заказ.
 */

const MAX_BODY_BYTES = 16 * 1024;
/** 10 запросов за 10 минут с одного адреса — с запасом для повторов при плохой связи. */
const limiter = createRateLimiter({ limit: 10, windowMs: 10 * 60 * 1000 });

const fail = (error: string, status: number, init?: { headers?: Record<string, string>; productIds?: string[] }) =>
  NextResponse.json(
    { ok: false, error, ...(init?.productIds ? { productIds: init.productIds } : {}) },
    { status, headers: init?.headers },
  );

export async function POST(request: Request) {
  if (siteConfig.orders.channel !== 'api') return fail('not_configured', 503);

  // Лимит проверяется до чтения тела и любых обращений к внешним сервисам.
  const limit = limiter.hit(clientAddress(request));
  if (!limit.ok) return fail('rate_limited', 429, { headers: { 'retry-after': String(limit.retryAfter) } });

  const body = await readBody(request, MAX_BODY_BYTES);
  if (body === null) return fail('validation', 413);

  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return fail('validation', 400);
  }

  const parsed = orderRequestSchema.safeParse(payload);
  if (!parsed.success || parsed.data.website) return fail('validation', 400);

  if (!hasConfiguredChannel()) {
    console.error('[orders] Не настроен ни один канал: задайте TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID или ORDER_WEBHOOK_URL.');
    return fail('not_configured', 503);
  }

  const { idempotencyKey, items, customer, locale } = parsed.data;
  const operatorLocale = siteConfig.orders.operatorLocale;

  const result = await processOrder({
    key: idempotencyKey,
    fingerprint: fingerprintOf({ items, customer, locale }),
    build: (orderId) => {
      const built = buildOrderSnapshot({ lines: items, customer, customerLocale: locale, operatorLocale, id: orderId });
      return built.ok ? { ok: true, order: built.order, text: formatOrderText(built.order, operatorLocale) } : built;
    },
  });

  switch (result.kind) {
    case 'rejected':
      return fail(result.error, result.error === 'validation' ? 400 : result.error === 'changed' ? 409 : 422, {
        productIds: result.productIds,
      });
    case 'conflict':
      return fail('conflict', 409);
    case 'delivery_failed':
      return fail('delivery_failed', 502);
    case 'accepted':
      // Заявка уже у части адресатов — покупателю это успех; остальным досылаем в фоне.
      if (result.pending.length > 0) after(() => retryPendingTargets(idempotencyKey));
      return NextResponse.json({ ok: true, orderId: result.orderId });
  }
}

/** Читает тело запроса, но не больше max байт: null — если тело больше. */
async function readBody(request: Request, max: number): Promise<string | null> {
  const declared = Number(request.headers.get('content-length'));
  if (declared > max) return null;
  if (!request.body) return '';

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > max) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  return new TextDecoder().decode(Buffer.concat(chunks));
}
