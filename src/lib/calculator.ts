/**
 * Подбор набора тары под нужный объём воды.
 * Ищем комбинацию с минимальным «лишним» объёмом, а при равенстве —
 * с наименьшим количеством штук (меньше носить).
 */

export type Container = { id: string; volume: number };
export type Recommendation = {
  items: { id: string; volume: number; qty: number }[];
  totalLiters: number;
};

/** Ориентир для калькулятора: литров питьевой воды на человека в день. */
export const LITERS_PER_PERSON_PER_DAY = 2;

export function litersNeeded(people: number, days: number, perPersonPerDay = LITERS_PER_PERSON_PER_DAY) {
  return Math.max(0, Math.ceil(people * days * perPersonPerDay));
}

export function recommendContainers(liters: number, containers: Container[]): Recommendation | null {
  const usable = containers.filter((c) => Number.isInteger(c.volume) && c.volume > 0);
  if (usable.length === 0 || liters <= 0) return null;

  const maxVolume = Math.max(...usable.map((c) => c.volume));
  const limit = liters + maxVolume;

  // count[t] — минимальное число штук, дающих ровно t литров; from[t] — последняя добавленная тара.
  const count = new Array<number>(limit + 1).fill(Infinity);
  const from = new Array<number>(limit + 1).fill(-1);
  count[0] = 0;
  for (let t = 1; t <= limit; t++) {
    for (let i = 0; i < usable.length; i++) {
      const v = usable[i].volume;
      if (v <= t && count[t - v] + 1 < count[t]) {
        count[t] = count[t - v] + 1;
        from[t] = i;
      }
    }
  }

  let target = -1;
  for (let t = liters; t <= limit; t++) {
    if (Number.isFinite(count[t])) {
      target = t;
      break;
    }
  }
  if (target < 0) return null;

  const qty = new Map<number, number>();
  for (let t = target; t > 0; t -= usable[from[t]].volume) {
    qty.set(from[t], (qty.get(from[t]) ?? 0) + 1);
  }

  const items = usable
    .map((c, i) => ({ id: c.id, volume: c.volume, qty: qty.get(i) ?? 0 }))
    .filter((i) => i.qty > 0)
    .sort((a, b) => b.volume - a.volume);

  return { items, totalLiters: target };
}
