import { deliveryConfig } from '@config/delivery';
import { getProductById, productTitle } from '../catalog';
import { computeCart } from '../cart/compute';
import { formatNumber, formatPhoneForDisplay, formatPrice, formatVolume } from '../format';
import { MAX_QTY } from '../limits';
import { tr, type Locale } from '../locale';
import type { CustomerData } from './schema';

/**
 * Заказ в «замороженном» виде: названия и цены взяты из каталога на момент
 * оформления. Одна и та же функция строит заказ в браузере (для мессенджеров)
 * и на сервере, где цены из запроса не принимаются.
 */
export type OrderSnapshot = {
  id: string | null;
  createdAt: string;
  customerLocale: Locale;
  items: {
    id: string;
    title: string;
    qty: number;
    price: number | null;
    lineTotal: number | null;
  }[];
  units: number;
  liters: number;
  total: number | null;
  hasUnpriced: boolean;
  customer: {
    name: string;
    phone: string;
    district: string;
    address: string;
    landmark: string;
    comment: string;
  };
};

export type BuildError = 'empty' | 'unavailable' | 'changed' | 'validation';

export type BuildResult =
  | { ok: true; order: OrderSnapshot }
  | { ok: false; error: BuildError; productIds?: string[] };

/**
 * price — цена, которую видел покупатель (её присылает браузер). Если она передана
 * и не совпадает с каталогом, заказ отклоняется: покупатель должен увидеть новую цену.
 * Состав заказа никогда не меняется молча: неизвестный, скрытый или закончившийся товар,
 * повтор позиции или неверное количество — это отказ, а не удаление строки.
 */
export function buildOrderSnapshot(params: {
  lines: { id: string; qty: number; price?: number | null }[];
  customer: CustomerData;
  customerLocale: Locale;
  operatorLocale: Locale;
  id?: string | null;
  now?: Date;
}): BuildResult {
  const { lines, customer, customerLocale, operatorLocale } = params;
  if (lines.length === 0) return { ok: false, error: 'empty' };

  const ids = new Set(lines.map((l) => l.id));
  const badQty = lines.some((l) => !Number.isInteger(l.qty) || l.qty < 1 || l.qty > MAX_QTY);
  if (ids.size !== lines.length || badQty) return { ok: false, error: 'validation' };

  const unknown = lines.filter((l) => !getProductById(l.id)).map((l) => l.id);
  if (unknown.length > 0) return { ok: false, error: 'unavailable', productIds: unknown };

  const cart = computeCart(lines);
  const unavailable = cart.items.filter((i) => !i.available).map((i) => i.product.id);
  if (unavailable.length > 0) return { ok: false, error: 'unavailable', productIds: unavailable };

  const changed = lines
    .filter((l) => l.price !== undefined && l.price !== getProductById(l.id)?.price)
    .map((l) => l.id);
  if (changed.length > 0) return { ok: false, error: 'changed', productIds: changed };

  const district = deliveryConfig.districts.find((d) => d.id === customer.district);

  return {
    ok: true,
    order: {
      id: params.id ?? null,
      createdAt: (params.now ?? new Date()).toISOString(),
      customerLocale,
      items: cart.items.map((i) => ({
        id: i.product.id,
        title: productTitle(i.product, operatorLocale),
        qty: i.qty,
        price: i.product.price,
        lineTotal: i.lineTotal,
      })),
      units: cart.units,
      liters: cart.liters,
      total: cart.total,
      hasUnpriced: cart.hasUnpriced,
      customer: {
        name: customer.name.trim(),
        phone: `+998${customer.phone}`,
        district: district ? tr(district.name, operatorLocale) : '',
        address: customer.address.trim(),
        landmark: customer.landmark.trim(),
        comment: customer.comment.trim(),
      },
    },
  };
}

const TEXT = {
  ru: {
    newOrder: 'Новый заказ',
    siteOrder: 'Новый заказ с сайта',
    pcs: 'шт.',
    noPrice: 'цена не указана',
    total: 'Итого',
    sum: 'Сумма',
    sumUnknown: 'не рассчитана, у части товаров нет цены',
    customer: 'Клиент',
    phone: 'Телефон',
    district: 'Район',
    address: 'Адрес',
    landmark: 'Ориентир',
    comment: 'Комментарий',
    language: 'Язык сайта',
    languages: { ru: 'русский', uz: 'узбекский' },
    time: 'Время',
  },
  uz: {
    newOrder: 'Yangi buyurtma',
    siteOrder: 'Saytdan yangi buyurtma',
    pcs: 'dona',
    noPrice: 'narx koʻrsatilmagan',
    total: 'Jami',
    sum: 'Summa',
    sumUnknown: 'hisoblanmadi, baʼzi mahsulotlarning narxi yoʻq',
    customer: 'Mijoz',
    phone: 'Telefon',
    district: 'Tuman',
    address: 'Manzil',
    landmark: 'Moʻljal',
    comment: 'Izoh',
    language: 'Sayt tili',
    languages: { ru: 'rus tili', uz: 'oʻzbek tili' },
    time: 'Vaqt',
  },
} as const;

const LINE = '────────────';

/** Текст заявки для менеджера: без разметки, чтобы одинаково читаться в Telegram, WhatsApp и CRM. */
export function formatOrderText(order: OrderSnapshot, locale: Locale): string {
  const t = TEXT[locale];
  const out: string[] = [];

  const heading = order.id ? `${t.newOrder} № ${order.id}` : t.siteOrder;
  out.push(`🧾 ${heading}`);
  out.push(LINE);
  for (const item of order.items) {
    const qty = `${item.qty} ${t.pcs}`;
    const price =
      item.price != null && item.lineTotal != null
        ? ` × ${formatPrice(item.price, locale)} = ${formatPrice(item.lineTotal, locale)}`
        : ` (${t.noPrice})`;
    out.push(`💧 ${item.title}: ${qty}${price}`);
  }
  out.push(LINE);
  out.push(`${t.total}: ${formatNumber(order.units)} ${t.pcs} · ${formatVolume(order.liters, locale)}`);
  out.push(`${t.sum}: ${order.total != null ? formatPrice(order.total, locale) : t.sumUnknown}`);
  out.push(LINE);
  out.push(`👤 ${t.customer}: ${order.customer.name}`);
  out.push(`📞 ${t.phone}: ${formatPhoneForDisplay(order.customer.phone)}`);
  if (order.customer.district) out.push(`🏙 ${t.district}: ${order.customer.district}`);
  out.push(`📍 ${t.address}: ${order.customer.address}`);
  if (order.customer.landmark) out.push(`🧭 ${t.landmark}: ${order.customer.landmark}`);
  if (order.customer.comment) out.push(`💬 ${t.comment}: ${order.customer.comment}`);
  out.push(LINE);
  out.push(`🌐 ${t.language}: ${t.languages[order.customerLocale]}`);
  out.push(`🕒 ${t.time}: ${formatTashkentTime(order.createdAt, locale)}`);

  return out.join('\n').replace(/ /g, ' ');
}

function formatTashkentTime(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === 'uz' ? 'uz-Latn-UZ' : 'ru-RU', {
    timeZone: 'Asia/Tashkent',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}
