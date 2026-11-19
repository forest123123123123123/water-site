import { describe, expect, it } from 'vitest';
import { litersNeeded, recommendContainers } from '@/lib/calculator';
import { catalog, productTitle, volumeList } from '@/lib/catalog';
import { computeCart } from '@/lib/cart/compute';
import { sanitizeLines } from '@/lib/cart/store';
import { formatPhoneForDisplay, formatPrice, formatUzNational, formatVolume, normalizeUzPhone, phoneHref } from '@/lib/format';
import { tr } from '@/lib/locale';
import { resolveSocial } from '@/lib/social';

const VOLUMES = [
  { id: 'water-5l', volume: 5 },
  { id: 'water-10l', volume: 10 },
  { id: 'water-20l', volume: 20 },
];

describe('калькулятор запаса воды', () => {
  it('считает литры: люди × дни × 2 л', () => {
    expect(litersNeeded(3, 7)).toBe(42);
    expect(litersNeeded(1, 30)).toBe(60);
  });

  it('подбирает набор с минимальным излишком, затем с меньшим числом штук', () => {
    expect(recommendContainers(42, VOLUMES)).toEqual({
      items: [
        { id: 'water-20l', volume: 20, qty: 2 },
        { id: 'water-5l', volume: 5, qty: 1 },
      ],
      totalLiters: 45,
    });
    expect(recommendContainers(20, VOLUMES)?.items).toEqual([{ id: 'water-20l', volume: 20, qty: 1 }]);
    expect(recommendContainers(14, VOLUMES)?.totalLiters).toBe(15);
  });

  it('работает только с тем, что есть в наличии', () => {
    const only20 = recommendContainers(42, [{ id: 'water-20l', volume: 20 }]);
    expect(only20).toEqual({ items: [{ id: 'water-20l', volume: 20, qty: 3 }], totalLiters: 60 });
    expect(recommendContainers(10, [])).toBeNull();
  });
});

describe('корзина', () => {
  it('разные товары считаются отдельно: 2 × 20 л + 3 × 5 л', () => {
    const cart = computeCart([
      { id: 'water-20l', qty: 2 },
      { id: 'water-5l', qty: 3 },
    ]);
    expect(cart.positions).toBe(2);
    expect(cart.units).toBe(5);
    expect(cart.liters).toBe(55);
  });

  it('без цен итоговая сумма не выдумывается', () => {
    const cart = computeCart([{ id: 'water-20l', qty: 2 }]);
    expect(cart.total).toBeNull();
    expect(cart.hasUnpriced).toBe(true);
    expect(cart.canCheckout).toBe(true);
  });

  it('с ценами — сумма считается', () => {
    const p20 = catalog.find((p) => p.id === 'water-20l')!;
    const p5 = catalog.find((p) => p.id === 'water-5l')!;
    const saved = [p20.price, p5.price];
    p20.price = 25000;
    p5.price = 9000;
    try {
      const cart = computeCart([
        { id: 'water-20l', qty: 2 },
        { id: 'water-5l', qty: 3 },
      ]);
      expect(cart.total).toBe(2 * 25000 + 3 * 9000);
    } finally {
      [p20.price, p5.price] = saved;
    }
  });

  it('очищает испорченные данные из localStorage', () => {
    expect(
      sanitizeLines([
        { id: 'water-20l', qty: 2 },
        { id: 'water-20l', qty: 5 }, // дубликат
        { id: 'unknown', qty: 1 }, // товара нет в каталоге
        { id: 'water-5l', qty: 0 }, // неверное количество
        { id: 'water-10l', qty: 500 }, // больше максимума
        'мусор',
      ]),
    ).toEqual([
      { id: 'water-20l', qty: 2 },
      { id: 'water-10l', qty: 99 },
    ]);
    expect(sanitizeLines(null)).toEqual([]);
  });
});

describe('тексты из ассортимента', () => {
  const nbsp = String.fromCharCode(0xa0);

  it('объёмы берутся из каталога: скрытые товары и товары без объёма не учитываются', () => {
    expect(volumeList('ru')).toBe(`5, 10 и 20${nbsp}л`);
    expect(volumeList('ru', 'disjunction')).toBe(`5, 10 или 20${nbsp}л`);
    expect(volumeList('uz')).toBe(`5, 10 va 20${nbsp}l`);
  });

  it('меняются вместе с ассортиментом', () => {
    const p10 = catalog.find((p) => p.id === 'water-10l')!;
    p10.volume = 1.5;
    try {
      expect(volumeList('ru')).toBe(`1,5, 5 и 20${nbsp}л`);
    } finally {
      p10.volume = 10;
    }
  });
});

describe('форматирование', () => {
  it('телефоны Узбекистана', () => {
    expect(normalizeUzPhone('+998 (90) 123-45-67')).toBe('+998901234567');
    expect(normalizeUzPhone('90 123 45 67')).toBe('+998901234567');
    expect(normalizeUzPhone('12345')).toBeNull();
    expect(formatUzNational('9012345')).toBe('90 123-45');
    expect(formatPhoneForDisplay('998901234567')).toBe('+998 90 123-45-67');
    expect(phoneHref('+998 90 123 45 67')).toBe('tel:+998901234567');
  });

  it('цены и названия на двух языках', () => {
    expect(formatPrice(125000, 'ru')).toBe('125 000 сум');
    expect(formatPrice(125000, 'uz')).toBe('125 000 soʻm');
    expect(formatVolume(1.5, 'ru')).toBe(`1,5${String.fromCharCode(0xa0)}л`);
    const p20 = catalog.find((p) => p.id === 'water-20l')!;
    expect(productTitle(p20, 'ru')).toBe('Питьевая вода 20 л');
    expect(productTitle(p20, 'uz')).toBe('Ichimlik suvi 20 l');
  });

  it('пустой узбекский перевод заменяется русским', () => {
    expect(tr({ ru: 'Текст', uz: '' }, 'uz')).toBe('Текст');
    expect(tr(null, 'ru')).toBe('');
  });

  it('ссылки на соцсети из любого формата', () => {
    expect(resolveSocial('telegram', '@mycompany')?.href).toBe('https://t.me/mycompany');
    expect(resolveSocial('telegram', 'https://t.me/mycompany')?.handle).toBe('@mycompany');
    expect(resolveSocial('whatsapp', '+998 90 123 45 67')?.href).toBe('https://wa.me/998901234567');
    expect(resolveSocial('instagram', 'mycompany')?.href).toBe('https://instagram.com/mycompany');
    expect(resolveSocial('instagram', '   ')).toBeNull();
  });
});
