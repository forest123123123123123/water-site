import type { Locale } from './locale';

// До двух знаков после запятой: объёмы бывают дробными (1,5 л), цены в сумах — целые.
const numberFormat = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 });

const CURRENCY: Record<Locale, string> = { ru: 'сум', uz: 'soʻm' };
const LITER: Record<Locale, string> = { ru: 'л', uz: 'l' };

/** 125000 → «125 000» (неразрывные пробелы между разрядами). */
export function formatNumber(value: number): string {
  return numberFormat.format(value);
}

/** 125000 → «125 000 сум» / «125 000 soʻm». */
export function formatPrice(amount: number, locale: Locale): string {
  return `${formatNumber(amount)} ${CURRENCY[locale]}`;
}

/** 20 → «20 л» / «20 l». */
export function formatVolume(liters: number, locale: Locale): string {
  return `${formatNumber(liters)} ${LITER[locale]}`;
}

export function literLabel(locale: Locale): string {
  return LITER[locale];
}

export function digitsOnly(value: string): string {
  return value.replace(/\D+/g, '');
}

/**
 * Приводит узбекский номер к виду +998XXXXXXXXX.
 * Понимает «90 123 45 67», «+998 (90) 123-45-67», «998901234567».
 * Возвращает null, если это не узбекский номер.
 */
export function normalizeUzPhone(value: string): string | null {
  const digits = digitsOnly(value);
  if (digits.length === 12 && digits.startsWith('998')) return `+${digits}`;
  if (digits.length === 9) return `+998${digits}`;
  return null;
}

/** 9 национальных цифр → «90 123-45-67» (по мере ввода — частично). */
export function formatUzNational(nationalDigits: string): string {
  const d = nationalDigits.slice(0, 9);
  const parts = [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)];
  let out = parts[0];
  if (parts[1]) out += ` ${parts[1]}`;
  if (parts[2]) out += `-${parts[2]}`;
  if (parts[3]) out += `-${parts[3]}`;
  return out;
}

/** Любой номер из настроек → красивый вид для показа. */
export function formatPhoneForDisplay(value: string): string {
  const normalized = normalizeUzPhone(value);
  if (!normalized) return value.trim();
  return `+998 ${formatUzNational(normalized.slice(4))}`;
}

/** Ссылка для звонка: tel:+998901234567 */
export function phoneHref(value: string): string {
  const normalized = normalizeUzPhone(value);
  if (normalized) return `tel:${normalized}`;
  const digits = digitsOnly(value);
  return `tel:${value.trim().startsWith('+') ? '+' : ''}${digits}`;
}
