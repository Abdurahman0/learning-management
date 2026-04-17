import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type LeaveConfirmState = {
  open: boolean;
  title: string;
  description: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onCancel: () => void;
};

type UseLeaveConfirmOptions = {
  enabled: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
};

type PendingAction =
  | { kind: "link"; href: string }
  | { kind: "back" }
  | null;

function isModifiedClick(event: MouseEvent) {
  return Boolean(event.metaKey || event.ctrlKey || event.shiftKey || event.altKey);
}

function isSamePageUrl(next: URL, current: URL) {
  return next.pathname === current.pathname && next.search === current.search && next.hash === current.hash;
}

export function useLeaveConfirm({
  enabled,
  title = "Leave test?",
  message,
  confirmText = "Quit test",
  cancelText = "Cancel",
}: UseLeaveConfirmOptions) {
  const [open, setOpen] = useState(false);
  const pendingRef = useRef<PendingAction>(null);
  const enabledRef = useRef(enabled);
  const bypassPopRef = useRef(false);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  const requestLeave = useCallback((next: PendingAction) => {
    pendingRef.current = next;
    setOpen(true);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const onDocClick = (event: MouseEvent) => {
      if (!enabledRef.current) return;
      if (open) return;
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (isModifiedClick(event)) return;

      const target = event.target as HTMLElement | null;
      const anchor = target?.closest?.("a") as HTMLAnchorElement | null;
      if (!anchor) return;
      if (anchor.hasAttribute("data-leave-guard-ignore")) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const hrefAttr = anchor.getAttribute("href") ?? "";
      if (!hrefAttr || hrefAttr.startsWith("#") || hrefAttr.toLowerCase().startsWith("javascript:")) {
        return;
      }

      let nextUrl: URL;
      try {
        nextUrl = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }

      const currentUrl = new URL(window.location.href);
      if (isSamePageUrl(nextUrl, currentUrl)) return;

      // Hash-only changes should be allowed.
      if (nextUrl.origin === currentUrl.origin && nextUrl.pathname === currentUrl.pathname && nextUrl.search === currentUrl.search) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      requestLeave({ kind: "link", href: nextUrl.href });
    };

    document.addEventListener("click", onDocClick, true);
    return () => {
      document.removeEventListener("click", onDocClick, true);
    };
  }, [enabled, open, requestLeave]);

  useEffect(() => {
    if (!enabled) return;

    // Create a guard entry so browser back can be intercepted without native confirm().
    try {
      window.history.pushState({ __leave_guard: true }, "", window.location.href);
    } catch {
      // Ignore; popstate guard is best-effort.
    }

    const onPopState = () => {
      if (!enabledRef.current) return;
      if (bypassPopRef.current) {
        bypassPopRef.current = false;
        return;
      }

      // User tried to leave via Back: move them forward again, then show our modal.
      try {
        window.history.go(1);
      } catch {
        // Ignore.
      }
      requestLeave({ kind: "back" });
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [enabled, requestLeave]);

  const onCancel = useCallback(() => {
    pendingRef.current = null;
    setOpen(false);
  }, []);

  const onConfirm = useCallback(() => {
    const pending = pendingRef.current;
    pendingRef.current = null;
    setOpen(false);

    if (!pending) return;

    if (pending.kind === "link") {
      // Use a hard navigation so it works regardless of Next routing context.
      window.location.assign(pending.href);
      return;
    }

    // pending.kind === "back"
    bypassPopRef.current = true;
    // We added a guard entry; leaving requires going back twice.
    window.setTimeout(() => {
      try {
        window.history.go(-2);
      } catch {
        window.history.back();
      }
    }, 0);
  }, []);

  return useMemo<LeaveConfirmState>(
    () => ({
      open,
      title,
      description: message,
      confirmText,
      cancelText,
      onConfirm,
      onCancel,
    }),
    [cancelText, confirmText, message, onCancel, onConfirm, open, title]
  );
}

