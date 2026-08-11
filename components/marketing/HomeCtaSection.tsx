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
    <div className="mx-auto max-w-5xl rounded-[3rem] border border-[rgba(125,211,252,0.1)] bg-[rgba(15,21,36,0.6)] p-10 text-center shadow-2xl backdrop-blur-lg md:p-20">
      <h2 className="font-display text-3xl font-bold text-[#e0e8f0] sm:text-4xl md:text-5xl">
        {content.ctaHeading} <span className="text-[#7dd3fc]">{content.ctaHeadingHighlight}</span>
      </h2>
      <p className="mx-auto mt-8 max-w-2xl text-xl leading-8 text-[#a0b4c4]">{content.ctaBody}</p>
      <div className="mt-12 flex flex-col justify-center gap-4 sm:flex-row">
        {interactive ? (
          <>
            <Link
              href="/custom-made-tours"
              className="rounded-full bg-[#7dd3fc] px-10 py-4 text-sm font-bold text-[#001f2e] transition hover:brightness-110 active:scale-95"
            >
              {content.ctaPrimaryButton}
            </Link>
            <Link
              href="/contact"
              className="rounded-full border border-white/10 bg-white/5 px-10 py-4 text-sm font-bold text-[#e0e8f0] transition hover:bg-white/10"
            >
              {content.ctaSecondaryButton}
            </Link>
          </>
        ) : (
          <>
            <span className="rounded-full bg-[#7dd3fc] px-10 py-4 text-sm font-bold text-[#001f2e]">
              {content.ctaPrimaryButton}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-10 py-4 text-sm font-bold text-[#e0e8f0]">
              {content.ctaSecondaryButton}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
