"use client";

import {AlertCircle, Clock3} from "lucide-react";
import {useTranslations} from "next-intl";

import {Badge} from "@/components/ui/badge";
import {Card, CardContent} from "@/components/ui/card";
import type {AdminReport} from "@/data/admin-reports";
import {cn} from "@/lib/utils";

type ReportsTableProps = {
  reports: AdminReport[];
  selectedReportId: string | null;
  totalReports: number;
  onSelectReport: (reportId: string) => void;
};

const statusClassName = {
  open: "border-blue-500/35 bg-blue-500/14 text-blue-300",
  in_review: "border-amber-500/35 bg-amber-500/14 text-amber-300",
  resolved: "border-emerald-500/35 bg-emerald-500/14 text-emerald-300",
  rejected: "border-rose-500/35 bg-rose-500/14 text-rose-300"
} as const;

const severityClassName = {
  low: "border-slate-500/35 bg-slate-500/14 text-slate-300",
  medium: "border-violet-500/35 bg-violet-500/14 text-violet-300",
  urgent: "border-rose-500/35 bg-rose-500/14 text-rose-300"
} as const;

const moduleClassName = {
  reading: "border-blue-500/30 bg-blue-500/12 text-blue-300",
  listening: "border-amber-500/30 bg-amber-500/12 text-amber-300",
  writing: "border-emerald-500/30 bg-emerald-500/12 text-emerald-300",
  speaking: "border-fuchsia-500/30 bg-fuchsia-500/12 text-fuchsia-300"
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

export function ReportsTable({reports, selectedReportId, totalReports, onSelectReport}: ReportsTableProps) {
  const t = useTranslations("adminReports");

  return (
    <Card className="overflow-hidden rounded-2xl border-border/70 bg-card/70 py-0">
      <CardContent className="p-0">
        <div className="hidden grid-cols-[140px_minmax(0,2fr)_minmax(0,1.2fr)_120px_130px_160px] gap-3 border-b border-border/70 px-5 py-3 md:grid">
          <p className="text-[11px] font-medium tracking-[0.11em] text-muted-foreground uppercase">{t("table.columns.id")}</p>
          <p className="text-[11px] font-medium tracking-[0.11em] text-muted-foreground uppercase">{t("table.columns.questionPreview")}</p>
          <p className="text-[11px] font-medium tracking-[0.11em] text-muted-foreground uppercase">{t("table.columns.testName")}</p>
          <p className="text-[11px] font-medium tracking-[0.11em] text-muted-foreground uppercase">{t("table.columns.module")}</p>
          <p className="text-[11px] font-medium tracking-[0.11em] text-muted-foreground uppercase">{t("table.columns.status")}</p>
          <p className="text-[11px] font-medium tracking-[0.11em] text-muted-foreground uppercase">{t("table.columns.updatedAt")}</p>
        </div>

        <div className="divide-y divide-border/70">
          {reports.length === 0 ? (
            <div className="flex items-center gap-2 px-5 py-12 text-sm text-muted-foreground">
              <AlertCircle className="size-4" />
              {t("table.empty")}
            </div>
          ) : (
            reports.map((report) => (
              <button
                key={report.id}
                type="button"
                className={cn(
                  "w-full text-left transition-colors hover:bg-muted/25",
                  selectedReportId === report.id && "bg-primary/[0.08]"
                )}
                onClick={() => onSelectReport(report.id)}
              >
                <div className="space-y-2 px-4 py-4 md:hidden">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold tracking-tight">{report.code}</p>
                    <Badge className={`border px-2 py-0.5 text-[10px] uppercase ${moduleClassName[report.module]}`}>{t(`modules.${report.module}`)}</Badge>
                    <Badge className={`border px-2 py-0.5 text-[10px] uppercase ${statusClassName[report.status]}`}>{t(`status.${report.status}`)}</Badge>
                  </div>
                  <p className="line-clamp-2 text-sm leading-relaxed">{report.questionPreview}</p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>{report.questionNumberLabel}</span>
                    <span>-</span>
                    <span>{report.test.name}</span>
                  </div>
                </div>

                <div className="hidden grid-cols-[140px_minmax(0,2fr)_minmax(0,1.2fr)_120px_130px_160px] items-center gap-3 px-5 py-4 md:grid">
                  <div className="space-y-1">
                    <p className="font-semibold tracking-tight">{report.code}</p>
                    <Badge className={`border px-2 py-0.5 text-[10px] uppercase ${severityClassName[report.severity]}`}>{t(`severity.${report.severity}`)}</Badge>
                  </div>

                  <div className="min-w-0 space-y-1">
                    <p className="truncate text-sm">{report.questionPreview}</p>
                    <p className="truncate text-xs text-muted-foreground">{report.questionNumberLabel}</p>
                  </div>

                  <div className="min-w-0 space-y-1">
                    <p className="truncate text-sm">{report.test.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{t(`types.${report.reportType}`)}</p>
                  </div>

                  <Badge className={`w-fit border px-2 py-0.5 text-[10px] uppercase ${moduleClassName[report.module]}`}>{t(`modules.${report.module}`)}</Badge>
                  <Badge className={`w-fit border px-2 py-0.5 text-[10px] uppercase ${statusClassName[report.status]}`}>{t(`status.${report.status}`)}</Badge>

                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock3 className="size-3.5" />
                    {formatTimestamp(report.createdAt)}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="border-t border-border/70 px-5 py-3">
          <p className="text-sm text-muted-foreground">{t("showingReports", {shown: reports.length, total: totalReports})}</p>
        </div>
      </CardContent>
    </Card>
  );
}
