/**
 * Ключ операции оформления (idempotencyKey) в браузере.
 *
 * Пока покупатель отправляет тот же заказ (тот же состав и те же данные) — повторное
 * нажатие, повтор после ошибки или таймаута, перезагрузка вкладки, — используется один
 * и тот же ключ, и сервер не создаёт второй заказ. Изменился заказ — новый ключ.
 * Ключ хранится в sessionStorage (только эта вкладка, до её закрытия) вместе с хэшем
 * содержимого заказа, без самих персональных данных. Если хранилище недоступно —
 * в памяти страницы.
 */
const STORAGE_KEY = 'water-shop:order-attempt';

type Attempt = { key: string; fingerprint: string };
let memory: Attempt | null = null;

function read(): Attempt | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return memory;
    const data = JSON.parse(raw) as Partial<Attempt>;
    return typeof data.key === 'string' && typeof data.fingerprint === 'string'
      ? { key: data.key, fingerprint: data.fingerprint }
      : memory;
  } catch {
    return memory;
  }
}

function write(attempt: Attempt | null) {
  memory = attempt;
  try {
    if (attempt) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(attempt));
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Хранилище недоступно — ключ живёт в памяти до перезагрузки страницы.
  }
}

function randomKey(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Быстрый 53-битный хэш строки (cyrb53) — только для сравнения, не для защиты. */
export function hashString(input: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

/** Ключ для заказа с данным содержимым: прежний, если содержимое не менялось. */
export function attemptKey(content: unknown): string {
  const fingerprint = hashString(JSON.stringify(content));
  const current = read();
  if (current && current.fingerprint === fingerprint) return current.key;
  const key = randomKey();
  write({ key, fingerprint });
  return key;
}

/** Заказ принят (или ключ стал непригоден) — следующий заказ получит новый ключ. */
export function finishAttempt() {
  write(null);
}
