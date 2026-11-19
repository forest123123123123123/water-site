import type { CheckoutFormValues } from './schema';

/**
 * Контактные данные покупателя на ЕГО устройстве (localStorage), если он
 * отметил «Запомнить мои данные». На сервер они попадают только вместе с заказом.
 * Комментарий не запоминается — он относится к конкретному заказу.
 */
const KEY = 'water-shop:checkout';
const FIELDS = ['name', 'phone', 'district', 'address', 'landmark'] as const;

export type RememberedDetails = Partial<Pick<CheckoutFormValues, (typeof FIELDS)[number]>>;

export function loadDetails(): RememberedDetails | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Record<string, unknown>;
    const result: RememberedDetails = {};
    for (const field of FIELDS) {
      if (typeof data[field] === 'string') result[field] = (data[field] as string).slice(0, 300);
    }
    if (result.phone && !/^\d{0,9}$/.test(result.phone)) delete result.phone;
    return result;
  } catch {
    return null;
  }
}

export function saveDetails(values: Partial<CheckoutFormValues>) {
  try {
    const data: Record<string, string> = {};
    for (const field of FIELDS) data[field] = String(values[field] ?? '');
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // Хранилище недоступно (приватный режим) — просто не запоминаем.
  }
}

export function clearDetails() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Хранилище недоступно — удалять нечего.
  }
}
