"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "theme";

export default function ThemeToggle() {
  const [isLight, setIsLight] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setIsLight(document.documentElement.dataset.theme === "light");
    setMounted(true);
  }, []);

  function toggle() {
    const next = !isLight;
    setIsLight(next);
    document.documentElement.setAttribute("data-theme", next ? "light" : "dark");
    try {
      window.localStorage.setItem(STORAGE_KEY, next ? "light" : "dark");
    } catch {
      // localStorage unavailable (private browsing, etc.) — theme just won't persist
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={mounted ? (isLight ? "Switch to dark mode" : "Switch to light mode") : "Toggle color theme"}
      aria-pressed={mounted ? isLight : undefined}
      className="flex size-9 shrink-0 items-center justify-center rounded-full border border-[var(--color-border-hairline)] bg-[var(--color-surface-hover-a)] text-[var(--color-mist)] transition-colors hover:bg-[var(--color-surface-hover-b)]"
    >
      {mounted && isLight ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-[18px]" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-[18px]" aria-hidden="true">
          <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z" />
        </svg>
      )}
    </button>
  );
}
