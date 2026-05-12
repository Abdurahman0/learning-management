"use client";

import {useEffect, useMemo, useState} from "react";
import {useRouter} from "next/navigation";
import {Loader2} from "lucide-react";
import {useLocale, useTranslations} from "next-intl";

import {Button} from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card";
import {SiteToast, type SiteToastNotice} from "@/components/ui/site-toast";
import {adminNotificationsService, type AdminNotificationRecord} from "@/src/services/admin/notifications.service";
import {cn} from "@/lib/utils";

import {AdminSidebar} from "../../_components/AdminSidebar";
import {AdminTopbar} from "../../_components/AdminTopbar";
import {AdminNotificationCard} from "./AdminNotificationCard";

type FilterMode = "all" | "unread";

function normalizeTargetUrl(targetUrl: string, locale: string) {
  const trimmed = targetUrl.trim();
  if (!trimmed || !trimmed.startsWith("/")) return `/${locale}/admin/notifications`;
  if (/^\/(en|uz)(\/|$)/.test(trimmed)) return trimmed;
  if (trimmed.startsWith("/admin/feedback/")) return `/${locale}/admin/feedback`;
  if (trimmed.startsWith("/admin/users/")) return `/${locale}/admin/users`;
  if (trimmed.startsWith("/admin")) return `/${locale}${trimmed}`;
  return `/${locale}/admin/notifications`;
}

function mergeNotifications(current: AdminNotificationRecord[], incoming: AdminNotificationRecord[]) {
  const next = new Map(current.map((item) => [item.id, item]));
  for (const item of incoming) {
    if (!item.id) continue;
    next.set(item.id, item);
  }
  return Array.from(next.values()).sort((a, b) => {
    const bTime = new Date(b.createdAt).getTime();
    const aTime = new Date(a.createdAt).getTime();
    return (Number.isFinite(bTime) ? bTime : 0) - (Number.isFinite(aTime) ? aTime : 0);
  });
}

export function AdminNotificationsPageClient() {
  const t = useTranslations("adminNotifications");
  const locale = useLocale();
  const router = useRouter();
  const [items, setItems] = useState<AdminNotificationRecord[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterMode>("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<SiteToastNotice | null>(null);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const response = await adminNotificationsService.list();
      setItems(response.results);
      setUnreadCount(response.unread_count);
    } catch (error) {
      setItems([]);
      setUnreadCount(0);
      setNotice({
        title: t("notices.loadFailed.title"),
        description: error instanceof Error ? error.message : t("notices.loadFailed.description"),
        tone: "error"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 3000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    let closed = false;
    let retryTimer: number | null = null;
    let retryDelay = 1500;
    const abortController = new AbortController();

    const connect = async () => {
      try {
        await adminNotificationsService.connectStream({
          signal: abortController.signal,
          onUnreadCount: setUnreadCount,
          onNotifications: (incoming) => setItems((current) => mergeNotifications(current, incoming))
        });
      } catch {
        // Retry below.
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

  const visibleItems = useMemo(() => (filter === "unread" ? items.filter((item) => !item.isRead) : items), [filter, items]);

  const markRead = async (item: AdminNotificationRecord) => {
    if (item.isRead || busyId) return;
    setBusyId(item.id);
    setItems((current) => current.map((row) => (row.id === item.id ? {...row, isRead: true} : row)));
    setUnreadCount((current) => Math.max(0, current - 1));

    try {
      await adminNotificationsService.markRead(item.id);
    } catch (error) {
      setItems((current) => current.map((row) => (row.id === item.id ? {...row, isRead: false} : row)));
      setUnreadCount((current) => current + 1);
      setNotice({
        title: t("notices.saveFailed.title"),
        description: error instanceof Error ? error.message : t("notices.saveFailed.description"),
        tone: "error"
      });
    } finally {
      setBusyId(null);
    }
  };

  const openNotification = async (item: AdminNotificationRecord) => {
    if (!item.isRead) {
      await markRead(item);
    }
    router.push(normalizeTargetUrl(item.targetUrl, locale));
  };

  const markAllRead = async () => {
    if (unreadCount <= 0) return;
    const previous = items;
    const previousUnread = unreadCount;
    setItems((current) => current.map((item) => ({...item, isRead: true})));
    setUnreadCount(0);

    try {
      await adminNotificationsService.markAllRead();
      setNotice({title: t("notices.allRead.title"), description: t("notices.allRead.description"), tone: "success"});
    } catch (error) {
      setItems(previous);
      setUnreadCount(previousUnread);
      setNotice({
        title: t("notices.saveFailed.title"),
        description: error instanceof Error ? error.message : t("notices.saveFailed.description"),
        tone: "error"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteToast notice={notice} />
      <div className="flex min-h-screen">
        <AdminSidebar />

        <main className="min-w-0 flex-1">
          <AdminTopbar
            title={t("title")}
            actions={
              <>
                <Button variant="outline" className="rounded-xl" onClick={() => void loadNotifications()} disabled={isLoading}>
                  {isLoading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
                  {t("refresh")}
                </Button>
                <Button className="rounded-xl" onClick={() => void markAllRead()} disabled={unreadCount <= 0}>
                  {t("markAllRead")}
                </Button>
              </>
            }
          />

          <div className="mx-auto max-w-[1100px] space-y-5 px-4 py-5 sm:px-6 lg:px-8">
            <div className="flex rounded-2xl border border-border/70 bg-card/70 p-1">
              {(["all", "unread"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  className={cn(
                    "rounded-xl px-4 py-2 text-sm font-semibold transition-colors",
                    filter === option ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => setFilter(option)}
                >
                  {t(`filters.${option}`)}
                </button>
              ))}
            </div>

            <section className="space-y-3">
              {isLoading ? (
                Array.from({length: 4}).map((_, index) => (
                  <div key={index} className="h-36 animate-pulse rounded-2xl border border-border bg-muted/35" />
                ))
              ) : visibleItems.length === 0 ? (
                <Card className="rounded-2xl border-dashed border-border/80 bg-card/70">
                  <CardContent className="p-8 text-center text-sm text-muted-foreground">{t("empty")}</CardContent>
                </Card>
              ) : (
                visibleItems.map((item) => (
                  <AdminNotificationCard
                    key={item.id}
                    item={item}
                    isBusy={busyId === item.id}
                    onOpen={(notification) => void openNotification(notification)}
                    onMarkRead={(notification) => void markRead(notification)}
                  />
                ))
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
