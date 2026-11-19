import 'server-only';
import { createHash } from 'node:crypto';
import { configuredTargets, type Target } from './channels';
import type { OrderSnapshot } from './snapshot';

/**
 * Приём заказа с защитой от повторов.
 *
 * Браузер присылает ключ операции (idempotencyKey), одинаковый для всех попыток
 * отправить один и тот же заказ: повторное нажатие, повтор после таймаута,
 * два параллельных запроса. По ключу сервер хранит запись с номером заказа и
 * статусом доставки каждому адресату. Повтор с тем же ключом не создаёт новый
 * заказ: он получает тот же номер, а заявка досылается только тем адресатам,
 * которые её ещё не приняли.
 *
 * Ограничения (см. README, «Надёжность приёма заказов»):
 *  — записи хранятся в памяти процесса. После перезапуска сервера или на другом
 *    экземпляре (serverless, несколько реплик) запись не найдётся, и повтор будет
 *    доставлен заново — с тем же номером заказа и тем же Idempotency-Key, по которому
 *    CRM может отбросить дубликат. Telegram такой защиты не имеет.
 *  — если адресат получил заявку, но не успел ответить (таймаут), сервер считает
 *    доставку неудачной и повторит её; для Telegram это может дать повторное сообщение
 *    с тем же номером заказа.
 * Гарантия «ровно один раз» без общего постоянного хранилища невозможна.
 */

type TargetStatus = 'sent' | 'failed';

type OrderRecord = {
  fingerprint: string;
  orderId: string;
  /** Заказ и текст нужны, пока есть недоставленные адресаты; потом удаляются из памяти. */
  payload: { order: OrderSnapshot; text: string } | null;
  targets: Record<string, TargetStatus>;
  expiresAt: number;
};

export type BuildOutcome =
  | { ok: true; order: OrderSnapshot; text: string }
  | { ok: false; error: 'empty' | 'unavailable' | 'changed' | 'validation'; productIds?: string[] };

export type IntakeResult =
  | { kind: 'accepted'; orderId: string; pending: string[] }
  | { kind: 'delivery_failed'; orderId: string }
  | { kind: 'rejected'; error: 'empty' | 'unavailable' | 'changed' | 'validation'; productIds: string[] }
  | { kind: 'conflict' };

const TTL_MS = 24 * 60 * 60 * 1000;
const MAX_RECORDS = 2000;
/** Паузы между фоновыми повторами доставки адресатам, не принявшим заявку. */
export const RETRY_DELAYS_MS = [3_000, 15_000];

const records = new Map<string, OrderRecord>();
const locks = new Map<string, Promise<void>>();

/** Отпечаток содержимого запроса: один ключ нельзя использовать для другого заказа. */
export function fingerprintOf(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

const ID_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/**
 * Номер заказа вида 261118-K7Q2MX: дата по Ташкенту + 6 символов, вычисленных из ключа.
 * Повтор того же заказа после перезапуска сервера получит тот же суффикс.
 */
export function orderIdFor(key: string, now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Tashkent',
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  const hash = createHash('sha256').update(key).digest();
  const suffix = Array.from(hash.subarray(0, 6), (b) => ID_ALPHABET[b % ID_ALPHABET.length]).join('');
  return `${get('year')}${get('month')}${get('day')}-${suffix}`;
}

/** Последовательная обработка запросов с одним ключом: параллельные дубли ждут первый. */
async function withLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const previous = locks.get(key) ?? Promise.resolve();
  let release!: () => void;
  const gate = new Promise<void>((resolve) => (release = resolve));
  const current = previous.then(() => gate);
  locks.set(key, current);
  await previous;
  try {
    return await fn();
  } finally {
    release();
    if (locks.get(key) === current) locks.delete(key);
  }
}

function prune(now: number) {
  for (const [key, record] of records) {
    if (record.expiresAt <= now || records.size > MAX_RECORDS) records.delete(key);
    else break; // Map хранит порядок добавления: дальше записи свежее.
  }
}

function pendingTargets(record: OrderRecord, targets: Target[]): Target[] {
  return targets.filter((t) => record.targets[t.id] !== 'sent');
}

async function deliver(record: OrderRecord, key: string, targets: Target[]) {
  if (!record.payload) return;
  const { order, text } = record.payload;
  await Promise.all(
    pendingTargets(record, targets).map(async (target) => {
      try {
        await target.send({ order, text, idempotencyKey: key });
        record.targets[target.id] = 'sent';
      } catch (error) {
        record.targets[target.id] = 'failed';
        console.error(`[orders] Заказ ${record.orderId}: ${target.id} не принял заявку —`, String(error));
      }
    }),
  );
  if (pendingTargets(record, targets).length === 0) record.payload = null;
}

function summarize(record: OrderRecord, targets: Target[]): IntakeResult {
  const sent = Object.values(record.targets).some((s) => s === 'sent');
  if (!sent) return { kind: 'delivery_failed', orderId: record.orderId };
  return { kind: 'accepted', orderId: record.orderId, pending: pendingTargets(record, targets).map((t) => t.id) };
}

/**
 * Принимает заказ. build вызывается только для нового ключа — повтор уже принятого
 * заказа не проверяется заново по каталогу и доставляется в исходном виде.
 */
export async function processOrder(params: {
  key: string;
  fingerprint: string;
  build: (orderId: string) => BuildOutcome;
  now?: number;
}): Promise<IntakeResult> {
  const { key, fingerprint } = params;
  return withLock(key, async () => {
    const now = params.now ?? Date.now();
    prune(now);
    const targets = configuredTargets();
    let record = records.get(key);

    if (record && record.fingerprint !== fingerprint) return { kind: 'conflict' };

    if (!record) {
      const orderId = orderIdFor(key, new Date(now));
      const built = params.build(orderId);
      if (!built.ok) return { kind: 'rejected', error: built.error, productIds: built.productIds ?? [] };
      record = {
        fingerprint,
        orderId,
        payload: { order: built.order, text: built.text },
        targets: {},
        expiresAt: now + TTL_MS,
      };
      records.set(key, record);
    }

    await deliver(record, key, targets);
    return summarize(record, targets);
  });
}

/**
 * Досылает заявку адресатам, которые её не приняли (вызывается в фоне после ответа покупателю).
 * Работает, пока жив процесс сервера; итог пишется в лог.
 */
export async function retryPendingTargets(key: string, delays: number[] = RETRY_DELAYS_MS): Promise<void> {
  for (const [attempt, delay] of delays.entries()) {
    await new Promise((resolve) => setTimeout(resolve, delay));
    const left = await withLock(key, async () => {
      const record = records.get(key);
      if (!record) return [];
      const targets = configuredTargets();
      await deliver(record, key, targets);
      return pendingTargets(record, targets).map((t) => t.id);
    });
    if (left.length === 0) return;
    if (attempt === delays.length - 1) {
      const orderId = records.get(key)?.orderId;
      console.error(`[orders] Заказ ${orderId}: после повторов не доставлен в ${left.join(', ')}. Заявка есть у остальных адресатов.`);
    }
  }
}
