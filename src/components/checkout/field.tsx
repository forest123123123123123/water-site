import { CircleAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export const inputStyles = (invalid?: boolean) =>
  cn(
    'w-full rounded-2xl bg-white px-4 text-[1.02rem] text-ink-950 outline-none ring-1 transition-shadow placeholder:text-ink-400 focus:ring-2',
    invalid ? 'ring-coral-500 focus:ring-coral-500' : 'ring-ink-200 focus:ring-sea-500',
  );

/** Поле формы: подпись, пометка «необязательно», подсказка и сообщение об ошибке. */
export function Field({
  id,
  label,
  optionalLabel,
  hint,
  error,
  children,
  className,
}: {
  id: string;
  label: string;
  optionalLabel?: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-2 flex items-baseline justify-between gap-3 text-[0.93rem] font-semibold text-ink-800">
        {label}
        {optionalLabel && <span className="text-xs font-medium text-ink-400">{optionalLabel}</span>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-2 flex items-center gap-1.5 text-sm font-medium text-coral-500">
          <CircleAlert className="size-4 shrink-0" aria-hidden />
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-2 text-sm text-ink-400">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
