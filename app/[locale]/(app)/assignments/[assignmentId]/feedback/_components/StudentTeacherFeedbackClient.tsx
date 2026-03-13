"use client";

import {useEffect, useMemo, useState} from "react";
import {useLocale, useTranslations} from "next-intl";
import {useRouter} from "next/navigation";
import {ArrowRight, BookText, CalendarCheck2, CalendarClock, CircleUserRound, Download, Gauge, Sparkles} from "lucide-react";

import {getStudentAssignmentById, STUDENT_ASSIGNMENT_TEACHERS} from "@/data/student/assignments";
import {getStudentTeacherFeedbackByAssignmentId} from "@/data/student/teacher-feedback";
import type {StudentTeacherFeedbackAction, StudentTeacherFeedbackCriterion} from "@/types/student";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {cn} from "@/lib/utils";

type StudentTeacherFeedbackClientProps = {
  assignmentId: string;
};

type Notice = {
  title: string;
  description: string;
};

const cardClassName =
  "rounded-2xl border border-border/70 bg-card/95 dark:border-slate-700/45 dark:bg-[linear-gradient(155deg,rgba(17,24,39,0.92),rgba(15,23,42,0.9))] shadow-none";

const moduleBadgeTone = {
  reading: "border-indigo-400/35 bg-indigo-500/12 text-indigo-700 dark:text-indigo-200",
  listening: "border-blue-400/35 bg-blue-500/12 text-blue-700 dark:text-blue-200",
  writing: "border-violet-400/35 bg-violet-500/12 text-violet-700 dark:text-violet-200",
  speaking: "border-cyan-400/35 bg-cyan-500/12 text-cyan-700 dark:text-cyan-200"
} as const;

const criteriaTone = {
  strong: "bg-emerald-500",
  mid: "bg-indigo-500",
  focus: "bg-amber-500"
} as const;

