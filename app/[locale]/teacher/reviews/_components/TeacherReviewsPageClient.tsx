"use client";

import {useEffect, useMemo, useState} from "react";
import {CheckCircle2, ListChecks, MessageSquareText, Users} from "lucide-react";
import {useLocale, useTranslations} from "next-intl";
import {useRouter} from "next/navigation";

import {Button} from "@/components/ui/button";
import {
  getTeacherReviewsPageData,
  saveTeacherReviewDraft,
  submitTeacherReview,
  type TeacherReviewCriteriaScores,
  type TeacherReviewSubmission,
  type TeacherReviewsPageData,
  type TeacherReviewsStatusFilter,
  type TeacherReviewsTypeFilter
} from "@/data/teacher/selectors";

import {TeacherSidebar} from "../../_components/TeacherSidebar";
import {TeacherTopbar} from "../../_components/TeacherTopbar";
import {TeacherRecentlyReviewedCard} from "./TeacherRecentlyReviewedCard";
import {TeacherReviewDetailsPanel} from "./TeacherReviewDetailsPanel";
import {TeacherReviewsFilters} from "./TeacherReviewsFilters";
import {TeacherReviewsSubmissionsTable} from "./TeacherReviewsSubmissionsTable";
import {TeacherReviewsSummaryCards} from "./TeacherReviewsSummaryCards";

type TeacherReviewsPageClientProps = {
  initialData: TeacherReviewsPageData;
  initialSearch?: string;
};

const emptyCriteria: TeacherReviewCriteriaScores = {
  taskResponse: 60,
  coherence: 60,
  lexical: 60,
  grammar: 60
};

function normalizeBand(value: number) {
  return Math.min(9, Math.max(4, Math.round(value * 2) / 2));
}

function defaultBandFromCriteria(criteria: TeacherReviewCriteriaScores) {
  return normalizeBand((criteria.taskResponse + criteria.coherence + criteria.lexical + criteria.grammar) / 48);
}

function submissionSearchTarget(submission: TeacherReviewSubmission) {
  return [
    submission.studentName,
    submission.studentId,
    submission.assignmentTitle,
    submission.module,
    submission.type,
    submission.contentPreview
  ]
    .join(" ")
    .toLowerCase();
}

