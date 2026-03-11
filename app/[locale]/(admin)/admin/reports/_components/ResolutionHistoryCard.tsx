"use client";

import {useTranslations} from "next-intl";

import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import type {ResolutionHistoryItem} from "@/data/admin-reports";

type ResolutionHistoryCardProps = {
  items: ResolutionHistoryItem[];
};

const actionDotClassName = {
  created: "bg-blue-400",
  resolved: "bg-emerald-400",
  reassigned: "bg-amber-400",
  rejected: "bg-rose-400",
  commented: "bg-violet-400"
} as const;

function formatTimestamp(value: string) {
  const date = new Date(value);
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  const hh = String(date.getUTCHours()).padStart(2, "0");
  const mm = String(date.getUTCMinutes()).padStart(2, "0");
  return `${y}-${m}-${d} ${hh}:${mm}`;
}

export function ResolutionHistoryCard({items}: ResolutionHistoryCardProps) {
  const t = useTranslations("adminReports");

  return (
    <Card className="rounded-2xl border-border/70 bg-card/70 py-0">
      <CardHeader className="px-5 py-4">
        <CardTitle className="text-lg font-semibold tracking-tight">{t("resolutionHistory")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 px-5 pb-5">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("table.empty")}</p>
        ) : (
          items.slice(0, 8).map((item) => (
            <div key={item.id} className="flex items-start gap-3 rounded-xl border border-border/70 bg-background/45 px-3 py-3">
              <span className={`mt-1.5 inline-flex size-2.5 shrink-0 rounded-full ${actionDotClassName[item.actionType]}`} />
              <div className="min-w-0 space-y-0.5">
                <p className="text-xs text-muted-foreground">{formatTimestamp(item.createdAt)}</p>
                <p className="text-sm font-medium">
                  {item.actor} • {t(`historyAction.${item.actionType}`)}
                  {item.reportCode ? ` ${item.reportCode}` : ""}
                </p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
