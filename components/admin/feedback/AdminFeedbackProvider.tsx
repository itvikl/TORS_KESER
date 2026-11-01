"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";

/**
 * Admin-only feedback layer: toast notifications, a styled confirm dialog, and the
 * unsaved-changes guard (link clicks, browser back, reload/close). Mounted once in
 * AdminShell, so toasts survive client-side navigation (e.g. "save → go to list").
 */

type ToastKind = "success" | "error" | "info" | "warning";

type Toast = {
  id: number;
  kind: ToastKind;
  title: string;
  description?: string;
  duration: number;
};

type ToastInput = string | { title: string; description?: string; duration?: number };

type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "default";
};

type ToastApi = Record<ToastKind, (input: ToastInput) => void>;

type NavigateOptions = {
  replace?: boolean;
  /** For navigation right after a successful save — the draft is persisted, so don't ask. */
  skipConfirm?: boolean;
};

type FeedbackContextValue = {
  toast: ToastApi;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  setDirty: (id: string, dirty: boolean) => void;
  /** Navigates to `href`, asking first when a form on the page has unsaved changes. */
  navigate: (href: string, opts?: NavigateOptions) => Promise<boolean>;
  /** Resolves true when there's nothing unsaved, or the user agrees to discard it. */
  confirmDiscard: () => Promise<boolean>;
};

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

const GUARD_KEY = "__adminUnsavedGuard";

const LEAVE_DIALOG: ConfirmOptions = {
  title: "Unsaved changes",
  description: "You have changes that haven't been saved. If you leave now, they will be lost.",
  confirmLabel: "Leave without saving",
  cancelLabel: "Stay on page",
  tone: "danger",
};

function isGuardEntry(state: unknown) {
  return !!(state && typeof state === "object" && (state as Record<string, unknown>)[GUARD_KEY]);
}

export default function AdminFeedbackProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  // ---------- toasts ----------
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((kind: ToastKind, input: ToastInput) => {
    const base = typeof input === "string" ? { title: input } : input;
    const toast: Toast = {
      id: nextId.current++,
      kind,
      title: base.title,
      description: base.description,
      duration: base.duration ?? (kind === "error" ? 7000 : 4000),
    };
    setToasts((list) => [...list.slice(-3), toast]);
  }, []);

  const toast = useMemo<ToastApi>(
    () => ({
      success: (i) => push("success", i),
      error: (i) => push("error", i),
      info: (i) => push("info", i),
      warning: (i) => push("warning", i),
    }),
    [push]
  );

  // ---------- confirm dialog ----------
  const [dialog, setDialog] = useState<(ConfirmOptions & { resolve: (ok: boolean) => void }) | null>(null);

  const confirm = useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        setDialog((current) => {
          current?.resolve(false);
          return { ...options, resolve };
        });
      }),
    []
  );

  const closeDialog = useCallback((ok: boolean) => {
    setDialog((current) => {
      current?.resolve(ok);
      return null;
    });
  }, []);

  // ---------- unsaved-changes guard ----------
  const dirtyIds = useRef(new Set<string>());
  const [anyDirty, setAnyDirty] = useState(false);
  /** Whether the history entry we're on right now is our guard entry (tracked because popstate only exposes the *new* state). */
  const onGuardEntry = useRef(false);
  const leaving = useRef(false);

  const setDirty = useCallback((id: string, dirty: boolean) => {
    if (dirty) dirtyIds.current.add(id);
    else dirtyIds.current.delete(id);
    setAnyDirty(dirtyIds.current.size > 0);
  }, []);

  const isDirty = () => dirtyIds.current.size > 0 && !leaving.current;

  // Every route change resets the "leaving" bypass and re-reads which entry we're on.
  useEffect(() => {
    leaving.current = false;
    onGuardEntry.current = isGuardEntry(window.history.state);
  }, [pathname]);

  // While dirty, sit on an extra same-URL history entry so the browser Back button pops
  // it (instead of leaving the page) and we get a chance to ask.
  useEffect(() => {
    if (anyDirty && !onGuardEntry.current) {
      window.history.pushState({ [GUARD_KEY]: true }, "");
      onGuardEntry.current = true;
    }
  }, [anyDirty]);

  const navigate = useCallback(
    async (href: string, opts?: NavigateOptions) => {
      if (!opts?.skipConfirm && isDirty()) {
        const ok = await confirm(LEAVE_DIALOG);
        if (!ok) return false;
      }
      leaving.current = true;
      // Leaving from our guard entry: overwrite it so it doesn't linger as a duplicate in history.
      if (opts?.replace || onGuardEntry.current) router.replace(href);
      else router.push(href);
      return true;
    },
    [confirm, router]
  );

  const confirmDiscard = useCallback(async () => {
    if (!isDirty()) return true;
    const ok = await confirm(LEAVE_DIALOG);
    if (ok) leaving.current = true;
    return ok;
  }, [confirm]);

  useEffect(() => {
    function onPopState(event: PopStateEvent) {
      const leftGuard = onGuardEntry.current;
      onGuardEntry.current = isGuardEntry(event.state);
      if (!leftGuard || onGuardEntry.current) return;

      // We just popped our guard entry and are back on the real entry for this page.
      if (!isDirty()) {
        // Stale guard (form was saved since) — skip over it so Back behaves normally.
        window.history.back();
        return;
      }
      void confirm(LEAVE_DIALOG).then((ok) => {
        if (ok) {
          leaving.current = true;
          window.history.back();
        } else {
          window.history.pushState({ [GUARD_KEY]: true }, "");
          onGuardEntry.current = true;
        }
      });
    }

    function onClick(event: MouseEvent) {
      if (!isDirty() || event.defaultPrevented) return;
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor || anchor.hasAttribute("download")) return;
      if (anchor.target && anchor.target !== "_self") return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;

      event.preventDefault();
      event.stopPropagation();
      void navigate(url.pathname + url.search + url.hash);
    }

    function onBeforeUnload(event: BeforeUnloadEvent) {
      if (!isDirty()) return;
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("popstate", onPopState);
    // Capture phase on window runs before Next's <Link> handler (React listens on the root).
    window.addEventListener("click", onClick, true);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("click", onClick, true);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [confirm, navigate]);

  const value = useMemo(
    () => ({ toast, confirm, setDirty, navigate, confirmDiscard }),
    [toast, confirm, setDirty, navigate, confirmDiscard]
  );

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
      {dialog && <ConfirmDialog {...dialog} onClose={closeDialog} />}
    </FeedbackContext.Provider>
  );
}

