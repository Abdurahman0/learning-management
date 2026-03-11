"use client";

import {useEffect, useMemo, useState} from "react";
import {CheckCircle2} from "lucide-react";
import {useTranslations} from "next-intl";

import {AdminSidebar} from "../../_components/AdminSidebar";
import {
  ADMIN_REPORTS_DATA,
  REPORT_MODULE_OPTIONS,
  REPORT_SEVERITY_OPTIONS,
  REPORT_SORT_OPTIONS,
  REPORT_STATUS_OPTIONS,
  REPORT_TYPE_OPTIONS,
  type AdminReport,
  type MostReportedQuestion,
  type ReportModuleFilterValue,
  type ReportSeverityFilterValue,
  type ReportSortValue,
  type ReportStatusFilterValue,
  type ReportTypeFilterValue,
  type ResolutionHistoryItem
} from "@/data/admin-reports";
import {MostReportedQuestionsCard} from "./MostReportedQuestionsCard";
import {ReportDetailsPanel} from "./ReportDetailsPanel";
import {ReportsFilters} from "./ReportsFilters";
import {ReportsHeader} from "./ReportsHeader";
import {ReportsSummaryCards} from "./ReportsSummaryCards";
import {ReportsTable} from "./ReportsTable";
import {ResolutionHistoryCard} from "./ResolutionHistoryCard";

const ACTIVE_STATUSES = new Set(["open", "in_review"]);
const severityPriority = {urgent: 0, medium: 1, low: 2} as const;
const reviewerById = {
  "usr-1010": "Ibrohim Qodirov",
  "usr-1009": "Nodira Xasanova"
} as const;

function sortReports(reports: AdminReport[], sortValue: ReportSortValue) {
  const sorted = [...reports];
  sorted.sort((left, right) => {
    if (sortValue === "oldest") {
      return left.createdAt.localeCompare(right.createdAt);
    }

    if (sortValue === "severity") {
      const severityCompare = severityPriority[left.severity] - severityPriority[right.severity];
      if (severityCompare !== 0) return severityCompare;
      return right.createdAt.localeCompare(left.createdAt);
    }

    return right.createdAt.localeCompare(left.createdAt);
  });
  return sorted;
}

function computeMostReported(reports: AdminReport[]): MostReportedQuestion[] {
  const map = new Map<string, MostReportedQuestion>();
  for (const report of reports) {
    const key = `${report.test.id}::${report.questionNumberLabel}`;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, {
        id: key,
        label: `${report.test.name} ${report.questionNumberLabel}`,
        module: report.module,
        reportType: report.reportType,
        reportCount: 1
      });
      continue;
    }
    existing.reportCount += 1;
  }

  return [...map.values()]
    .sort((left, right) => right.reportCount - left.reportCount || left.label.localeCompare(right.label))
    .slice(0, 5);
}

