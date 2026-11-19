import 'server-only';
import type { OrderSnapshot } from './snapshot';

/**
 * Куда сервер пересылает заказы (режим orders.channel = 'api').
 * Каналы включаются переменными окружения, поэтому ключи не попадают в браузер:
 *
 *  Telegram-бот:  TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID (можно несколько через запятую)
 *  Webhook/CRM:   ORDER_WEBHOOK_URL (только https), ORDER_WEBHOOK_SECRET (необязательно)
 *
 * Каждый чат Telegram и webhook — отдельный адресат со своим статусом доставки:
 * при повторной обработке заказ досылается только тем, кто его ещё не получил.
 * Новый канал (e-mail, конкретная CRM) добавляется функцией по образцу ниже в configuredTargets().
 */

export type Delivery = { order: OrderSnapshot; text: string; idempotencyKey: string };

export type Target = {
  /** Стабильный идентификатор адресата, без секретов: 'telegram:-1001', 'webhook'. */
  id: string;
  /** Бросает ошибку, если адресат не подтвердил получение. */
  send: (delivery: Delivery) => Promise<void>;
};

const TIMEOUT_MS = 10_000;

function telegramTargets(): Target[] {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim() ?? '';
  const chatIds = (process.env.TELEGRAM_CHAT_ID ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
  if (!token) return [];

  return chatIds.map((chatId) => ({
    id: `telegram:${chatId}`,
    send: async ({ text }) => {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!res.ok) throw new Error(`Telegram ${res.status}: ${await res.text().catch(() => '')}`);
    },
  }));
}

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

/**
 * Адрес webhook. Заказ содержит имя, телефон и адрес покупателя, поэтому
 * принимается только https (http — лишь для локальной разработки на localhost).
 * Логин и пароль в самом адресе не допускаются: для этого есть ORDER_WEBHOOK_SECRET.
 */
export function parseWebhookUrl(raw: string): { url: URL } | { error: string } {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { error: 'это не адрес' };
  }
  if (url.protocol === 'http:' && !LOCAL_HOSTS.has(url.hostname)) {
    return { error: 'нужен https:// — по http данные покупателей и секрет передаются открыто' };
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return { error: 'нужен https://' };
  if (url.username || url.password) return { error: 'уберите логин и пароль из адреса и задайте ORDER_WEBHOOK_SECRET' };
  return { url };
}

let reportedWebhookError = '';

function webhookTargets(): Target[] {
  const raw = process.env.ORDER_WEBHOOK_URL?.trim();
  if (!raw) return [];
  const parsed = parseWebhookUrl(raw);
  if ('error' in parsed) {
    if (reportedWebhookError !== parsed.error) {
      reportedWebhookError = parsed.error;
      console.error(`[orders] ORDER_WEBHOOK_URL отклонён: ${parsed.error}. Webhook отключён.`);
    }
    return [];
  }
  const secret = process.env.ORDER_WEBHOOK_SECRET?.trim();

  return [
    {
      id: 'webhook',
      send: async ({ order, text, idempotencyKey }) => {
        const res = await fetch(parsed.url, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            // CRM может отбрасывать повторы по этому ключу: он одинаков у всех попыток одного заказа.
            'idempotency-key': idempotencyKey,
            ...(secret ? { authorization: `Bearer ${secret}` } : {}),
          },
          body: JSON.stringify({ event: 'order.created', idempotencyKey, order, text }),
          // Редирект мог бы увести заказ и секрет на другой адрес.
          redirect: 'error',
          signal: AbortSignal.timeout(TIMEOUT_MS),
        });
        if (!res.ok) throw new Error(`Webhook ${res.status}`);
      },
    },
  ];
}

export function configuredTargets(): Target[] {
  return [...telegramTargets(), ...webhookTargets()];
}

export function hasConfiguredChannel(): boolean {
  return configuredTargets().length > 0;
}
