"use client";

import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {useRouter} from "next/navigation";
import {Bell, CheckCheck, CheckCircle2, CircleAlert, ExternalLink, Info, Loader2} from "lucide-react";
import {useLocale, useTranslations} from "next-intl";

import {Button} from "@/components/ui/button";
import {adminNotificationsService, type AdminNotificationRecord} from "@/src/services/admin/notifications.service";
import {cn} from "@/lib/utils";

type AdminNotificationBellProps = {
  label?: string;
};

const MAX_PREVIEW_ITEMS = 8;

function mergeNotifications(current: AdminNotificationRecord[], incoming: AdminNotificationRecord[]) {
  const next = new Map<string, AdminNotificationRecord>();
  for (const item of incoming) {
    if (item.id) next.set(item.id, item);
  }
  for (const item of current) {
    if (item.id && !next.has(item.id)) next.set(item.id, item);
  }
  return Array.from(next.values())
    .sort((a, b) => {
      const bTime = new Date(b.createdAt).getTime();
      const aTime = new Date(a.createdAt).getTime();
      return (Number.isFinite(bTime) ? bTime : 0) - (Number.isFinite(aTime) ? aTime : 0);
    })
    .slice(0, MAX_PREVIEW_ITEMS);
}

function normalizeTargetUrl(targetUrl: string, locale: string) {
  const trimmed = targetUrl.trim();
  if (!trimmed || !trimmed.startsWith("/")) return `/${locale}/admin`;
  if (/^\/(en|uz)(\/|$)/.test(trimmed)) return trimmed;
  if (trimmed.startsWith("/admin/feedback/")) return `/${locale}/admin/feedback`;
  if (trimmed.startsWith("/admin/users/")) return `/${locale}/admin/users`;
  if (trimmed.startsWith("/admin")) return `/${locale}${trimmed}`;
  return `/${locale}/admin`;
}

function formatRelativeTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const diffSeconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (diffSeconds < 60) return "just now";
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Intl.DateTimeFormat("en-US", {month: "short", day: "2-digit"}).format(date);
}

function severityStyles(severity: string, isRead: boolean) {
  if (isRead) {
    return {
      item: "bg-card hover:bg-muted/45",
      icon: "border-border/70 bg-muted/60 text-muted-foreground",
      Icon: Bell
    };
  }

  const normalized = severity.toUpperCase();
  if (normalized === "SUCCESS") {
    return {
      item: "bg-emerald-500/8 hover:bg-emerald-500/12",
      icon: "border-emerald-400/25 bg-emerald-500/15 text-emerald-500 dark:text-emerald-300",
      Icon: CheckCircle2
    };
  }
  if (normalized === "WARNING") {
    return {
      item: "bg-amber-500/10 hover:bg-amber-500/15",
      icon: "border-amber-400/25 bg-amber-500/15 text-amber-500 dark:text-amber-300",
      Icon: CircleAlert
    };
  }
  return {
    item: "bg-blue-500/8 hover:bg-blue-500/12",
    icon: "border-blue-400/25 bg-blue-500/15 text-blue-500 dark:text-blue-300",
    Icon: Info
  };
}

