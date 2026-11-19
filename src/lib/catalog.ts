import { products } from '@config/products';
import type { Product } from '@config/types';
import { formatNumber, formatVolume, literLabel } from './format';
import { tr, type Locale } from './locale';

export type { Product };

/** Все товары, которые показываются на сайте (visible !== false), в порядке из настроек. */
export const catalog: Product[] = products.filter((p) => p.visible !== false);

const byId = new Map(catalog.map((p) => [p.id, p]));
const bySlug = new Map(catalog.map((p) => [p.slug, p]));

export function getProductById(id: string): Product | undefined {
  return byId.get(id);
}

export function getProductBySlug(slug: string): Product | undefined {
  return bySlug.get(slug);
}

/** «Питьевая вода 20 л» — название с объёмом. */
export function productTitle(product: Product, locale: Locale): string {
  const name = tr(product.name, locale);
  return product.volume ? `${name} ${formatVolume(product.volume, locale)}` : name;
}

export function isPurchasable(product: Product): boolean {
  return product.inStock && product.visible !== false;
}

/** Цена за литр, если известны и цена, и объём. */
export function pricePerLiter(product: Product): number | null {
  if (product.price == null || !product.volume) return null;
  return Math.round(product.price / product.volume);
}

/**
 * Объёмы из каталога для текстов и SEO: «5, 10 и 20 л» (или «5, 10 или 20 л»).
 * Тексты меняются вместе с ассортиментом, а не остаются со старыми цифрами.
 */
export function volumeList(locale: Locale, type: 'conjunction' | 'disjunction' = 'conjunction'): string {
  const volumes = [...new Set(catalog.flatMap((p) => (p.volume ? [p.volume] : [])))].sort((a, b) => a - b);
  const list = new Intl.ListFormat(locale, { type }).format(volumes.map(formatNumber));
  return `${list}\u00a0${literLabel(locale)}`;
}

/** Самый большой объём в каталоге — для пропорций иллюстраций. */
export const maxVolume = Math.max(1, ...catalog.map((p) => p.volume ?? 0));

export function otherProducts(product: Product): Product[] {
  return catalog.filter((p) => p.id !== product.id);
}

/** Проверка настроек при запуске: повторяющиеся id или slug сломали бы корзину и адреса страниц. */
function assertUnique(field: 'id' | 'slug') {
  const seen = new Set<string>();
  for (const p of products) {
    const value = p[field];
    if (!/^[a-z0-9-]+$/.test(value)) {
      throw new Error(`config/products.ts: ${field} «${value}» должен содержать только латиницу, цифры и дефис.`);
    }
    if (seen.has(value)) {
      throw new Error(`config/products.ts: ${field} «${value}» повторяется — у каждого товара он должен быть своим.`);
    }
    seen.add(value);
  }
}
assertUnique('id');
assertUnique('slug');
