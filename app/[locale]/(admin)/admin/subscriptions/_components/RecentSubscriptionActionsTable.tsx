"use client";

import {ArrowRight} from "lucide-react";
import {useTranslations} from "next-intl";

import {Avatar, AvatarFallback} from "@/components/ui/avatar";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import type {SubscriptionAction} from "@/data/admin-subscriptions";

type RecentSubscriptionActionsTableProps = {
  rows: SubscriptionAction[];
  onExportCsv: () => void;
};

const statusClassName: Record<SubscriptionAction["status"], string> = {
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  pending: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  closed: "border-slate-500/30 bg-slate-500/10 text-slate-300"
};

function formatDate(dateString: string, t: (key: string, values?: Record<string, string | number>) => string) {
  const [year, monthStr, dayStr] = dateString.split("-");
  const monthIndex = Number(monthStr) - 1;
  const monthKeys = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"] as const;
  const month = monthKeys[monthIndex] ?? "jan";

  return `${t(`dates.months.${month}`)} ${Number(dayStr || "1")}, ${year}`;
}

export function RecentSubscriptionActionsTable({rows, onExportCsv}: RecentSubscriptionActionsTableProps) {
  const t = useTranslations("adminSubscriptions");

  return (
    <Card className="rounded-3xl border-border/70 bg-card/75 py-0">
      <CardHeader className="flex flex-row items-center justify-between gap-3 pt-5 pb-2">
        <CardTitle className="text-3xl font-semibold tracking-tight">{t("recentActions.title")}</CardTitle>
        <Button type="button" variant="link" className="h-8 px-0 text-base text-primary" onClick={onExportCsv}>
          {t("downloadCsv")}
        </Button>
      </CardHeader>

      <CardContent className="pt-1 pb-5">
        <div className="overflow-x-auto">
          <Table className="min-w-[760px]">
            <TableHeader>
              <TableRow>
                <TableHead>{t("recentActions.columns.user")}</TableHead>
                <TableHead>{t("recentActions.columns.action")}</TableHead>
                <TableHead>{t("recentActions.columns.date")}</TableHead>
                <TableHead>{t("recentActions.columns.status")}</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {rows.length ? (
                rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="ring-2 ring-border/70" size="lg">
                          <AvatarFallback className="bg-primary/15 text-primary">{row.avatarFallback}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-[20px] leading-tight font-semibold tracking-tight">{row.userName}</p>
                          <p className="text-sm text-muted-foreground">{row.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-[20px] font-semibold tracking-tight">
                        <span className="text-muted-foreground">{row.fromPlan}</span>
                        <ArrowRight className="size-4 text-muted-foreground" />
                        <span>{row.toPlan}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-lg text-muted-foreground">{formatDate(row.date, t)}</TableCell>
                    <TableCell>
                      <Badge className={`border px-2.5 py-0.5 text-[10px] tracking-wide uppercase ${statusClassName[row.status]}`}>
                        {t(`status.${row.status}`)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                    {t("recentActions.empty")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

