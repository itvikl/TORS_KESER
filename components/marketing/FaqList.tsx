import type { SiteContentFaqItem } from "@/lib/types";

export default function FaqList({ items }: { items: SiteContentFaqItem[] }) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <details key={item.itemId} className="glass-panel group overflow-hidden rounded-xl">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 text-left text-lg font-semibold text-[var(--color-mist)] transition-colors hover:bg-[var(--color-surface-hover-a)] sm:p-6 [&::-webkit-details-marker]:hidden">
            <span>{item.question}</span>
            <span
              aria-hidden="true"
              className="shrink-0 text-[var(--color-ice)] transition group-open:rotate-45"
            >
              +
            </span>
          </summary>
          <p className="border-t border-[var(--color-border-ice)] px-5 pb-5 pt-4 text-[15px] leading-7 text-[var(--color-slate)] sm:px-6 sm:pb-6">
            {item.answer}
          </p>
        </details>
      ))}
    </div>
  );
}
