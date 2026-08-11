import type { SiteContentFaqItem } from "@/lib/types";

export default function FaqList({ items }: { items: SiteContentFaqItem[] }) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <details key={item.itemId} className="glass-panel group overflow-hidden rounded-xl">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 text-left text-lg font-semibold text-[#e0e8f0] transition-colors hover:bg-white/5 sm:p-6 [&::-webkit-details-marker]:hidden">
            <span>{item.question}</span>
            <span
              aria-hidden="true"
              className="shrink-0 text-[#7dd3fc] transition group-open:rotate-45"
            >
              +
            </span>
          </summary>
          <p className="border-t border-[rgba(125,211,252,0.1)] px-5 pb-5 pt-4 text-[15px] leading-7 text-[#a0b4c4] sm:px-6 sm:pb-6">
            {item.answer}
          </p>
        </details>
      ))}
    </div>
  );
}
