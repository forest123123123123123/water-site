'use client';

import { useCallback, useLayoutEffect, useRef, type ChangeEvent, type KeyboardEvent } from 'react';
import { formatUzNational } from '@/lib/format';
import { cn } from '@/lib/utils';

/** Позиция курсора в отформатированной строке после N-й цифры. */
function caretAfterDigits(formatted: string, digitCount: number) {
  if (digitCount <= 0) return 0;
  let seen = 0;
  for (let i = 0; i < formatted.length; i++) {
    if (/\d/.test(formatted[i])) seen++;
    if (seen === digitCount) return i + 1;
  }
  return formatted.length;
}

/**
 * Телефон в формате +998 XX XXX-XX-XX. Значение — только 9 цифр.
 * Курсор не прыгает при редактировании в середине, Backspace перешагивает
 * разделители, вставка «+998 90 123 45 67» целиком работает.
 */
export function PhoneInput({
  value,
  onChange,
  onBlur,
  id,
  name,
  invalid,
  describedBy,
  inputRef,
  placeholder = '90 123-45-67',
}: {
  value: string;
  onChange: (digits: string) => void;
  onBlur?: () => void;
  id: string;
  name?: string;
  invalid?: boolean;
  describedBy?: string;
  /** Колбэк-ref (например, field.ref из react-hook-form — для фокуса на ошибке). */
  inputRef?: (element: HTMLInputElement | null) => void;
  placeholder?: string;
}) {
  const localRef = useRef<HTMLInputElement | null>(null);
  const setRefs = useCallback(
    (element: HTMLInputElement | null) => {
      localRef.current = element;
      inputRef?.(element);
    },
    [inputRef],
  );

  // Позиция курсора применяется сразу после того, как React обновил значение поля
  // (до отрисовки кадра) — без гонок с быстрыми нажатиями клавиш.
  const pendingCaret = useRef<number | null>(null);
  useLayoutEffect(() => {
    const el = localRef.current;
    const pos = pendingCaret.current;
    pendingCaret.current = null;
    if (el && pos !== null && document.activeElement === el) el.setSelectionRange(pos, pos);
  });

  const setCaret = (digits: string, digitCount: number) => {
    const pos = caretAfterDigits(formatUzNational(digits), digitCount);
    pendingCaret.current = pos;
    // Если значение не изменилось (например, ввели букву), React не перерисует поле —
    // ставим курсор сразу.
    if (digits === value && localRef.current) localRef.current.setSelectionRange(pos, pos);
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value;
    const caret = event.target.selectionStart ?? raw.length;
    let digitsBefore = raw.slice(0, caret).replace(/\D/g, '').length;
    let digits = raw.replace(/\D/g, '');
    if (digits.length > 9 && digits.startsWith('998')) {
      digits = digits.slice(3);
      digitsBefore = Math.max(0, digitsBefore - 3);
    }
    digits = digits.slice(0, 9);
    onChange(digits);
    setCaret(digits, Math.min(digitsBefore, digits.length));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const el = event.currentTarget;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    if (event.key !== 'Backspace' || start !== end || start === 0) return;
    const formatted = el.value;
    // Слева от курсора разделитель — удаляем ближайшую цифру перед ним.
    if (/\d/.test(formatted[start - 1])) return;
    event.preventDefault();
    const digitsBefore = formatted.slice(0, start).replace(/\D/g, '').length;
    if (digitsBefore === 0) return;
    const next = value.slice(0, digitsBefore - 1) + value.slice(digitsBefore);
    onChange(next);
    setCaret(next, digitsBefore - 1);
  };

  return (
    <div
      className={cn(
        'flex h-14 items-center rounded-2xl bg-white ring-1 transition-shadow focus-within:ring-2',
        invalid ? 'ring-coral-500 focus-within:ring-coral-500' : 'ring-ink-200 focus-within:ring-sea-500',
      )}
    >
      <span className="pr-1 pl-4 font-semibold text-ink-500 select-none" aria-hidden>
        +998
      </span>
      <input
        ref={setRefs}
        id={id}
        name={name}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        value={formatUzNational(value)}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={onBlur}
        placeholder={placeholder}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        className="h-full min-w-0 flex-1 rounded-r-2xl bg-transparent pr-4 text-[1.02rem] font-semibold tracking-wide text-ink-950 outline-none placeholder:font-normal placeholder:text-ink-400"
      />
    </div>
  );
}
