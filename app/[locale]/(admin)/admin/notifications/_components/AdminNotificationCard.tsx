"use client";

import {BellRing, CheckCircle2, CircleAlert, Info} from "lucide-react";
import {useTranslations} from "next-intl";

import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card";
import {cn} from "@/lib/utils";
import type {AdminNotificationRecord} from "@/src/services/admin/notifications.service";

type AdminNotificationCardProps = {
  item: AdminNotificationRecord;
  onOpen: (item: AdminNotificationRecord) => void;
  onMarkRead: (item: AdminNotificationRecord) => void;
  isBusy?: boolean;
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || "-";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function severityStyles(severity: string) {
  const normalized = severity.toUpperCase();
  if (normalized === "SUCCESS") {
    return {
      card: "border-emerald-400/30 bg-emerald-500/7",
      icon: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-300",
      badge: "border-emerald-400/35 bg-emerald-500/12 text-emerald-600 dark:text-emerald-300",
      Icon: CheckCircle2
    };
  }
  if (normalized === "WARNING") {
    return {
      card: "border-amber-400/30 bg-amber-500/7",
      icon: "bg-amber-500/12 text-amber-600 dark:text-amber-300",
      badge: "border-amber-400/35 bg-amber-500/12 text-amber-600 dark:text-amber-300",
      Icon: CircleAlert
    };
  }
  return {
    card: "border-blue-400/30 bg-blue-500/7",
    icon: "bg-blue-500/12 text-blue-600 dark:text-blue-300",
    badge: "border-blue-400/35 bg-blue-500/12 text-blue-600 dark:text-blue-300",
    Icon: Info
  };
}

export function AdminNotificationCard({item, onOpen, onMarkRead, isBusy}: AdminNotificationCardProps) {
  const t = useTranslations("adminNotifications");
  const styles = severityStyles(item.severity);
  const Icon = styles.Icon;

  return (
    <Card
      className={cn(
        "overflow-hidden rounded-2xl border py-0 shadow-sm transition-colors",
        item.isRead ? "border-border/70 bg-card/70" : styles.card
      )}
    >
      <CardContent className="p-4 sm:p-5">
        <div className="flex gap-4">
          <div className={cn("flex size-11 shrink-0 items-center justify-center rounded-2xl", styles.icon)}>
            {item.isRead ? <BellRing className="size-5" aria-hidden="true" /> : <Icon className="size-5" aria-hidden="true" />}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-semibold tracking-tight text-foreground">{item.title || t("fallbackTitle")}</h2>
                  {!item.isRead ? <span className="size-2 rounded-full bg-rose-500" aria-label={t("unread")} /> : null}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{formatDate(item.createdAt)}</p>
              </div>

              <Badge className={cn("border px-2.5 py-0.5 text-[10px] tracking-wide uppercase", styles.badge)}>
                {item.severity || "INFO"}
              </Badge>
            </div>

            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.message || t("emptyMessage")}</p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button type="button" className="h-9 rounded-xl px-4" onClick={() => onOpen(item)}>
                {t("open")}
              </Button>
              {!item.isRead ? (
                <Button type="button" variant="outline" className="h-9 rounded-xl px-4" disabled={isBusy} onClick={() => onMarkRead(item)}>
                  {t("markRead")}
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
