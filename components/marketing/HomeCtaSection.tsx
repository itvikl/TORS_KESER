import Link from "next/link";
import type { SiteContentHome } from "@/lib/types";

export default function HomeCtaSection({
  content,
  interactive = true,
}: {
  content: SiteContentHome;
  interactive?: boolean;
}) {
  return (
    <div className="glass-card mx-auto max-w-5xl rounded-[3rem] p-10 text-center shadow-2xl backdrop-blur-lg md:p-20">
      <h2 className="font-display text-3xl font-bold text-[var(--color-mist)] sm:text-4xl md:text-5xl">
        {content.ctaHeading} <span className="text-[var(--color-ice)]">{content.ctaHeadingHighlight}</span>
      </h2>
      <p className="mx-auto mt-8 max-w-2xl text-xl leading-8 text-[var(--color-slate)]">{content.ctaBody}</p>
      <div className="mt-12 flex flex-col justify-center gap-4 sm:flex-row">
        {interactive ? (
          <>
            <Link
              href="/custom-made-tours"
              className="rounded-full bg-[var(--color-ice)] px-10 py-4 text-sm font-bold text-[var(--color-ice-ink)] transition hover:brightness-110 active:scale-95"
            >
              {content.ctaPrimaryButton}
            </Link>
            <Link
              href="/contact"
              className="rounded-full border border-[var(--color-border-hairline)] bg-[var(--color-surface-hover-a)] px-10 py-4 text-sm font-bold text-[var(--color-mist)] transition hover:bg-[var(--color-surface-hover-b)]"
            >
              {content.ctaSecondaryButton}
            </Link>
          </>
        ) : (
          <>
            <span className="rounded-full bg-[var(--color-ice)] px-10 py-4 text-sm font-bold text-[var(--color-ice-ink)]">
              {content.ctaPrimaryButton}
            </span>
            <span className="rounded-full border border-[var(--color-border-hairline)] bg-[var(--color-surface-hover-a)] px-10 py-4 text-sm font-bold text-[var(--color-mist)]">
              {content.ctaSecondaryButton}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
