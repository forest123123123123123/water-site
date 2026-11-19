'use client';

import { useEffect } from 'react';
import { Toaster } from 'sonner';
import { CART_STORAGE_KEY, useCart } from '@/lib/cart/store';

/**
 * Подключается один раз в layout:
 *  — восстанавливает корзину из localStorage после загрузки страницы;
 *  — синхронизирует корзину между открытыми вкладками;
 *  — выводит всплывающие уведомления.
 */
export function CartRuntime() {
  useEffect(() => {
    void useCart.persist.rehydrate();
    const onStorage = (event: StorageEvent) => {
      if (event.key === CART_STORAGE_KEY) void useCart.persist.rehydrate();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return (
    <Toaster
      position="bottom-center"
      offset={{ bottom: 96 }}
      mobileOffset={{ bottom: 92 }}
      gap={10}
      toastOptions={{
        duration: 4500,
        classNames: {
          toast:
            '!rounded-2xl !border !border-white/10 !bg-ink-900/95 !text-white !shadow-lift !backdrop-blur-xl !font-sans !px-4 !py-3.5',
          title: '!text-[0.92rem] !font-medium',
          actionButton:
            '!rounded-full !bg-white !text-ink-900 !font-semibold !text-[0.82rem] !px-3.5 !h-8 hover:!bg-sea-100',
          icon: '!text-sea-300',
        },
      }}
    />
  );
}
