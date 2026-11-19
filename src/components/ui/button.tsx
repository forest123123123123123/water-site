import type { ComponentProps } from 'react';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'dark' | 'outline' | 'soft' | 'ghost' | 'white';
type Size = 'sm' | 'md' | 'lg';

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-[linear-gradient(135deg,var(--color-sea-500),var(--color-sea-700))] text-white shadow-glow hover:shadow-[0_14px_34px_-10px_rgb(26_146_212_/_0.7)] hover:brightness-110',
  dark: 'bg-ink-900 text-white hover:bg-ink-800 shadow-[0_10px_24px_-12px_rgb(10_26_44_/_0.6)]',
  outline: 'border border-ink-200 bg-white text-ink-900 hover:border-sea-300 hover:bg-sea-50',
  soft: 'bg-sea-50 text-sea-800 hover:bg-sea-100',
  ghost: 'text-ink-700 hover:bg-ink-100/70 hover:text-ink-900',
  white: 'bg-white text-ink-900 hover:bg-sea-50 shadow-[0_10px_24px_-14px_rgb(0_0_0_/_0.5)]',
};

const SIZES: Record<Size, string> = {
  sm: 'h-9 gap-1.5 px-4 text-sm',
  md: 'h-11 gap-2 px-5 text-[0.95rem]',
  lg: 'h-14 gap-2.5 px-7 text-base',
};

export function buttonStyles({
  variant = 'primary',
  size = 'md',
  className,
}: { variant?: Variant; size?: Size; className?: string } = {}) {
  return cn(
    'inline-flex shrink-0 items-center justify-center rounded-full font-semibold whitespace-nowrap select-none',
    'transition-[transform,background-color,box-shadow,color,filter,border-color] duration-300 ease-fluid',
    'active:scale-[0.97] disabled:pointer-events-none disabled:opacity-45',
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}

type StyleProps = { variant?: Variant; size?: Size };

export function Button({ variant, size, className, type = 'button', ...props }: ComponentProps<'button'> & StyleProps) {
  return <button type={type} className={buttonStyles({ variant, size, className })} {...props} />;
}

export function ButtonLink({ variant, size, className, ...props }: ComponentProps<typeof Link> & StyleProps) {
  return <Link className={buttonStyles({ variant, size, className })} {...props} />;
}

export function ButtonAnchor({ variant, size, className, ...props }: ComponentProps<'a'> & StyleProps) {
  return <a className={buttonStyles({ variant, size, className })} {...props} />;
}