export function ReportsPageClient() {
  const t = useTranslations("adminReports");
  const [reports, setReports] = useState<AdminReport[]>(ADMIN_REPORTS_DATA.reports);
  const [history, setHistory] = useState<ResolutionHistoryItem[]>(ADMIN_REPORTS_DATA.resolutionHistory);
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReportStatusFilterValue>("all");
  const [typeFilter, setTypeFilter] = useState<ReportTypeFilterValue>("all");
  const [moduleFilter, setModuleFilter] = useState<ReportModuleFilterValue>("all");
  const [severityFilter, setSeverityFilter] = useState<ReportSeverityFilterValue>("all");
  const [sortValue, setSortValue] = useState<ReportSortValue>("newest");
  const [selectedReportId, setSelectedReportId] = useState<string | null>(reports[0]?.id ?? null);
  const [detailsSheetOpen, setDetailsSheetOpen] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const filteredReports = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    const next = reports.filter((report) => {
      if (statusFilter !== "all" && report.status !== statusFilter) return false;
      if (typeFilter !== "all" && report.reportType !== typeFilter) return false;
      if (moduleFilter !== "all" && report.module !== moduleFilter) return false;
      if (severityFilter !== "all" && report.severity !== severityFilter) return false;

      if (!query) return true;

      return (
        report.code.toLowerCase().includes(query) ||
        report.questionPreview.toLowerCase().includes(query) ||
        report.test.name.toLowerCase().includes(query) ||
        report.userMessage.toLowerCase().includes(query)
      );
    });

    return sortReports(next, sortValue);
  }, [moduleFilter, reports, searchValue, severityFilter, sortValue, statusFilter, typeFilter]);

  const selectedReport = useMemo(
    () => reports.find((report) => report.id === selectedReportId) ?? null,
    [reports, selectedReportId]
  );

  const mostReportedQuestions = useMemo(() => computeMostReported(reports), [reports]);

  const summary = useMemo(() => {
    const openReports = reports.filter((report) => ACTIVE_STATUSES.has(report.status)).length;
    const urgentReports = reports.filter((report) => report.severity === "urgent" && ACTIVE_STATUSES.has(report.status)).length;
    const mostReported = mostReportedQuestions[0]?.label ?? t("summary.noData");
    const latestDay = history[0]?.createdAt.slice(0, 10);
    const resolvedToday = history.filter((item) => item.actionType === "resolved" && item.createdAt.slice(0, 10) === latestDay).length;

    return {
      openReports,
      resolvedToday,
      mostReported,
      urgentReports
    };
  }, [history, mostReportedQuestions, reports, t]);

  useEffect(() => {
    if (!filteredReports.length) {
      setSelectedReportId(null);
      return;
    }

    if (!selectedReportId || !filteredReports.some((item) => item.id === selectedReportId)) {
      setSelectedReportId(filteredReports[0].id);
    }
  }, [filteredReports, selectedReportId]);

  useEffect(() => {
    if (!actionMessage) return;
    const timer = window.setTimeout(() => setActionMessage(null), 2600);
    return () => window.clearTimeout(timer);
  }, [actionMessage]);

  const addHistory = (item: Omit<ResolutionHistoryItem, "id" | "createdAt">) => {
    setHistory((current) => [
      {
        ...item,
        id: `history-local-${Date.now()}`,
        createdAt: new Date().toISOString()
      },
      ...current
    ]);
  };

  const handleReportAction = (action: "resolve" | "reassign" | "reject") => {
    if (!selectedReportId) return;

    const currentReport = reports.find((report) => report.id === selectedReportId);
    if (!currentReport) return;

    if (action === "resolve") {
      setReports((current) => current.map((report) => (report.id === selectedReportId ? {...report, status: "resolved"} : report)));
      addHistory({
        reportId: currentReport.id,
        reportCode: currentReport.code,
        actor: t("systemActor"),
        actionType: "resolved",
        description: t("historyDescription.resolved", {code: currentReport.code})
      });
      setActionMessage(t("actionFeedback.resolved", {code: currentReport.code}));
      return;
    }

    if (action === "reject") {
      setReports((current) => current.map((report) => (report.id === selectedReportId ? {...report, status: "rejected"} : report)));
      addHistory({
        reportId: currentReport.id,
        reportCode: currentReport.code,
        actor: t("systemActor"),
        actionType: "rejected",
        description: t("historyDescription.rejected", {code: currentReport.code})
      });
      setActionMessage(t("actionFeedback.rejected", {code: currentReport.code}));
      return;
    }

    const nextAssigneeId = currentReport.assignedTo?.id === "usr-1010" ? "usr-1009" : "usr-1010";
    const nextAssigneeName = reviewerById[nextAssigneeId];

    setReports((current) =>
      current.map((report) =>
        report.id === selectedReportId
          ? {
              ...report,
              status: "in_review",
              assignedTo: {
                id: nextAssigneeId,
                name: nextAssigneeName
              }
            }
          : report
      )
    );

    addHistory({
      reportId: currentReport.id,
      reportCode: currentReport.code,
      actor: t("systemActor"),
      actionType: "reassigned",
      description: t("historyDescription.reassigned", {code: currentReport.code, name: nextAssigneeName})
    });
    setActionMessage(t("actionFeedback.reassigned", {name: nextAssigneeName}));
  };

  const handleResetFilters = () => {
    setStatusFilter("all");
    setTypeFilter("all");
    setModuleFilter("all");
    setSeverityFilter("all");
    setSortValue("newest");
    setSearchValue("");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <AdminSidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <ReportsHeader searchValue={searchValue} onSearchChange={setSearchValue} />

          <main className="mx-auto min-w-0 w-full max-w-[1600px] space-y-5 overflow-x-hidden px-4 py-5 sm:px-6 lg:px-8">
            <ReportsSummaryCards
              openReports={summary.openReports}
              resolvedToday={summary.resolvedToday}
              mostReported={summary.mostReported}
              urgentReports={summary.urgentReports}
            />

            <ReportsFilters
              statusValue={statusFilter}
              typeValue={typeFilter}
              moduleValue={moduleFilter}
              severityValue={severityFilter}
              sortValue={sortValue}
              statusOptions={REPORT_STATUS_OPTIONS}
              typeOptions={REPORT_TYPE_OPTIONS}
              moduleOptions={REPORT_MODULE_OPTIONS}
              severityOptions={REPORT_SEVERITY_OPTIONS}
              sortOptions={REPORT_SORT_OPTIONS}
              onStatusChange={setStatusFilter}
              onTypeChange={setTypeFilter}
              onModuleChange={setModuleFilter}
              onSeverityChange={setSeverityFilter}
              onSortChange={setSortValue}
              onReset={handleResetFilters}
            />

            <section className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1.65fr)_minmax(350px,0.95fr)]">
              <ReportsTable
                reports={filteredReports}
                selectedReportId={selectedReportId}
                totalReports={reports.length}
                onSelectReport={(reportId) => {
                  setSelectedReportId(reportId);
                  setDetailsSheetOpen(true);
                }}
              />

              <ReportDetailsPanel
                report={selectedReport}
                mobileOpen={detailsSheetOpen}
                onMobileOpenChange={setDetailsSheetOpen}
                onAction={handleReportAction}
              />
            </section>

            <section className="grid min-w-0 gap-5 xl:grid-cols-2">
              <MostReportedQuestionsCard items={mostReportedQuestions} />
              <ResolutionHistoryCard items={history} />
            </section>
          </main>
        </div>
      </div>

      <div aria-live="polite" className="pointer-events-none fixed top-20 right-4 z-[60]">
        {actionMessage ? (
          <div className="min-w-[280px] rounded-xl border border-emerald-500/35 bg-background/95 px-4 py-3 shadow-lg backdrop-blur-md">
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 inline-flex size-5 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
                <CheckCircle2 className="size-3.5" />
              </span>
              <p className="text-sm font-medium">{actionMessage}</p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
