import { getProductById, isPurchasable, type Product } from '../catalog';

export type CartItemView = {
  product: Product;
  qty: number;
  /** Сумма по строке; null — если у товара нет цены. */
  lineTotal: number | null;
  available: boolean;
};

export type CartSummary = {
  items: CartItemView[];
  positions: number;
  units: number;
  liters: number;
  /** Итоговая сумма — только если у ВСЕХ доступных товаров указана цена. Иначе null. */
  total: number | null;
  hasUnpriced: boolean;
  hasUnavailable: boolean;
  /** Можно ли оформить заказ (есть хотя бы одна доступная позиция и нет недоступных). */
  canCheckout: boolean;
};

/** Общая логика подсчёта корзины — используется и в браузере, и на сервере при приёме заказа. */
export function computeCart(lines: { id: string; qty: number }[]): CartSummary {
  const items: CartItemView[] = [];
  for (const line of lines) {
    const product = getProductById(line.id);
    if (!product) continue;
    items.push({
      product,
      qty: line.qty,
      lineTotal: product.price != null ? product.price * line.qty : null,
      available: isPurchasable(product),
    });
  }

  const availableItems = items.filter((i) => i.available);
  const hasUnpriced = availableItems.some((i) => i.lineTotal == null);
  const total = availableItems.length > 0 && !hasUnpriced
    ? availableItems.reduce((sum, i) => sum + (i.lineTotal ?? 0), 0)
    : null;

  return {
    items,
    positions: items.length,
    units: items.reduce((sum, i) => sum + i.qty, 0),
    liters: items.reduce((sum, i) => sum + (i.product.volume ?? 0) * i.qty, 0),
    total,
    hasUnpriced,
    hasUnavailable: items.some((i) => !i.available),
    canCheckout: availableItems.length > 0 && items.every((i) => i.available),
  };
}
