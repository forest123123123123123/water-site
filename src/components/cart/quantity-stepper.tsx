'use client';

import { Minus, Plus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRef, useState, type KeyboardEvent } from 'react';
import { MAX_QTY } from '@/lib/limits';
import { clamp, cn } from '@/lib/utils';

type Size = 'sm' | 'md' | 'lg';

const SIZE: Record<Size, { wrap: string; btn: string; input: string; icon: string }> = {
  sm: { wrap: 'h-9', btn: 'size-9', input: 'w-9 text-sm', icon: 'size-4' },
  md: { wrap: 'h-11', btn: 'size-11', input: 'w-10 text-base', icon: 'size-[1.1rem]' },
  lg: { wrap: 'h-14', btn: 'size-14', input: 'w-12 text-lg', icon: 'size-5' },
};

/**
 * Счётчик количества: «−», поле ввода, «+».
 * При количестве 1 кнопка «−» превращается в «удалить».
 * Число можно ввести с клавиатуры — удобно для больших заказов (офис на 30 бутылей).
 */
export function QuantityStepper({
  value,
  onChange,
  label,
  size = 'md',
  max = MAX_QTY,
  className,
  stretch = false,
}: {
  value: number;
  /** 0 означает «удалить из корзины». */
  onChange: (next: number) => void;
  /** Название товара — для экранных дикторов. */
  label: string;
  size?: Size;
  max?: number;
  className?: string;
  stretch?: boolean;
}) {
  const t = useTranslations('cart');
  /** Набираемое значение; null — поле не редактируется и показывает value. */
  const [draft, setDraft] = useState<string | null>(null);
  /** Escape: при потере фокуса набранное не применяется (состояние draft обновится только после рендера). */
  const cancelRef = useRef(false);
  const s = SIZE[size];

  const commit = () => {
    const cancelled = cancelRef.current;
    cancelRef.current = false;
    if (draft === null) return;
    setDraft(null);
    if (cancelled) return;
    const n = Number.parseInt(draft, 10);
    // 0 или пустое поле не удаляют товар случайно: для этого есть кнопка слева.
    if (Number.isFinite(n) && n > 0 && n !== value) onChange(Math.min(n, max));
  };

  /** Стрелки во время ввода меняют и набранное число, иначе потеря фокуса вернула бы старое. */
  const step = (delta: number) => {
    const typed = draft === null ? NaN : Number.parseInt(draft, 10);
    const next = clamp((typed > 0 ? typed : value) + delta, 1, max);
    if (draft !== null) setDraft(String(next));
    if (next !== value) onChange(next);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.currentTarget.blur();
    } else if (event.key === 'Escape') {
      cancelRef.current = true;
      event.currentTarget.blur();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      step(1);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      step(-1);
    }
  };

  const isLast = value <= 1;

  return (
    <div
      role="group"
      aria-label={`${t('quantity')}: ${label}`}
      className={cn(
        'inline-flex items-center justify-between rounded-full bg-sea-50 p-0 ring-1 ring-sea-100 ring-inset',
        s.wrap,
        stretch && 'w-full',
        className,
      )}
    >
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        aria-label={isLast ? t('remove') : t('decrease')}
        className={cn(
          'grid shrink-0 place-items-center rounded-full text-sea-800 transition-colors duration-200 hover:bg-white active:scale-95',
          isLast && 'hover:text-coral-500',
          s.btn,
        )}
      >
        {isLast ? <Trash2 className={s.icon} aria-hidden /> : <Minus className={s.icon} aria-hidden />}
      </button>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        role="spinbutton"
        aria-valuenow={value}
        aria-valuemin={1}
        aria-valuemax={max}
        aria-label={t('quantity')}
        value={draft ?? String(value)}
        onFocus={(e) => {
          setDraft(String(value));
          requestAnimationFrame(() => e.target.select());
        }}
        onChange={(e) => setDraft(e.target.value.replace(/\D+/g, '').slice(0, 2))}
        onBlur={commit}
        onKeyDown={onKeyDown}
        className={cn(
          'h-full min-w-0 bg-transparent text-center font-display font-semibold text-ink-950 tabular-nums outline-none',
          'rounded-lg focus-visible:bg-white',
          s.input,
        )}
      />
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        aria-label={t('increase')}
        className={cn(
          'grid shrink-0 place-items-center rounded-full text-sea-800 transition-colors duration-200 hover:bg-white active:scale-95 disabled:opacity-40',
          s.btn,
        )}
      >
        <Plus className={s.icon} aria-hidden />
      </button>
    </div>
  );
}