export function AdminNotificationBell({label}: AdminNotificationBellProps) {
  const t = useTranslations("adminNotifications");
  const locale = useLocale();
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  const [items, setItems] = useState<AdminNotificationRecord[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const previousUnreadRef = useRef(0);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const loadPreview = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const response = await adminNotificationsService.list({pageSize: MAX_PREVIEW_ITEMS});
      setItems(response.results);
      setUnreadCount(response.unread_count);
      previousUnreadRef.current = response.unread_count;
    } catch (error) {
      setItems([]);
      setUnreadCount(0);
      setErrorMessage(error instanceof Error ? error.message : t("notices.loadFailed.description"));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadPreview();
  }, [loadPreview]);

  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (!rootRef.current?.contains(target)) setIsOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    let closed = false;
    let retryTimer: number | null = null;
    let retryDelay = 1500;
    const abortController = new AbortController();

    const connect = async () => {
      try {
        await adminNotificationsService.connectStream({
          signal: abortController.signal,
          onUnreadCount: (count) => {
            setUnreadCount(count);
            if (count > previousUnreadRef.current) {
              setIsAnimating(true);
              window.setTimeout(() => setIsAnimating(false), 950);
            }
            previousUnreadRef.current = count;
          },
          onNotifications: (incoming) => {
            setItems((current) => mergeNotifications(current, incoming));
            if (incoming.some((item) => !item.isRead)) {
              setIsAnimating(true);
              window.setTimeout(() => setIsAnimating(false), 950);
            }
          }
        });
      } catch {
        // Reconnect below unless this was an intentional abort.
      }

      if (!closed && !abortController.signal.aborted) {
        retryTimer = window.setTimeout(() => {
          retryDelay = Math.min(retryDelay * 1.7, 15000);
          void connect();
        }, retryDelay);
      }
    };

    void connect();

    return () => {
      closed = true;
      abortController.abort();
      if (retryTimer) window.clearTimeout(retryTimer);
    };
  }, []);

  const unreadLabel = useMemo(() => {
    if (unreadCount <= 0) return "";
    if (unreadCount > 99) return "99+";
    return String(unreadCount);
  }, [unreadCount]);

  const handleMarkRead = async (item: AdminNotificationRecord) => {
    if (item.isRead || busyId) return;
    setBusyId(item.id);
    setItems((current) => current.map((row) => (row.id === item.id ? {...row, isRead: true} : row)));
    setUnreadCount((current) => Math.max(0, current - 1));

    try {
      await adminNotificationsService.markRead(item.id);
    } catch (error) {
      setItems((current) => current.map((row) => (row.id === item.id ? {...row, isRead: false} : row)));
      setUnreadCount((current) => current + 1);
      setErrorMessage(error instanceof Error ? error.message : t("notices.saveFailed.description"));
    } finally {
      setBusyId(null);
    }
  };

  const handleOpenNotification = async (item: AdminNotificationRecord) => {
    if (!item.isRead) await handleMarkRead(item);
    setIsOpen(false);
    router.push(normalizeTargetUrl(item.targetUrl, locale));
  };

  const handleMarkAllRead = async () => {
    if (unreadCount <= 0) return;
    const previousItems = items;
    const previousUnread = unreadCount;
    setItems((current) => current.map((item) => ({...item, isRead: true})));
    setUnreadCount(0);

    try {
      await adminNotificationsService.markAllRead();
    } catch (error) {
      setItems(previousItems);
      setUnreadCount(previousUnread);
      setErrorMessage(error instanceof Error ? error.message : t("notices.saveFailed.description"));
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(
          "relative size-9 rounded-xl text-muted-foreground hover:bg-muted/60 hover:text-foreground",
          isAnimating ? "admin-notification-pop text-foreground" : ""
        )}
        aria-label={label ?? t("bellLabel")}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        title={items[0]?.title || undefined}
        onClick={() => {
          setIsOpen((current) => !current);
          if (!isOpen) void loadPreview();
        }}
      >
        <Bell className={cn("size-4.5", isAnimating ? "admin-notification-bell" : "")} />
        {unreadCount > 0 ? (
          <>
            <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-rose-500 ring-2 ring-background" />
            <span className="absolute -top-1 -right-1 min-w-4 rounded-full bg-rose-500 px-1 text-[10px] leading-4 font-bold text-white shadow-sm">
              {unreadLabel}
            </span>
          </>
        ) : null}
      </Button>

      {isOpen ? (
        <div
          role="dialog"
          aria-label={t("title")}
          className="absolute top-12 right-0 z-50 w-[min(92vw,420px)] overflow-hidden rounded-3xl border border-border/80 bg-popover text-popover-foreground shadow-2xl shadow-black/20 ring-1 ring-black/5 dark:shadow-black/45"
        >
          <div className="border-b border-border/70 bg-gradient-to-br from-blue-500/10 via-background to-cyan-500/8 px-4 py-4 sm:px-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-base font-bold tracking-tight text-foreground">{t("title")}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {unreadCount > 0 ? t("filters.unread") : t("notices.allRead.title")}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 rounded-xl px-2.5 text-xs font-semibold text-blue-600 hover:bg-blue-500/10 hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-200"
                disabled={unreadCount <= 0}
                onClick={() => void handleMarkAllRead()}
              >
                <CheckCheck className="size-3.5" aria-hidden="true" />
                {t("markAllRead")}
              </Button>
            </div>
          </div>

          {errorMessage ? (
            <div className="border-b border-rose-500/20 bg-rose-500/10 px-4 py-2 text-xs text-rose-600 dark:text-rose-300">{errorMessage}</div>
          ) : null}

          <div className="max-h-[520px] overflow-y-auto p-2 [scrollbar-color:hsl(var(--primary)/0.45)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border-2 [&::-webkit-scrollbar-thumb]:border-transparent [&::-webkit-scrollbar-thumb]:bg-blue-500/35 [&::-webkit-scrollbar-thumb]:bg-clip-padding hover:[&::-webkit-scrollbar-thumb]:bg-blue-500/55">
            {isLoading ? (
              <div className="flex min-h-40 items-center justify-center text-sm text-muted-foreground">
                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
                {t("refresh")}
              </div>
            ) : items.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/80 bg-muted/25 p-6 text-center text-sm text-muted-foreground">
                {t("empty")}
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((item) => {
                  const styles = severityStyles(item.severity, item.isRead);
                  const Icon = styles.Icon;
                  return (
                    <article
                      key={item.id}
                      className={cn("rounded-2xl border border-transparent p-3 transition-colors", styles.item, !item.isRead ? "border-border/50" : "")}
                    >
                      <div className="flex gap-3">
                        <div className={cn("mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-2xl border", styles.icon)}>
                          <Icon className="size-4.5" aria-hidden="true" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="truncate text-sm font-bold text-foreground">{item.title || t("fallbackTitle")}</h3>
                                {!item.isRead ? <span className="size-1.5 rounded-full bg-rose-500" aria-label={t("unread")} /> : null}
                              </div>
                              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{item.message || t("emptyMessage")}</p>
                            </div>
                            <time className="shrink-0 text-[11px] font-medium text-muted-foreground">{formatRelativeTime(item.createdAt)}</time>
                          </div>

                          <div className="mt-3 flex items-center justify-between gap-2">
                            {!item.isRead ? (
                              <button
                                type="button"
                                className="text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
                                disabled={busyId === item.id}
                                onClick={() => void handleMarkRead(item)}
                              >
                                {busyId === item.id ? t("markRead") : t("markRead")}
                              </button>
                            ) : (
                              <span className="text-xs text-muted-foreground">{t("stats.read")}</span>
                            )}
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-200"
                              onClick={() => void handleOpenNotification(item)}
                            >
                              {t("open")}
                              <ExternalLink className="size-3" aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
