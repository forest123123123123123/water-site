import { faqConfig } from '@config/content';
import type { FaqItem, Localized } from '@config/types';
import { Plus } from 'lucide-react';
import { useLocale } from 'next-intl';
import { hasText, tr, type Locale } from '@/lib/locale';

/** Вопросы из config/content.ts, у которых уже есть ответ. */
export const visibleFaq = faqConfig.filter(
  (item): item is FaqItem & { answer: Localized } => hasText(item.question) && hasText(item.answer),
);

export function Faq() {
  const locale = useLocale() as Locale;

  return (
    <div className="divide-y divide-ink-100 overflow-hidden rounded-card bg-white shadow-soft ring-1 ring-ink-100">
      {visibleFaq.map((item, i) => (
        <details key={i} className="faq-item group" name="faq">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-5 px-5 py-5 transition-colors hover:bg-sea-50/50 sm:px-7">
            <span className="text-[1.02rem] font-semibold text-ink-950">{tr(item.question, locale)}</span>
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-sea-50 text-sea-700 transition-transform duration-300 group-open:rotate-45">
              <Plus className="size-4" aria-hidden />
            </span>
          </summary>
          <div className="px-5 pb-6 sm:px-7">
            <p className="max-w-3xl leading-relaxed text-ink-600">{tr(item.answer, locale)}</p>
          </div>
        </details>
      ))}
    </div>
  );
}
