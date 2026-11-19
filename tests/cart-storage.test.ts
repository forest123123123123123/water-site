import { afterEach, describe, expect, it, vi } from 'vitest';
import { CART_STORAGE_KEY, useCart } from '@/lib/cart/store';
import { clearDetails, loadDetails, saveDetails } from '@/lib/order/remember';

/** Простейший localStorage; отдельные методы можно заменить на «ломающиеся». */
function fakeStorage(initial: Record<string, string> = {}, overrides: Partial<Storage> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
    data,
    ...overrides,
  };
}

/** Подменяет хранилище. Корзина сбрасывается до подмены: запись пустой корзины не затрёт тестовые данные. */
function withStorage(storage: unknown) {
  vi.unstubAllGlobals();
  useCart.setState({ lines: [] });
  vi.stubGlobal('window', { localStorage: storage });
  vi.stubGlobal('localStorage', storage);
}

const rehydrate = () => useCart.persist.rehydrate();

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('корзина при сбоях localStorage', () => {
  it('восстанавливает сохранённую корзину', async () => {
    withStorage(fakeStorage({ [CART_STORAGE_KEY]: JSON.stringify({ state: { lines: [{ id: 'water-20l', qty: 2 }] }, version: 1 }) }));
    await rehydrate();
    expect(useCart.persist.hasHydrated()).toBe(true);
    expect(useCart.getState().lines).toEqual([{ id: 'water-20l', qty: 2 }]);
  });

  it('заблокированное хранилище: корзина работает в памяти, загрузка не зависает', async () => {
    const blocked = () => {
      throw new DOMException('Access is denied', 'SecurityError');
    };
    withStorage(fakeStorage({}, { getItem: blocked, setItem: blocked, removeItem: blocked }));
    await rehydrate();
    expect(useCart.persist.hasHydrated()).toBe(true);
    useCart.getState().add('water-5l', 2);
    expect(useCart.getState().lines).toEqual([{ id: 'water-5l', qty: 2 }]);
  });

  it('localStorage нет вовсе (getter бросает ошибку)', async () => {
    useCart.setState({ lines: [] });
    vi.stubGlobal('window', {
      get localStorage(): Storage {
        throw new DOMException('The operation is insecure.', 'SecurityError');
      },
    });
    await rehydrate();
    expect(useCart.persist.hasHydrated()).toBe(true);
    expect(() => useCart.getState().add('water-10l')).not.toThrow();
  });

  it('повреждённые данные: пустая корзина вместо вечной загрузки', async () => {
    for (const raw of ['{not json', '"строка"', '42', 'null', JSON.stringify({ state: { lines: 'мусор' }, version: 1 })]) {
      withStorage(fakeStorage({ [CART_STORAGE_KEY]: raw }));
      await rehydrate();
      expect(useCart.persist.hasHydrated(), raw).toBe(true);
      expect(useCart.getState().lines, raw).toEqual([]);
    }
  });

  it('переполненное хранилище не ломает добавление в корзину', async () => {
    withStorage(
      fakeStorage({}, {
        setItem: () => {
          throw new DOMException('Quota exceeded', 'QuotaExceededError');
        },
      }),
    );
    await rehydrate();
    expect(() => useCart.getState().add('water-20l', 3)).not.toThrow();
    expect(useCart.getState().lines).toEqual([{ id: 'water-20l', qty: 3 }]);
  });

  it('данные старой версии проверяются, а не выбрасываются целиком', async () => {
    const old = { state: { lines: [{ id: 'water-20l', qty: 2 }, { id: 'removed-product', qty: 1 }, { id: 'water-5l', qty: 500 }] }, version: 0 };
    withStorage(fakeStorage({ [CART_STORAGE_KEY]: JSON.stringify(old) }));
    await rehydrate();
    expect(useCart.getState().lines).toEqual([
      { id: 'water-20l', qty: 2 },
      { id: 'water-5l', qty: 99 },
    ]);
  });
});

describe('корзина после оформления', () => {
  it('убирает только заказанное: добавленное во время отправки остаётся', () => {
    withStorage(fakeStorage());
    useCart.setState({ lines: [{ id: 'water-20l', qty: 2 }] });
    const ordered = useCart.getState().lines;
    // Пока заказ отправлялся, в другой вкладке добавили товар и увеличили количество.
    useCart.setState({ lines: [{ id: 'water-20l', qty: 3 }, { id: 'water-5l', qty: 1 }] });
    useCart.getState().removeOrdered(ordered);
    expect(useCart.getState().lines).toEqual([
      { id: 'water-20l', qty: 1 },
      { id: 'water-5l', qty: 1 },
    ]);
  });

  it('без изменений корзина после заказа пустая', () => {
    withStorage(fakeStorage());
    useCart.setState({ lines: [{ id: 'water-20l', qty: 2 }, { id: 'water-5l', qty: 1 }] });
    useCart.getState().removeOrdered(useCart.getState().lines);
    expect(useCart.getState().lines).toEqual([]);
  });
});

describe('сохранённые данные покупателя', () => {
  it('сохраняет только перечисленные поля, без комментария, и удаляется по запросу', () => {
    const storage = fakeStorage();
    withStorage(storage);
    saveDetails({ name: 'Азиз', phone: '901234567', district: '', address: 'ул. 1', landmark: '', comment: 'секрет', remember: true });
    const stored = JSON.parse(storage.data.get('water-shop:checkout')!);
    expect(Object.keys(stored).sort()).toEqual(['address', 'district', 'landmark', 'name', 'phone']);
    expect(loadDetails()).toMatchObject({ name: 'Азиз', phone: '901234567' });
    clearDetails();
    expect(loadDetails()).toBeNull();
  });

  it('недоступное хранилище не ломает форму', () => {
    withStorage(fakeStorage({}, { getItem: () => { throw new Error('denied'); }, setItem: () => { throw new Error('denied'); } }));
    expect(() => saveDetails({ name: 'Азиз' })).not.toThrow();
    expect(loadDetails()).toBeNull();
  });
});
