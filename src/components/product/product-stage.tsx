import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * «Сцена» для изображения товара: мягкий градиент в оттенке товара
 * и волна-ватерлиния, которая поднимается при наведении на карточку.
 */
export function ProductStage({
  tone,
  children,
  className,
  wave = true,
}: {
  tone: string;
  children: ReactNode;
  className?: string;
  wave?: boolean;
}) {
  return (
    <div
      className={cn('relative isolate overflow-hidden', className)}
      style={
        {
          '--tone': tone,
          background: `radial-gradient(90% 70% at 50% 92%, color-mix(in oklab, ${tone} 18%, transparent), transparent 70%), linear-gradient(180deg, #f6fbfe 0%, #e9f5fc 100%)`,
        } as CSSProperties
      }
    >
      {wave && (
        <svg
          className="absolute inset-x-0 bottom-0 -z-10 h-[34%] w-[200%] translate-y-2 transition-transform duration-700 ease-fluid group-hover:-translate-y-3 motion-safe:animate-[wave-drift_14s_linear_infinite]"
          viewBox="0 0 800 100"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path
            d="M0 30 Q 50 14 100 30 T 200 30 T 300 30 T 400 30 T 500 30 T 600 30 T 700 30 T 800 30 V100 H0 Z"
            fill="color-mix(in oklab, var(--tone) 9%, #f1f8fd)"
          />
          <path
            d="M0 46 Q 50 32 100 46 T 200 46 T 300 46 T 400 46 T 500 46 T 600 46 T 700 46 T 800 46 V100 H0 Z"
            fill="color-mix(in oklab, var(--tone) 15%, #eaf5fc)"
          />
        </svg>
      )}
      {children}
    </div>
  );
}
