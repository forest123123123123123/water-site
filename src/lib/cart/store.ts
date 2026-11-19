import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { persist, type PersistStorage } from 'zustand/middleware';
import { getProductById } from '../catalog';
import { MAX_QTY } from '../limits';
import { clamp } from '../utils';

export { MAX_QTY };
export const CART_STORAGE_KEY = 'water-shop:cart';

export type CartLine = { id: string; qty: number };

type CartState = {
  lines: CartLine[];
  /** Добавить qty штук (если товар уже в корзине — увеличить количество). */
  add: (id: string, qty?: number) => void;
  /** Установить точное количество; 0 и меньше — удалить. */
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  /** Вернуть удалённую позицию на прежнее место (для кнопки «Вернуть»). */
  restore: (line: CartLine, index: number) => void;
  clear: () => void;
  /**
   * Убрать из корзины то, что ушло в заказ. Если пока заказ отправлялся, корзину
   * поменяли (например, в другой вкладке), добавленное после отправки остаётся.
   */
  removeOrdered: (ordered: CartLine[]) => void;
};

type Persisted = { lines: CartLine[] };

/**
 * localStorage, который не подводит: если хранилище заблокировано, переполнено
 * или в нём испорченные данные, корзина просто живёт в памяти страницы.
 * (Встроенный createJSONStorage в этих случаях оставляет корзину незагруженной.)
 */
const safeStorage: PersistStorage<Persisted> = {
  getItem: (name) => {
    try {
      const raw = window.localStorage.getItem(name);
      const data: unknown = raw ? JSON.parse(raw) : null;
      return data && typeof data === 'object' ? (data as { state: Persisted; version?: number }) : null;
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      window.localStorage.setItem(name, JSON.stringify(value));
    } catch {
      // Нет места или доступа — корзина остаётся в памяти до закрытия страницы.
    }
  },
  removeItem: (name) => {
    try {
      window.localStorage.removeItem(name);
    } catch {
      // Хранилище недоступно — удалять нечего.
    }
  },
};

/** Отбрасывает мусор из localStorage: неизвестные товары, дубликаты, неверные количества. */
export function sanitizeLines(input: unknown): CartLine[] {
  if (!Array.isArray(input)) return [];
  const result: CartLine[] = [];
  const seen = new Set<string>();
  for (const raw of input) {
    if (!raw || typeof raw !== 'object') continue;
    const { id, qty } = raw as Partial<CartLine>;
    if (typeof id !== 'string' || seen.has(id) || !getProductById(id)) continue;
    const n = Math.floor(Number(qty));
    if (!Number.isFinite(n) || n < 1) continue;
    seen.add(id);
    result.push({ id, qty: clamp(n, 1, MAX_QTY) });
  }
  return result;
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      add: (id, qty = 1) =>
        set((state) => {
          const existing = state.lines.find((l) => l.id === id);
          if (existing) {
            return {
              lines: state.lines.map((l) =>
                l.id === id ? { ...l, qty: clamp(l.qty + qty, 1, MAX_QTY) } : l,
              ),
            };
          }
          return { lines: [...state.lines, { id, qty: clamp(qty, 1, MAX_QTY) }] };
        }),
      setQty: (id, qty) =>
        set((state) => {
          const n = Math.floor(qty);
          if (!Number.isFinite(n) || n <= 0) return { lines: state.lines.filter((l) => l.id !== id) };
          const exists = state.lines.some((l) => l.id === id);
          if (!exists) return { lines: [...state.lines, { id, qty: clamp(n, 1, MAX_QTY) }] };
          return {
            lines: state.lines.map((l) => (l.id === id ? { ...l, qty: clamp(n, 1, MAX_QTY) } : l)),
          };
        }),
      remove: (id) => set((state) => ({ lines: state.lines.filter((l) => l.id !== id) })),
      restore: (line, index) =>
        set((state) => {
          if (state.lines.some((l) => l.id === line.id)) return state;
          const lines = [...state.lines];
          lines.splice(clamp(index, 0, lines.length), 0, line);
          return { lines };
        }),
      clear: () => set({ lines: [] }),
      removeOrdered: (ordered) =>
        set((state) => ({
          lines: state.lines.flatMap((line) => {
            const left = line.qty - (ordered.find((o) => o.id === line.id)?.qty ?? 0);
            return left > 0 ? [{ ...line, qty: left }] : [];
          }),
        })),
    }),
    {
      name: CART_STORAGE_KEY,
      version: 1,
      storage: safeStorage,
      partialize: (state): Persisted => ({ lines: state.lines }),
      // Данные другой версии не теряются: строки проверяются так же, как текущие.
      migrate: (persisted) => ({ lines: sanitizeLines((persisted as { lines?: unknown } | undefined)?.lines) }),
      // Корзина читается из localStorage только в браузере, после гидратации (см. CartRuntime).
      skipHydration: true,
      merge: (persisted, current) => ({
        ...current,
        lines: sanitizeLines((persisted as { lines?: unknown } | undefined)?.lines),
      }),
    },
  ),
);

function subscribeHydration(onChange: () => void) {
  const unsubFinish = useCart.persist.onFinishHydration(onChange);
  const unsubStart = useCart.persist.onHydrate(onChange);
  return () => {
    unsubFinish();
    unsubStart();
  };
}

/**
 * true — когда содержимое корзины уже восстановлено.
 * До этого момента интерфейс показывает нейтральное состояние,
 * чтобы HTML с сервера совпал с первым рендером в браузере.
 */
export function useCartHydrated(): boolean {
  return useSyncExternalStore(
    subscribeHydration,
    () => useCart.persist.hasHydrated(),
    () => false,
  );
}

/** Количество конкретного товара в корзине (0, если нет или корзина ещё не загружена). */
export function useLineQty(id: string): number {
  const hydrated = useCartHydrated();
  const qty = useCart((s) => s.lines.find((l) => l.id === id)?.qty ?? 0);
  return hydrated ? qty : 0;
}
