import Image from 'next/image';
import type { CSSProperties } from 'react';
import { maxVolume, type Product } from '@/lib/catalog';
import { formatNumber } from '@/lib/format';
import { brandName } from '@/lib/site';
import { cn } from '@/lib/utils';
import { Canister, CANISTER_VIEWBOX } from './illustrations/canister';
import { CoolerBottle, COOLER_VIEWBOX } from './illustrations/cooler';
import { Jug, JUG_VIEWBOX } from './illustrations/jug';

const ILLUSTRATIONS = {
  jug: { Component: Jug, box: JUG_VIEWBOX },
  canister: { Component: Canister, box: CANISTER_VIEWBOX },
  cooler: { Component: CoolerBottle, box: COOLER_VIEWBOX },
} as const;

const TALLEST = COOLER_VIEWBOX.height;

/**
 * Относительная высота изображения товара (0…1), чтобы объёмы рядом
 * выглядели в реальных пропорциях: бутыль 20 л выше и шире бутылки 5 л.
 */
export function visualScale(product: Product): number {
  if (!product.image && product.illustration) {
    return ILLUSTRATIONS[product.illustration].box.height / TALLEST;
  }
  if (product.volume) return 0.72 + 0.28 * Math.sqrt(product.volume / maxVolume);
  return 0.85;
}

type Props = {
  product: Product;
  /** Подпись для скринридеров; если не задана — изображение декоративное. */
  alt?: string;
  level?: number;
  animated?: boolean;
  /** Учитывать реальные пропорции объёмов (true) или вписать в контейнер целиком (false). */
  scaled?: boolean;
  priority?: boolean;
  sizes?: string;
  className?: string;
};

/**
 * Изображение товара: настоящее фото из настроек или встроенная иллюстрация.
 * Контейнер должен иметь высоту — изображение встаёт «на пол» по нижнему краю.
 */
export function ProductVisual({
  product,
  alt,
  level = 1,
  animated = true,
  scaled = true,
  priority,
  sizes = '(max-width: 768px) 60vw, 360px',
  className,
}: Props) {
  const scale = scaled ? visualScale(product) : 1;
  const style: CSSProperties = { height: `${scale * 100}%` };

  if (product.image) {
    return (
      <div className={cn('relative flex h-full w-full items-end justify-center', className)}>
        <div className="relative w-full" style={style}>
          <Image
            src={product.image}
            alt={alt ?? ''}
            fill
            priority={priority}
            sizes={sizes}
            className="object-contain object-bottom mix-blend-multiply"
          />
        </div>
      </div>
    );
  }

  const volumeLabel = product.volume ? `${formatNumber(product.volume)} L` : '';

  if (product.illustration) {
    const { Component } = ILLUSTRATIONS[product.illustration];
    return (
      <div className={cn('flex h-full w-full items-end justify-center', className)}>
        <Component
          brand={brandName}
          volumeLabel={volumeLabel}
          tone={product.tone}
          level={level}
          animated={animated}
          title={alt}
          className="block max-w-full drop-shadow-[0_18px_24px_rgba(13,94,147,0.18)]"
          style={{ ...style, width: 'auto' }}
        />
      </div>
    );
  }

  // Нет ни фото, ни иллюстрации — аккуратная капля-заглушка.
  return (
    <div className={cn('flex h-full w-full items-end justify-center', className)}>
      <svg viewBox="0 0 120 150" className="block h-[70%] w-auto" role={alt ? 'img' : undefined} aria-label={alt} aria-hidden={alt ? undefined : true}>
        <path d="M60 6 C60 6 14 62 14 98 a46 46 0 0 0 92 0 C106 62 60 6 60 6 Z" fill={product.tone} fillOpacity="0.85" />
        <path d="M38 96 a22 22 0 0 0 18 24" fill="none" stroke="#fff" strokeOpacity="0.7" strokeWidth="6" strokeLinecap="round" />
      </svg>
    </div>
  );
}