function useFeedback() {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error("Admin feedback hooks must be used inside <AdminFeedbackProvider>");
  return ctx;
}

export function useToast() {
  return useFeedback().toast;
}

export function useConfirm() {
  return useFeedback().confirm;
}

/**
 * Router navigation that respects the unsaved-changes guard. Use it for Cancel/Back buttons,
 * and with `{ skipConfirm: true }` for the redirect after a successful save.
 */
export function useGuardedNavigate() {
  return useFeedback().navigate;
}

export function useConfirmDiscard() {
  return useFeedback().confirmDiscard;
}

/** Registers this component's dirty state with the unsaved-changes guard. */
export function useUnsavedChanges(isDirty: boolean) {
  const { setDirty } = useFeedback();
  const id = useId();
  useEffect(() => {
    setDirty(id, isDirty);
  }, [id, isDirty, setDirty]);
  useEffect(() => () => setDirty(id, false), [id, setDirty]);
}

/**
 * Tracks whether `draft` differs from its last-saved snapshot and wires it into the guard.
 * Call `markSaved(value)` with what was persisted after a successful save.
 */
export function useDirtyDraft<T>(draft: T) {
  const [baseline, setBaseline] = useState(() => JSON.stringify(draft));
  const isDirty = JSON.stringify(draft) !== baseline;
  useUnsavedChanges(isDirty);
  const markSaved = useCallback((saved: T) => setBaseline(JSON.stringify(saved)), []);
  return { isDirty, markSaved };
}

/**
 * Dirty tracking for uncontrolled `<form>`s (useActionState forms): any input/change
 * event marks it dirty; call `markSaved()` once the server confirms the save.
 */
