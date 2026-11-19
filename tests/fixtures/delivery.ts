import type { DeliveryConfig } from '@config/types';

/** Тестовые условия доставки вместо config/delivery.ts. */
export const deliveryConfig: DeliveryConfig = {
  city: { ru: 'Ташкент', uz: 'Toshkent' },
  zones: [],
  info: { time: null, hours: null, cost: null, minOrder: null, payment: null, containers: null },
  extra: [],
  districts: [{ id: 'yunusobod', name: { ru: 'Юнусабадский', uz: 'Yunusobod' } }],
};
