import { ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

export type Crumb = { name: string; href?: string };

export function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  const t = useTranslations('nav');
  return (
    <nav aria-label={t('breadcrumbs')} className={className}>
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-ink-500">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${item.name}-${i}`} className="flex items-center gap-1.5">
              {item.href && !last ? (
                <Link href={item.href} className="rounded-md transition-colors hover:text-sea-700">
                  {item.name}
                </Link>
              ) : (
                <span aria-current={last ? 'page' : undefined} className={cn(last && 'font-medium text-ink-800')}>
                  {item.name}
                </span>
              )}
              {!last && <ChevronRight className="size-3.5 text-ink-300" aria-hidden />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** Шапка внутренней страницы: крошки, заголовок, подзаголовок и мягкий фон «водной глади». */
export function PageHeader({
  crumbs,
  title,
  lead,
  aside,
  className,
}: {
  crumbs: Crumb[];
  title: ReactNode;
  lead?: ReactNode;
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn('relative isolate overflow-hidden', className)}>
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <div className="absolute -top-48 right-[-8%] size-[38rem] rounded-full bg-[radial-gradient(circle,var(--color-sea-100),transparent_65%)]" />
        <svg className="absolute right-0 bottom-0 h-full w-1/2 text-sea-200/50" viewBox="0 0 400 300" preserveAspectRatio="xMaxYMax slice">
          {[40, 80, 120, 160, 200, 240].map((r) => (
            <circle key={r} cx="400" cy="300" r={r} fill="none" stroke="currentColor" strokeWidth="1" />
          ))}
        </svg>
      </div>
      <div className="container-page pt-6 pb-10 sm:pt-10 lg:pb-14">
        <Breadcrumbs items={crumbs} />
        <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <h1 className="display-lg animate-rise-in text-ink-950">{title}</h1>
            {lead && <p className="lead mt-5 max-w-2xl animate-rise-in [animation-delay:100ms]">{lead}</p>}
          </div>
          {aside && <div className="shrink-0 animate-rise-in [animation-delay:160ms]">{aside}</div>}
        </div>
      </div>
    </header>
  );
}
