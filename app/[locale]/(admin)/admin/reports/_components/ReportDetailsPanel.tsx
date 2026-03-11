"use client";

import {MessageSquareReply, UserRound} from "lucide-react";
import {useTranslations} from "next-intl";

import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {ScrollArea} from "@/components/ui/scroll-area";
import {Sheet, SheetContent, SheetHeader, SheetTitle} from "@/components/ui/sheet";
import type {AdminReport} from "@/data/admin-reports";

type ReportAction = "resolve" | "reassign" | "reject";

type ReportDetailsPanelProps = {
  report: AdminReport | null;
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
  onAction: (action: ReportAction) => void;
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

function formatTimestamp(value: string) {
  const date = new Date(value);
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  const hh = String(date.getUTCHours()).padStart(2, "0");
  const mm = String(date.getUTCMinutes()).padStart(2, "0");
  return `${y}-${m}-${d} ${hh}:${mm}`;
}

function DetailsContent({report, onAction}: {report: AdminReport | null; onAction: (action: ReportAction) => void}) {
  const t = useTranslations("adminReports");

  if (!report) {
    return (
      <div className="flex h-full items-center justify-center px-6 py-16 text-center text-sm text-muted-foreground">
        {t("noReportSelected")}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border/70 px-5 py-4">
        <p className="text-lg font-semibold tracking-tight">{t("reportDetails")}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <p className="text-sm text-muted-foreground">{report.code}</p>
          <Badge className={`border px-2 py-0.5 text-[10px] uppercase ${severityClassName[report.severity]}`}>{t(`severity.${report.severity}`)}</Badge>
          <Badge className={`border px-2 py-0.5 text-[10px] uppercase ${statusClassName[report.status]}`}>{t(`status.${report.status}`)}</Badge>
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-4 px-4 py-4">
          <Card className="rounded-2xl border-border/70 bg-background/45 py-0">
            <CardHeader className="px-4 pt-4 pb-2">
              <CardTitle className="text-sm font-semibold">{t("userReportMessage")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 px-4 pb-4">
              <p className="text-sm leading-relaxed">{report.userMessage}</p>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <UserRound className="size-3.5" />
                  {t("submittedBy", {name: report.reporter.name})}
                </span>
                <span>{formatTimestamp(report.createdAt)}</span>
                {report.assignedTo ? <span>{t("assignedTo", {name: report.assignedTo.name})}</span> : null}
              </div>
              <Button type="button" variant="ghost" size="sm" className="h-8 rounded-lg px-2.5 text-xs">
                <MessageSquareReply className="size-3.5" />
                {t("reply")}
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/70 bg-background/45 py-0">
            <CardHeader className="px-4 pt-4 pb-2">
              <CardTitle className="text-sm font-semibold">{t("questionContent")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 px-4 pb-4">
              <p className="text-sm leading-relaxed">{report.questionContentTitle ?? report.questionPreview}</p>
              {report.questionOptions?.length ? (
                <div className="space-y-2">
                  {report.questionOptions.map((option) => {
                    const isSelected = report.selectedAnswer === option.label;
                    const isCorrect = report.correctAnswer === option.label;

                    return (
                      <div
                        key={option.id}
                        className={`rounded-xl border px-3 py-2 text-sm ${
                          isCorrect
                            ? "border-emerald-500/35 bg-emerald-500/10"
                            : isSelected
                              ? "border-blue-500/35 bg-blue-500/10"
                              : "border-border/70 bg-background/45"
                        }`}
                      >
                        <span className="font-semibold">{option.label}.</span> {option.text}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-1.5 text-sm">
                  <p>
                    <span className="text-muted-foreground">{t("yourAnswer")}:</span>{" "}
                    <span className="font-medium">{report.selectedAnswer ?? t("notAvailable")}</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">{t("correctAnswer")}:</span>{" "}
                    <span className="font-medium text-emerald-300">{report.correctAnswer ?? t("notAvailable")}</span>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/70 bg-background/45 py-0">
            <CardHeader className="px-4 pt-4 pb-2">
              <CardTitle className="text-sm font-semibold">{t("passageHighlight")}</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {report.passageHighlight ? (
                <div className="rounded-xl border border-blue-500/25 bg-blue-500/8 px-3 py-3 text-sm leading-relaxed text-blue-100">
                  {report.passageHighlight}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{t("noPassageHighlight")}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </ScrollArea>

      <div className="space-y-2 border-t border-border/70 p-4">
        <Button className="h-10 w-full rounded-xl font-semibold" onClick={() => onAction("resolve")} disabled={report.status === "resolved"}>
          {t("markAsResolved")}
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" className="h-10 rounded-xl border-border/70 bg-background/45" onClick={() => onAction("reassign")}>
            {t("reassign")}
          </Button>
          <Button
            variant="outline"
            className="h-10 rounded-xl border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 hover:text-rose-200"
            onClick={() => onAction("reject")}
            disabled={report.status === "rejected"}
          >
            {t("rejectReport")}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ReportDetailsPanel({report, mobileOpen, onMobileOpenChange, onAction}: ReportDetailsPanelProps) {
  const t = useTranslations("adminReports");

  return (
    <>
      <Card className="sticky top-[84px] hidden h-[calc(100vh-112px)] overflow-hidden rounded-2xl border-border/70 bg-card/70 py-0 lg:flex">
        <DetailsContent report={report} onAction={onAction} />
      </Card>

      <Sheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
        <SheetContent side="right" className="w-full border-l border-border/70 bg-background/95 p-0 sm:max-w-[560px] lg:hidden">
          <SheetHeader className="sr-only">
            <SheetTitle>{t("reportDetails")}</SheetTitle>
          </SheetHeader>
          <DetailsContent report={report} onAction={onAction} />
        </SheetContent>
      </Sheet>
    </>
  );
}
