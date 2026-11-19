import { Suspense, type ReactNode } from 'react';
import { acceptsOrders } from '@/lib/order/availability';

async function Gate({ children, otherwise }: { children: ReactNode; otherwise: ReactNode }) {
  return (await acceptsOrders()) ? children : otherwise;
}

/**
 * Показывает children только когда сайт принимает заказы, иначе — otherwise.
 * Пока ответ неизвестен (статичная оболочка страницы), показывается otherwise:
 * обещание заказа не должно появляться раньше, чем подтверждена его возможность.
 */
export function OrdersOpen({ children, otherwise = null }: { children: ReactNode; otherwise?: ReactNode }) {
  return (
    <Suspense fallback={otherwise}>
      <Gate otherwise={otherwise}>{children}</Gate>
    </Suspense>
  );
}