export function useFormDirty() {
  const [isDirty, setIsDirty] = useState(false);
  useUnsavedChanges(isDirty);
  const formProps = useMemo(
    () => ({ onInput: () => setIsDirty(true), onChange: () => setIsDirty(true) }),
    []
  );
  const markSaved = useCallback(() => setIsDirty(false), []);
  return { isDirty, markSaved, formProps };
}

// ---------- UI ----------

const KIND_STYLES: Record<ToastKind, { accent: string; icon: string; bar: string }> = {
  success: { accent: "bg-olive text-white", icon: "M5 12.5l4.5 4.5L19 7.5", bar: "bg-olive" },
  error: { accent: "bg-terracotta text-white", icon: "M7 7l10 10M17 7L7 17", bar: "bg-terracotta" },
  warning: { accent: "bg-gold text-white", icon: "M12 7v6m0 4h.01", bar: "bg-gold" },
  info: { accent: "bg-navy text-white", icon: "M12 11v6m0-10h.01", bar: "bg-navy" },
};

function ToastViewport({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-0 z-[100] flex flex-col items-center justify-center gap-3 p-4"
    >
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastCard({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
  const [paused, setPaused] = useState(false);
  const [leavingOut, setLeavingOut] = useState(false);
  const remaining = useRef(toast.duration);
  const startedAt = useRef(0);
  const style = KIND_STYLES[toast.kind];

  useEffect(() => {
    if (paused || leavingOut) return;
    startedAt.current = Date.now();
    const timer = setTimeout(() => setLeavingOut(true), remaining.current);
    return () => {
      clearTimeout(timer);
      remaining.current -= Date.now() - startedAt.current;
    };
  }, [paused, leavingOut]);

  useEffect(() => {
    if (!leavingOut) return;
    const timer = setTimeout(() => onDismiss(toast.id), 200);
    return () => clearTimeout(timer);
  }, [leavingOut, onDismiss, toast.id]);

  return (
    <div
      role={toast.kind === "error" ? "alert" : "status"}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className={`admin-toast pointer-events-auto relative w-full overflow-hidden rounded-xl border border-line bg-white shadow-[0_20px_48px_-12px_rgba(36,31,24,0.45)] sm:w-[28rem] ${
        leavingOut ? "admin-toast-out" : ""
      }`}
    >
      <div className="flex items-start gap-3 px-4 py-3.5">
        <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${style.accent}`}>
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d={style.icon} />
          </svg>
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">{toast.title}</p>
          {toast.description && <p className="mt-0.5 text-sm text-ink-muted">{toast.description}</p>}
        </div>
        <button
          type="button"
          onClick={() => setLeavingOut(true)}
          aria-label="Dismiss"
          className="-me-1 rounded-md p-1 text-ink-muted transition-colors hover:bg-sand-warm hover:text-ink"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M7 7l10 10M17 7L7 17" />
          </svg>
        </button>
      </div>
      <span
        className={`admin-toast-progress absolute bottom-0 left-0 h-0.5 ${style.bar}`}
        style={{ animationDuration: `${toast.duration}ms`, animationPlayState: paused ? "paused" : "running" }}
      />
    </div>
  );
}

function ConfirmDialog({
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "default",
  onClose,
}: ConfirmOptions & { onClose: (ok: boolean) => void }) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="admin-dialog-backdrop absolute inset-0 bg-ink/40 backdrop-blur-[2px]" onClick={() => onClose(false)} />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="admin-confirm-title"
        className="admin-dialog relative w-full max-w-md rounded-2xl border border-line bg-white p-6 shadow-2xl"
      >
        <div className="flex items-start gap-4">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
              tone === "danger" ? "bg-terracotta/10 text-terracotta-dark" : "bg-navy/10 text-navy"
            }`}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 9v4m0 4h.01M10.3 3.9L2.4 17.6A2 2 0 004.1 20.6h15.8a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" />
            </svg>
          </span>
          <div>
            <h2 id="admin-confirm-title" className="text-base font-semibold text-ink">
              {title}
            </h2>
            {description && <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{description}</p>}
          </div>
        </div>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            ref={cancelRef}
            type="button"
            onClick={() => onClose(false)}
            className="rounded-lg border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-sand-warm"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => onClose(true)}
            className={`rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors ${
              tone === "danger" ? "bg-terracotta hover:bg-terracotta-dark" : "bg-navy hover:bg-navy-light"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
