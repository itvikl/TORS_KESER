import Link from "next/link";
import type { SiteContentHome } from "@/lib/types";
import LetterDrop from "@/components/ui/LetterDrop";

/**
 * The hero's text/CTA column only (not the background photo or
 * DestinationSearch) — shared by app/(marketing)/page.tsx and the admin
 * Site Content live preview so both render identical markup. `interactive`
 * is false in the admin preview so the CTAs don't navigate away mid-edit.
 */
export default function HomeHeroContent({
  content,
  interactive = true,
}: {
  content: SiteContentHome;
  interactive?: boolean;
}) {
  return (
    <div className="w-full">
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#7dd3fc]">
        {content.heroEyebrow}
      </p>
      <h1 className="mt-4 font-display text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-7xl">
        <LetterDrop text={content.heroTitleLine1} />
        <LetterDrop
          text={content.heroTitleHighlight}
          className="mt-2 block text-[#7dd3fc] [text-shadow:0_0_15px_rgba(125,211,252,0.3)]"
          startDelayMs={content.heroTitleLine1.replace(/\s/g, "").length * 22}
        />
      </h1>
      <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-[#a0b4c4] sm:text-xl">
        {content.heroSubtitle}
      </p>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
        {interactive ? (
          <>
            <a
              href="#featured-tours"
              className="rounded-full bg-[#7dd3fc] px-7 py-3 text-sm font-bold text-[#001f2e] transition hover:brightness-110 active:scale-95"
            >
              {content.heroPrimaryCta}
            </a>
            <Link
              href="/custom-made-tours"
              className="rounded-full border border-white/35 bg-white/10 px-7 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              {content.heroSecondaryCta}
            </Link>
          </>
        ) : (
          <>
            <span className="rounded-full bg-[#7dd3fc] px-7 py-3 text-sm font-bold text-[#001f2e]">
              {content.heroPrimaryCta}
            </span>
            <span className="rounded-full border border-white/35 bg-white/10 px-7 py-3 text-sm font-semibold text-white">
              {content.heroSecondaryCta}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
