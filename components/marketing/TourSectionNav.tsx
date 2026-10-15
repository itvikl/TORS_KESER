"use client";

import { useEffect, useRef, useState } from "react";
import { smoothScrollTo } from "@/lib/smoothScroll";

export interface TourSectionLink {
  id: string;
  label: string;
  /** Hidden from lg up — e.g. the dates/booking panel, which is already a sticky sidebar on desktop. */
  mobileOnly?: boolean;
}

/** Height of the site's sticky <header>, or 0 where there isn't one (the admin preview iframe). */
function siteHeaderHeight(): number {
  return document.querySelector("body > header, header.sticky")?.getBoundingClientRect().height ?? 0;
}

/**
 * Sticky in-page section tabs for the tour page. Sits directly under the
 * site header (measured at runtime, so it also works in the admin preview
 * iframe where there is no header) and highlights whichever section is
 * currently under it.
 */
export default function TourSectionNav({ sections }: { sections: TourSectionLink[] }) {
  const [top, setTop] = useState(0);
  const [activeId, setActiveId] = useState(sections[0]?.id);
  const navRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const measure = () => setTop(siteHeaderHeight());
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    let frame = 0;
    function update() {
      frame = 0;
      const offset = siteHeaderHeight() + (navRef.current?.offsetHeight ?? 0) + 24;
      let current = sections[0]?.id;
      for (const section of sections) {
        const el = document.getElementById(section.id);
        // Skip sections hidden at this breakpoint (offsetParent is null for display:none).
        if (!el || el.offsetParent === null) continue;
        if (el.getBoundingClientRect().top - offset <= 0) current = section.id;
      }
      setActiveId(current);
    }
    function onScroll() {
      if (!frame) frame = requestAnimationFrame(update);
    }
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [sections]);

  // Keep the active tab visible when the strip scrolls horizontally on mobile.
  useEffect(() => {
    const list = listRef.current;
    const button = list?.querySelector<HTMLElement>(`[data-section="${activeId}"]`);
    if (!list || !button) return;
    const left = button.offsetLeft - list.clientWidth / 2 + button.offsetWidth / 2;
    list.scrollTo({ left, behavior: "smooth" });
  }, [activeId]);

  function goTo(id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    const offset = siteHeaderHeight() + (navRef.current?.offsetHeight ?? 0) + 16;
    smoothScrollTo(el.getBoundingClientRect().top + window.scrollY - offset);
  }

  return (
    <nav
      ref={navRef}
      aria-label="Tour sections"
      style={{ top }}
      className="sticky z-40 border-b border-[var(--color-border-hairline)] bg-[var(--color-surface-elevated)] backdrop-blur-xl supports-[backdrop-filter]:bg-[var(--color-surface-elevated-hover)]"
    >
      <ul
        ref={listRef}
        className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 py-2 [scrollbar-width:none] sm:px-6 lg:px-8 [&::-webkit-scrollbar]:hidden"
      >
        {sections.map((section) => {
          const active = section.id === activeId;
          return (
            <li key={section.id} className={section.mobileOnly ? "lg:hidden" : undefined}>
              <button
                type="button"
                data-section={section.id}
                aria-current={active ? "location" : undefined}
                onClick={() => goTo(section.id)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  active
                    ? "bg-[var(--color-ice)]/15 text-[var(--color-ice)]"
                    : "text-[var(--color-slate)] hover:text-[var(--color-mist)]"
                }`}
              >
                {section.label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
