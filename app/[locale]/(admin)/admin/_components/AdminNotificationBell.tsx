"use client";

import {useEffect, useMemo, useRef, useState} from "react";
import Link from "next/link";
import {Bell} from "lucide-react";
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
  return Array.from(next.values()).slice(0, MAX_PREVIEW_ITEMS);
}

export function AdminNotificationBell({label}: AdminNotificationBellProps) {
  const t = useTranslations("adminNotifications");
  const locale = useLocale();
  const [unreadCount, setUnreadCount] = useState(0);
  const [items, setItems] = useState<AdminNotificationRecord[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const previousUnreadRef = useRef(0);

  useEffect(() => {
    let active = true;

    adminNotificationsService
      .list({pageSize: MAX_PREVIEW_ITEMS})
      .then((response) => {
        if (!active) return;
        setItems(response.results);
        setUnreadCount(response.unread_count);
        previousUnreadRef.current = response.unread_count;
      })
      .catch(() => {
        if (!active) return;
        setItems([]);
        setUnreadCount(0);
      });

    return () => {
      active = false;
    };
  }, []);

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

  return (
    <Button
      asChild
      variant="ghost"
      size="icon"
      className={cn(
        "relative size-9 rounded-xl text-muted-foreground hover:bg-muted/60 hover:text-foreground",
        isAnimating ? "admin-notification-pop text-foreground" : ""
      )}
      aria-label={label ?? t("bellLabel")}
      title={items[0]?.title || undefined}
    >
      <Link href={`/${locale}/admin/notifications`}>
        <Bell className={cn("size-4.5", isAnimating ? "admin-notification-bell" : "")} />
        {unreadCount > 0 ? (
          <>
            <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-rose-500 ring-2 ring-background" />
            <span className="absolute -top-1 -right-1 min-w-4 rounded-full bg-rose-500 px-1 text-[10px] leading-4 font-bold text-white shadow-sm">
              {unreadLabel}
            </span>
          </>
        ) : null}
      </Link>
    </Button>
  );
}
