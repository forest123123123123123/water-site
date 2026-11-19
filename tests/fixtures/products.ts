import type { Product } from '@config/types';

/**
 * Тестовый ассортимент вместо config/products.ts: тесты бизнес-логики не должны
 * ломаться, когда владелец сайта меняет цены, наличие или список товаров.
 * Тесты, которым нужны цены или другое наличие, меняют эти объекты сами и возвращают обратно.
 */
function product(id: string, volume: number | null, extra: Partial<Product> = {}): Product {
  return {
    id,
    slug: id,
    name: { ru: 'Питьевая вода', uz: 'Ichimlik suvi' },
    volume,
    price: null,
    inStock: true,
    visible: true,
    image: null,
    illustration: 'jug',
    tone: '#1B8FD2',
    shortDescription: { ru: '', uz: '' },
    description: { ru: '', uz: '' },
    note: null,
    specs: [],
    ...extra,
  };
}

export const products: Product[] = [
  product('water-5l', 5),
  product('water-10l', 10),
  product('water-20l', 20),
  // Скрытый товар: на сайте его нет, заказать его нельзя.
  product('cooler', null, { name: { ru: 'Кулер', uz: 'Kuler' }, visible: false }),
];
