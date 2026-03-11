import {getReportsPageData, type MostReportedQuestionItem, type ReportHistoryFeedItem, type ReportsPageData, type ReportsPageReport} from "@/data/admin/selectors";
import type {ReportModule, ReportSeverity, ReportStatus, ReportType} from "@/types/admin";

export type AdminReport = ReportsPageReport;
export type ResolutionHistoryItem = ReportHistoryFeedItem;
export type MostReportedQuestion = MostReportedQuestionItem;
export type AdminReportsData = ReportsPageData;

export type ReportStatusFilterValue = "all" | ReportStatus;
export type ReportTypeFilterValue = "all" | ReportType;
export type ReportModuleFilterValue = "all" | ReportModule;
export type ReportSeverityFilterValue = "all" | ReportSeverity;
export type ReportSortValue = "newest" | "oldest" | "severity";

type FilterOption<Value extends string> = {
  value: Value;
  labelKey: string;
};

export const REPORT_STATUS_OPTIONS = [
  {value: "all", labelKey: "filters.status.all"},
  {value: "open", labelKey: "filters.status.open"},
  {value: "in_review", labelKey: "filters.status.inReview"},
  {value: "resolved", labelKey: "filters.status.resolved"},
  {value: "rejected", labelKey: "filters.status.rejected"}
] satisfies FilterOption<ReportStatusFilterValue>[];

export const REPORT_TYPE_OPTIONS = [
  {value: "all", labelKey: "filters.type.all"},
  {value: "content_error", labelKey: "filters.type.contentError"},
  {value: "answer_key", labelKey: "filters.type.answerKey"},
  {value: "audio_issue", labelKey: "filters.type.audioIssue"},
  {value: "image_missing", labelKey: "filters.type.imageMissing"},
  {value: "ui_issue", labelKey: "filters.type.uiIssue"}
] satisfies FilterOption<ReportTypeFilterValue>[];

export const REPORT_MODULE_OPTIONS = [
  {value: "all", labelKey: "filters.module.all"},
  {value: "reading", labelKey: "filters.module.reading"},
  {value: "listening", labelKey: "filters.module.listening"},
  {value: "writing", labelKey: "filters.module.writing"},
  {value: "speaking", labelKey: "filters.module.speaking"}
] satisfies FilterOption<ReportModuleFilterValue>[];

export const REPORT_SEVERITY_OPTIONS = [
  {value: "all", labelKey: "filters.severity.all"},
  {value: "low", labelKey: "filters.severity.low"},
  {value: "medium", labelKey: "filters.severity.medium"},
  {value: "urgent", labelKey: "filters.severity.urgent"}
] satisfies FilterOption<ReportSeverityFilterValue>[];

export const REPORT_SORT_OPTIONS = [
  {value: "newest", labelKey: "filters.sort.newest"},
  {value: "oldest", labelKey: "filters.sort.oldest"},
  {value: "severity", labelKey: "filters.sort.severity"}
] satisfies FilterOption<ReportSortValue>[];

export const ADMIN_REPORTS_DATA = getReportsPageData();