export function StudentTeacherFeedbackClient({assignmentId}: StudentTeacherFeedbackClientProps) {
  const t = useTranslations("studentTeacherFeedback");
  const locale = useLocale();
  const router = useRouter();

  const [notice, setNotice] = useState<Notice | null>(null);
  const [showFullSubmission, setShowFullSubmission] = useState(false);

  const assignment = useMemo(() => getStudentAssignmentById(assignmentId), [assignmentId]);
  const feedback = useMemo(() => getStudentTeacherFeedbackByAssignmentId(assignmentId), [assignmentId]);
  const teacher = useMemo(() => {
    if (!feedback?.teacherId) {
      return assignment ? STUDENT_ASSIGNMENT_TEACHERS[assignment.teacherId] : null;
    }

    return STUDENT_ASSIGNMENT_TEACHERS[feedback.teacherId];
  }, [assignment, feedback]);

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale === "uz" ? "uz-UZ" : "en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      }),
    [locale]
  );

  useEffect(() => {
    if (!notice) {
      return;
    }

    const timer = window.setTimeout(() => setNotice(null), 2600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const pushNotice = (title: string, description: string) => setNotice({title, description});

  const handleDownload = () => {
    pushNotice(t("feedback.download.title"), t("feedback.download.description"));
  };

  const handleViewAnalytics = () => {
    router.push(`/${locale}/analytics?source=teacher-feedback&assignment=${assignmentId}`);
  };

  const runAction = (action: StudentTeacherFeedbackAction) => {
    if (action.action === "navigate" && action.href) {
      router.push(`/${locale}${action.href}?source=teacher-feedback&assignment=${assignmentId}`);
      return;
    }

    pushNotice(t("feedback.action.title"), t("feedback.action.description"));
  };

  const renderCriteriaBar = (criterion: StudentTeacherFeedbackCriterion) => {
    const width = Math.max(0, Math.min(100, (criterion.score / 9) * 100));

    return (
      <div className="space-y-1.5" key={criterion.id}>
        <div className="flex items-center justify-between gap-2">
          <p className="min-w-0 break-words text-sm text-foreground/90">{t(criterion.labelKey)}</p>
          <p className="shrink-0 text-base font-semibold text-foreground">{criterion.score.toFixed(1)}</p>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div className={cn("h-full rounded-full transition-all", criteriaTone[criterion.tone])} style={{width: `${width}%`}} />
        </div>
      </div>
    );
  };

  if (!assignment || !teacher) {
    return (
      <main className="mx-auto min-w-0 w-full max-w-[1480px] overflow-x-hidden px-2 py-5 sm:px-4 sm:py-6 lg:px-6">
        <Card className={cn(cardClassName, "mx-auto max-w-2xl p-6 sm:p-8")}>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{t("empty.notFound.title")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("empty.notFound.description")}</p>
          <Button type="button" className="mt-5 h-10 rounded-xl bg-indigo-500 text-white hover:bg-indigo-400" onClick={() => router.push(`/${locale}/assignments`)}>
            {t("actions.backToAssignments")}
          </Button>
        </Card>
      </main>
    );
  }

  if (!feedback) {
    return (
      <main className="mx-auto min-w-0 w-full max-w-[1480px] overflow-x-hidden px-2 py-5 sm:px-4 sm:py-6 lg:px-6">
        <Card className={cn(cardClassName, "mx-auto max-w-3xl p-6 sm:p-8")}>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{t("empty.awaitingReview.title")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("empty.awaitingReview.description")}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button type="button" className="h-10 rounded-xl bg-indigo-500 text-white hover:bg-indigo-400" onClick={() => router.push(`/${locale}/assignments`)}>
              {t("actions.backToAssignments")}
            </Button>
            <Button type="button" variant="outline" className="h-10 rounded-xl border-border/70 bg-background/70" onClick={() => router.push(`/${locale}/dashboard`)}>
              {t("actions.goToDashboard")}
            </Button>
          </div>
        </Card>
      </main>
    );
  }

  const submittedDate = dateFormatter.format(new Date(feedback.submittedAt));
  const reviewedDate = dateFormatter.format(new Date(feedback.reviewedAt));

  return (
    <main className="mx-auto min-w-0 w-full max-w-[1780px] overflow-x-hidden px-2 py-5 sm:px-4 sm:py-6 lg:px-6">
      <section className="space-y-5 sm:space-y-6">
        {notice ? (
          <Card className="rounded-xl border border-blue-400/35 bg-blue-500/10 shadow-none">
            <CardContent className="p-3">
              <p className="text-sm font-semibold text-blue-700 dark:text-blue-100">{notice.title}</p>
              <p className="text-sm text-blue-700/90 dark:text-blue-100/85">{notice.description}</p>
            </CardContent>
          </Card>
        ) : null}

        <section className={cn(cardClassName, "p-4 sm:p-5")}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 space-y-2">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <Badge className={cn("border", moduleBadgeTone[feedback.module])}>{t(`modules.${feedback.module}`)}</Badge>
                <Badge className="border border-emerald-400/35 bg-emerald-500/12 text-emerald-700 dark:text-emerald-200">
                  {t("status.reviewed")}
                </Badge>
                <Badge className="border border-border/70 bg-background/75 text-foreground">{t(`assignmentTypes.${feedback.assignmentType}`)}</Badge>
              </div>

              <h1 className="min-w-0 break-words text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{assignment.title}</h1>

              <div className="grid min-w-0 grid-cols-1 gap-1 text-sm text-muted-foreground sm:grid-cols-2 xl:grid-cols-4 xl:gap-4">
                <p className="inline-flex min-w-0 items-start gap-1.5 break-words">
                  <CircleUserRound className="mt-0.5 size-4 shrink-0" />
                  {t("meta.teacher", {name: teacher.name})}
                </p>
                <p className="inline-flex min-w-0 items-start gap-1.5 break-words">
                  <CalendarClock className="mt-0.5 size-4 shrink-0" />
                  {t("meta.submitted", {time: t(`time.${feedback.submittedRelativeKey}`)})}
                </p>
                <p className="inline-flex min-w-0 items-start gap-1.5 break-words">
                  <CalendarCheck2 className="mt-0.5 size-4 shrink-0" />
                  {t("meta.reviewed", {time: t(`time.${feedback.reviewedRelativeKey}`)})}
                </p>
                <p className="min-w-0 break-words text-xs sm:text-sm">
                  {t("meta.dateRange", {
                    submittedDate,
                    reviewedDate
                  })}
                </p>
              </div>
            </div>

            <div className="grid w-full min-w-0 grid-cols-1 gap-2 sm:w-auto sm:grid-cols-2">
              <Button type="button" variant="outline" className="h-10 w-full rounded-xl border-border/70 bg-background/70 px-4" onClick={handleDownload}>
                <Download className="size-4" />
                {t("actions.downloadPdf")}
              </Button>
              <Button type="button" className="h-10 w-full rounded-xl bg-indigo-500 px-4 text-white hover:bg-indigo-400" onClick={handleViewAnalytics}>
                {t("actions.viewAnalytics")}
              </Button>
            </div>
          </div>
        </section>

        <section className="grid min-w-0 items-start gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.9fr)]">
          <section className="min-w-0 space-y-4">
            <Card className={cn(cardClassName, "p-4 sm:p-5")}>
              <CardHeader className="p-0">
                <CardTitle className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground">
                  <Gauge className="size-5 text-indigo-600 dark:text-indigo-300" />
                  {t("cards.assessment.title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid min-w-0 gap-4 p-0 pt-5 md:grid-cols-[220px_minmax(0,1fr)]">
                <div className="mx-auto w-full max-w-[220px]">
                  <div className="relative mx-auto grid size-44 place-items-center rounded-full border border-indigo-400/35 bg-indigo-500/8">
                    <div className="absolute inset-[14px] rounded-full border border-indigo-400/25" />
                    <div className="text-center">
                      <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">{t("cards.assessment.bandLabel")}</p>
                      <p className="mt-1 text-5xl leading-none font-semibold tracking-tight text-foreground">{feedback.overallBand.toFixed(1)}</p>
                    </div>
                  </div>
                </div>
                <p className="min-w-0 break-words text-[15px] leading-relaxed text-foreground/90">{t(feedback.overallAssessmentKey)}</p>
              </CardContent>
            </Card>

            <Card className={cn(cardClassName, "p-4 sm:p-5")}>
              <CardHeader className="p-0">
                <CardTitle className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground">
                  <BookText className="size-5 text-indigo-600 dark:text-indigo-300" />
                  {t("cards.detailedFeedback.title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 p-0 pt-5">
                {feedback.sections.map((section) => (
                  <section key={section.id} className="space-y-2">
                    <h3 className="text-xl font-semibold tracking-tight text-foreground">{t(section.titleKey)}</h3>
                    <p className="text-[15px] leading-relaxed text-foreground/90">{t(section.feedbackKey)}</p>
                    {section.highlightKey ? (
                      <div className="rounded-lg border border-border/70 bg-background/70 px-3 py-2">
                        <p className="border-l-2 border-indigo-400/60 pl-3 text-sm leading-relaxed text-muted-foreground">{t(section.highlightKey)}</p>
                      </div>
                    ) : null}
                  </section>
                ))}
              </CardContent>
            </Card>

            <Card className={cn(cardClassName, "p-4 sm:p-5")}>
              <CardHeader className="p-0">
                <CardTitle className="text-xl font-semibold tracking-tight text-foreground">{t("cards.nextSteps.title")}</CardTitle>
              </CardHeader>
              <CardContent className="grid min-w-0 grid-cols-1 gap-3 p-0 pt-4 md:grid-cols-2">
                {feedback.actions.map((action) => (
                  <div key={action.id} className="rounded-xl border border-border/70 bg-background/70 p-3">
                    <p className="text-base font-semibold text-foreground">{t(action.titleKey)}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{t(action.descriptionKey)}</p>
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-3 h-9 w-full rounded-xl border-border/70 bg-background/80"
                      onClick={() => runAction(action)}
                    >
                      {t(action.ctaKey)}
                      <ArrowRight className="size-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>

          <aside className="min-w-0 space-y-4 xl:sticky xl:top-6">
            <Card className={cn(cardClassName, "p-4 sm:p-5")}>
              <CardHeader className="p-0">
                <CardTitle className="text-xl font-semibold tracking-tight text-foreground">{t("cards.submissionSummary.title")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-0 pt-4">
                <div>
                  <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">{t("cards.submissionSummary.promptLabel")}</p>
                  <p className="mt-2 text-sm leading-relaxed text-foreground/90">{t(feedback.promptKey)}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <p className="text-muted-foreground">{t("cards.submissionSummary.submissionLabel")}</p>
                  <p className="text-right font-semibold text-foreground">{t("cards.submissionSummary.wordCount", {count: feedback.wordCount})}</p>
                </div>
                <div className="rounded-xl border border-border/70 bg-background/70 p-3">
                  <p className="text-sm leading-relaxed text-foreground/90">{t(showFullSubmission ? feedback.fullSubmissionKey : feedback.submissionPreviewKey)}</p>
                </div>
                <Button type="button" variant="link" className="h-auto px-0 text-indigo-600 dark:text-indigo-300" onClick={() => setShowFullSubmission((current) => !current)}>
                  {showFullSubmission ? t("actions.hideFullSubmission") : t("actions.viewFullSubmission")}
                </Button>
              </CardContent>
            </Card>

            <Card className={cn(cardClassName, "p-4 sm:p-5")}>
              <CardHeader className="p-0">
                <CardTitle className="text-xl font-semibold tracking-tight text-foreground">{t("cards.criteria.title")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-0 pt-4">
                {feedback.criteria.map((criterion) => renderCriteriaBar(criterion))}
                <div className="rounded-lg border border-border/70 bg-background/70 px-3 py-2">
                  <p className="text-xs leading-relaxed text-muted-foreground">{t(feedback.criteriaNoteKey)}</p>
                </div>
              </CardContent>
            </Card>

            <Card className={cn(cardClassName, "p-4 sm:p-5")}>
              <CardHeader className="p-0">
                <CardTitle className="flex items-center gap-2 text-base font-semibold tracking-tight text-foreground">
                  <Sparkles className="size-4 text-indigo-600 dark:text-indigo-300" />
                  {t("cards.coachNote.title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 pt-3">
                <p className="text-sm leading-relaxed text-muted-foreground">{t("cards.coachNote.description")}</p>
              </CardContent>
            </Card>
          </aside>
        </section>
      </section>
    </main>
  );
}
