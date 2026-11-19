import { connection } from 'next/server';
import { getOrderMode } from '@/lib/site';
import { hasConfiguredChannel } from './channels';

/**
 * Принимает ли сайт заказы прямо сейчас. Каналы приёма настраиваются переменными окружения,
 * поэтому проверка выполняется при каждом запросе, а не при сборке: вызывать только внутри Suspense.
 */
export async function acceptsOrders(): Promise<boolean> {
  await connection();
  const mode = getOrderMode();
  return mode === 'api' ? hasConfiguredChannel() : mode !== 'unconfigured';
}
