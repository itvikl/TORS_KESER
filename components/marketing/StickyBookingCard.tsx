"use client";

import { useEffect, useRef, type ReactNode } from "react";

const BOTTOM_GAP_PX = 16;
const DESKTOP_QUERY = "(min-width: 1024px)";

/**
 * Sticky sidebar card that may be taller than the viewport.
 *
 * While the card fits on screen it behaves like plain `position: sticky` at the
 * `top-*` given in className. When it doesn't, its sticky `top` is shifted with
 * every scroll step so the card scrolls along with the page until its bottom
 * edge comes into view (scrolling down) or its top edge does (scrolling up),
 * and then holds there — no inner scrollbar needed.
 */
export default function StickyBookingCard({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const desktop = window.matchMedia(DESKTOP_QUERY);
    // The CSS class's top (header + section nav) is the resting offset when the card's top is in view.
    const restingTop = parseFloat(getComputedStyle(el).top) || 0;
    let top = restingTop;
    let lastScrollY = window.scrollY;

    const apply = (delta: number) => {
      if (!desktop.matches) {
        el.style.top = "";
        return;
      }
      const minTop = Math.min(restingTop, window.innerHeight - el.offsetHeight - BOTTOM_GAP_PX);
      top = Math.min(restingTop, Math.max(minTop, top - delta));
      el.style.top = `${top}px`;
    };

    const onScroll = () => {
      const delta = window.scrollY - lastScrollY;
      lastScrollY = window.scrollY;
      apply(delta);
    };
    const onResize = () => apply(0);

    apply(0);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    desktop.addEventListener("change", onResize);
    const observer = new ResizeObserver(onResize);
    observer.observe(el);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      desktop.removeEventListener("change", onResize);
      observer.disconnect();
      el.style.top = "";
    };
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