export function TeacherReviewsPageClient({initialData, initialSearch = ""}: TeacherReviewsPageClientProps) {
  const t = useTranslations("teacherReviews");
  const locale = useLocale();
  const router = useRouter();

  const [pageData, setPageData] = useState(initialData);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(initialData.selectedSubmissionId);

  const [search, setSearch] = useState(initialSearch);
  const [typeFilter, setTypeFilter] = useState<TeacherReviewsTypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<TeacherReviewsStatusFilter>("all");
  const [descending, setDescending] = useState(true);

  const initialSelectedSubmission = initialData.submissions.find((item) => item.id === initialData.selectedSubmissionId) ?? null;
  const [selectedBand, setSelectedBand] = useState<number | null>(initialSelectedSubmission?.selectedBand ?? null);
  const [criteria, setCriteria] = useState<TeacherReviewCriteriaScores>(initialSelectedSubmission?.criteria ?? emptyCriteria);
  const [feedback, setFeedback] = useState(initialSelectedSubmission?.teacherFeedback ?? "");
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const selectedSubmission = useMemo(
    () => pageData.submissions.find((item) => item.id === selectedSubmissionId) ?? null,
    [pageData.submissions, selectedSubmissionId]
  );

  useEffect(() => {
    if (!actionMessage) {
      return;
    }

    const timer = window.setTimeout(() => setActionMessage(null), 2800);
    return () => window.clearTimeout(timer);
  }, [actionMessage]);

  const filteredSubmissions = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filtered = pageData.submissions.filter((item) => {
      if (typeFilter !== "all" && item.type !== typeFilter) {
        return false;
      }

      if (statusFilter !== "all" && item.status !== statusFilter) {
        return false;
      }

      if (!query) {
        return true;
      }

      return submissionSearchTarget(item).includes(query);
    });

    return filtered.sort((left, right) => {
      const leftTime = new Date(left.submittedAt).getTime();
      const rightTime = new Date(right.submittedAt).getTime();
      return descending ? rightTime - leftTime : leftTime - rightTime;
    });
  }, [descending, pageData.submissions, search, statusFilter, typeFilter]);

  const applyEditorFromSubmission = (submission: TeacherReviewSubmission | null) => {
    if (!submission) {
      setSelectedBand(null);
      setCriteria(emptyCriteria);
      setFeedback("");
      return;
    }

    setSelectedBand(submission.selectedBand);
    setCriteria(submission.criteria);
    setFeedback(submission.teacherFeedback);
  };

  const refreshData = (submissionId?: string) => {
    const next = getTeacherReviewsPageData({submissionId});
    const nextSelectedId = submissionId ?? next.selectedSubmissionId;
    const nextSelected = next.submissions.find((item) => item.id === nextSelectedId) ?? null;

    applyEditorFromSubmission(nextSelected);
    setPageData(next);
    setSelectedSubmissionId(nextSelectedId);
  };

  const handleSelectSubmission = (submissionId: string) => {
    const submission = pageData.submissions.find((item) => item.id === submissionId) ?? null;
    applyEditorFromSubmission(submission);
    setSelectedSubmissionId(submissionId);
  };

  const handleSaveDraft = () => {
    if (!selectedSubmission) {
      return;
    }

    saveTeacherReviewDraft({
      submissionId: selectedSubmission.id,
      studentId: selectedSubmission.studentId,
      assignmentId: selectedSubmission.assignmentId,
      assignmentTitle: selectedSubmission.assignmentTitle,
      module: selectedSubmission.module,
      type: selectedSubmission.type,
      status: selectedSubmission.status === "overdue" ? "overdue" : "pending",
      selectedBand,
      teacherFeedback: feedback.trim(),
      criteria
    });

    refreshData(selectedSubmission.id);
    setActionMessage(t("feedback.draftSaved"));
  };

  const handleSubmitReview = () => {
    if (!selectedSubmission) {
      return;
    }

    const finalBand = selectedBand ?? defaultBandFromCriteria(criteria);

    submitTeacherReview({
      submissionId: selectedSubmission.id,
      studentId: selectedSubmission.studentId,
      assignmentId: selectedSubmission.assignmentId,
      assignmentTitle: selectedSubmission.assignmentTitle,
      module: selectedSubmission.module,
      type: selectedSubmission.type,
      selectedBand: finalBand,
      teacherFeedback: feedback.trim(),
      criteria
    });

    refreshData(selectedSubmission.id);
    setActionMessage(t("feedback.reviewSubmitted", {student: selectedSubmission.studentName}));
  };

  const handleMessageStudent = () => {
    if (!selectedSubmission) {
      router.push(`/${locale}/teacher/messages?source=reviews`);
      return;
    }

    router.push(`/${locale}/teacher/messages?source=reviews&studentId=${selectedSubmission.studentId}`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <TeacherSidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <TeacherTopbar
            title={t("title")}
            search={{
              value: search,
              onValueChange: setSearch,
              placeholder: t("searchPlaceholder")
            }}
          />

          <main className="mx-auto min-w-0 w-full max-w-[1480px] space-y-5 overflow-x-hidden px-4 py-5 sm:px-6 lg:px-8">
            <section>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("title")}</h1>
              <p className="mt-1.5 text-sm text-muted-foreground">{t("subtitle")}</p>
            </section>

            <TeacherReviewsSummaryCards summary={pageData.summary} />
            <TeacherReviewsFilters
              search={search}
              typeFilter={typeFilter}
              statusFilter={statusFilter}
              descending={descending}
              onSearchChange={setSearch}
              onTypeChange={setTypeFilter}
              onStatusChange={setStatusFilter}
              onToggleSort={() => setDescending((value) => !value)}
            />

            <section className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.95fr)]">
              <div className="space-y-5">
                <TeacherReviewsSubmissionsTable
                  submissions={filteredSubmissions}
                  selectedSubmissionId={selectedSubmissionId}
                  onSelectSubmission={handleSelectSubmission}
                />

                <TeacherRecentlyReviewedCard items={pageData.recentActivity} />

                <div className="flex flex-wrap gap-2.5">
                  <Button type="button" variant="secondary" className="rounded-xl" onClick={() => router.push(`/${locale}/teacher/assignments`)}>
                    <ListChecks className="size-4" />
                    {t("viewAllAssignments")}
                  </Button>
                  <Button type="button" variant="secondary" className="rounded-xl" onClick={() => router.push(`/${locale}/teacher/students`)}>
                    <Users className="size-4" />
                    {t("goToStudents")}
                  </Button>
                  <Button type="button" className="rounded-xl" onClick={handleMessageStudent}>
                    <MessageSquareText className="size-4" />
                    {t("messageStudent")}
                  </Button>
                </div>
              </div>

              <div className="xl:sticky xl:top-24 xl:h-fit">
                <TeacherReviewDetailsPanel
                  submission={selectedSubmission}
                  selectedBand={selectedBand}
                  criteria={criteria}
                  feedback={feedback}
                  onSelectBand={setSelectedBand}
                  onChangeCriteria={(key, value) => setCriteria((current) => ({...current, [key]: value}))}
                  onChangeFeedback={setFeedback}
                  onSaveDraft={handleSaveDraft}
                  onSubmitReview={handleSubmitReview}
                  onMessageStudent={handleMessageStudent}
                />
              </div>
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
