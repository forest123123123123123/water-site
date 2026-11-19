import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function SectionHeading({
  eyebrow,
  title,
  text,
  align = 'left',
  action,
  tone = 'light',
  className,
  id,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  text?: ReactNode;
  align?: 'left' | 'center';
  action?: ReactNode;
  tone?: 'light' | 'dark';
  className?: string;
  id?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-6 md:flex-row md:items-end md:justify-between',
        align === 'center' && 'items-center text-center md:flex-col md:items-center',
        className,
      )}
    >
      <div className={cn('max-w-2xl', align === 'center' && 'mx-auto')}>
        {eyebrow && (
          <p className={cn('eyebrow mb-4', tone === 'dark' && 'text-sea-300')}>
            <span className={cn('h-px w-6 bg-current opacity-60')} aria-hidden />
            {eyebrow}
          </p>
        )}
        <h2 id={id} className={cn('display-md', tone === 'dark' ? 'text-white' : 'text-ink-950')}>
          {title}
        </h2>
        {text && (
          <p className={cn('lead mt-4', tone === 'dark' && 'text-ink-200')}>{text}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
