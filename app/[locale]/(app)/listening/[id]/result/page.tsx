"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {MistakeReasonAiResponseCard} from "@/components/mistake-reasons/MistakeReasonAiResponseCard";
import {PostTestMistakeReasonsPanel} from "@/components/mistake-reasons/PostTestMistakeReasonsPanel";
import { gradeTest, gradeTestFromBackendVerdicts, type GradeableQuestion } from "@/lib/grading";
import { loadAttemptResult } from "@/lib/test-attempt-storage";
import { getListeningTestById } from "@/data/listening-tests-full";
import { studentAttemptsService } from "@/src/services/student/attempts.service";
import { studentMarathonService } from "@/src/services/student/marathon.service";
import { adaptMarathonListeningReviewResponse } from "@/src/services/student/marathon-runner-adapters";
import {studentMistakeReasonsService} from "@/src/services/student/mistakeReasons.service";
import {DashboardFeedbackButton} from "../../../dashboard/_components/DashboardFeedbackButton";
import {MarathonResultVideoCard} from "../../../marathons/_components/MarathonResultVideoCard";
import type {
  MistakeReasonCategory,
  MistakeReasonDetail,
  MistakeReasonUsageStatus,
  StudentAttemptReviewResponse
} from "@/src/services/student/types";
import { ListeningResultSummaryHeader } from "./_components/ListeningResultSummaryHeader";
import {
  ListeningSectionPerformance,
} from "./_components/ListeningSectionPerformance";
import { ListeningTypePerformance } from "./_components/ListeningTypePerformance";
import { adaptListeningBackendReview, type AdaptedListeningBackendReview } from "./_components/backendReviewAdapters";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string) {
  return UUID_PATTERN.test(value.trim());
}

function normalizeStoredAnswers(input: Record<string, string | string[] | null>) {
  const normalized: Record<string, string | string[]> = {};

  for (const [questionId, value] of Object.entries(input)) {
    if (typeof value === "string") {
      normalized[questionId] = value;
      continue;
    }

    if (Array.isArray(value)) {
      normalized[questionId] = value;
    }
  }

  return normalized;
}

function getListeningCategoryQuestionNumbers(review: StudentAttemptReviewResponse | null): Partial<Record<MistakeReasonCategory, number[]>> {
  const result: Partial<Record<MistakeReasonCategory, number[]>> = {
    blank_answer: [],
    fully_incorrect: []
  };

  for (const part of review?.parts ?? []) {
    for (const group of part.question_groups ?? []) {
      for (const question of group.questions ?? []) {
        if (question.is_skipped) {
          result.blank_answer?.push(question.question_number);
        } else if (!question.is_correct) {
          result.fully_incorrect?.push(question.question_number);
        }
      }
    }
  }

  return result;
}

export default function ListeningResultPage() {
  const params = useParams<{id: string}>();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const router = useRouter();
  const tResults = useTranslations("testResults");
  const testId = typeof params?.id === "string" ? params.id : "";
  const attemptId = searchParams.get("attempt")?.trim() ?? "";
  const returnToParam = searchParams.get("returnTo")?.trim() ?? "";
  const returnLabelParam = searchParams.get("returnLabel")?.trim() ?? "";
  const marathonIdParam = searchParams.get("marathonId")?.trim() ?? "";
  const marathonDayNumber = Number(searchParams.get("dayNumber")?.trim() ?? "");
  const isMarathonContext = isUuid(marathonIdParam) && Number.isInteger(marathonDayNumber) && marathonDayNumber > 0;
  const returnHref = returnToParam.startsWith("/") ? returnToParam : `/${locale}/dashboard`;
  const returnLabel = returnToParam.startsWith("/") ? (returnLabelParam || "Back to marathon day") : undefined;
  const resolvedBackendAttemptId = isUuid(attemptId) ? attemptId : "";
  const reviewQuerySuffix = useMemo(() => {
    const query = new URLSearchParams();
    if (returnToParam.startsWith("/")) {
      query.set("returnTo", returnToParam);
      if (returnLabelParam) query.set("returnLabel", returnLabelParam);
    }
    if (isMarathonContext) {
      query.set("marathonId", marathonIdParam);
      query.set("dayNumber", String(marathonDayNumber));
    }
    const serialized = query.toString();
    return serialized ? `&${serialized}` : "";
  }, [isMarathonContext, marathonDayNumber, marathonIdParam, returnLabelParam, returnToParam]);
  const localAttemptId = !resolvedBackendAttemptId && attemptId ? attemptId : "";
  const localResult = useMemo(() => {
    if (!localAttemptId) return null;
    return loadAttemptResult("listening", testId, localAttemptId);
  }, [localAttemptId, testId]);
  const [reviewPayload, setReviewPayload] = useState<StudentAttemptReviewResponse | null>(null);
  const [backendReview, setBackendReview] = useState<AdaptedListeningBackendReview | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(resolvedBackendAttemptId));
  const [showAiInsights, setShowAiInsights] = useState(false);
  const [mistakeModalOpen, setMistakeModalOpen] = useState(false);
  const [isMistakeAnalyzing, setIsMistakeAnalyzing] = useState(false);
  const aiInsightsRef = useRef<HTMLDivElement | null>(null);
  const [mistakeReasons, setMistakeReasons] = useState<MistakeReasonDetail[]>([]);
  const [selectedMistakeReason, setSelectedMistakeReason] = useState<MistakeReasonDetail | null>(null);
  const [selectedMistakeReasonIds, setSelectedMistakeReasonIds] = useState<string[]>([]);
  const [analyzedMistakeReasons, setAnalyzedMistakeReasons] = useState<MistakeReasonDetail[]>([]);
  const [mistakeReasonUsageStatus, setMistakeReasonUsageStatus] = useState<MistakeReasonUsageStatus | null>(null);
  const [isMistakeReasonAllowed, setIsMistakeReasonAllowed] = useState(true);
  const [isReasonsLoading, setIsReasonsLoading] = useState(Boolean(resolvedBackendAttemptId));
  const [mistakeReasonsError, setMistakeReasonsError] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    if (!resolvedBackendAttemptId) {
      setIsLoading(false);
      return () => {
        active = false;
      };
    }

    const loadBackendReview = async () => {
      setIsLoading(true);
      try {
        const response = isMarathonContext
          ? await (async () => {
              const [attemptResponse, resultResponse] = await Promise.all([
                studentMarathonService.getAttempt(marathonIdParam, marathonDayNumber, resolvedBackendAttemptId),
                studentMarathonService.reviewAttempt(marathonIdParam, marathonDayNumber, resolvedBackendAttemptId),
              ]);
              return adaptMarathonListeningReviewResponse({
                attempt: attemptResponse,
                result: resultResponse,
                routeId: testId,
              });
            })()
          : await studentAttemptsService.review(resolvedBackendAttemptId);
        if (!active) return;
        if (!response) {
          setReviewPayload(null);
          setBackendReview(null);
          return;
        }
        setReviewPayload(response);
        setBackendReview(adaptListeningBackendReview(response));
      } catch {
        if (!active) return;
        setReviewPayload(null);
        setBackendReview(null);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void loadBackendReview();

    return () => {
      active = false;
    };
  }, [isMarathonContext, marathonDayNumber, marathonIdParam, resolvedBackendAttemptId, testId]);

  useEffect(() => {
    let active = true;

    if (!resolvedBackendAttemptId || isMarathonContext) {
      setIsReasonsLoading(false);
      setMistakeReasons([]);
      return () => {
        active = false;
      };
    }

    const loadMistakeReasons = async () => {
      setIsReasonsLoading(true);
      setMistakeReasonsError(null);
      try {
        const response = await studentMistakeReasonsService.listForAttemptWithUsage(resolvedBackendAttemptId);
        if (!active) return;
        setMistakeReasons(response.results);
        setMistakeReasonUsageStatus(response.usage_status);
        setIsMistakeReasonAllowed(response.is_ai_allowed);
      } catch (error) {
        if (!active) return;
        setMistakeReasons([]);
        setMistakeReasonUsageStatus(null);
        setIsMistakeReasonAllowed(false);
        setMistakeReasonsError(error instanceof Error ? error.message : "Could not load mistake reasons.");
      } finally {
        if (active) {
          setIsReasonsLoading(false);
        }
      }
    };

    void loadMistakeReasons();

    return () => {
      active = false;
    };
  }, [isMarathonContext, resolvedBackendAttemptId]);

  useEffect(() => {
    if (!actionNotice) return;
    const timer = window.setTimeout(() => setActionNotice(null), 2600);
    return () => window.clearTimeout(timer);
  }, [actionNotice]);

  const handleMistakeReasonSelect = (reason: MistakeReasonDetail) => {
    setMistakeReasonsError(null);
    setSelectedMistakeReason(reason);
    setSelectedMistakeReasonIds((current) => {
      if (current.includes(reason.id)) {
        return current.filter((id) => id !== reason.id);
      }
      return [...current, reason.id];
    });
  };

  const selectedMistakeReasons = useMemo(
    () => mistakeReasons.filter((reason) => selectedMistakeReasonIds.includes(reason.id)),
    [mistakeReasons, selectedMistakeReasonIds]
  );
  const canUseMistakeReasonAnalysis = isMistakeReasonAllowed || Boolean(mistakeReasonUsageStatus?.already_used_for_attempt);
  const aiAnalysisNotice =
    actionNotice || (!canUseMistakeReasonAnalysis ? mistakeReasonUsageStatus?.reset_message || "AI analysis is not available for this attempt yet." : null);

  const scrollToAiInsights = () => {
    if (isReasonsLoading) {
      setActionNotice("AI analysis is still loading. Please try again in a moment.");
      return;
    }

    if (!canUseMistakeReasonAnalysis || !mistakeReasons.length) {
      setActionNotice(mistakeReasonUsageStatus?.reset_message || "AI analysis is not available for this attempt yet.");
      return;
    }

    setMistakeModalOpen(true);
  };

  const handleAnalyzeMistakes = async () => {
    if (!selectedMistakeReasons.length || !canUseMistakeReasonAnalysis || !resolvedBackendAttemptId) return;
    setIsMistakeAnalyzing(true);
    setMistakeReasonsError(null);
    try {
      const response = await studentMistakeReasonsService.selectForAttempt(resolvedBackendAttemptId, selectedMistakeReasonIds);
      const detailedReasons = response.results.length ? response.results : selectedMistakeReasons;
      setMistakeReasonUsageStatus(response.usage_status);
      setIsMistakeReasonAllowed(response.is_ai_allowed || Boolean(response.usage_status?.already_used_for_attempt));
      setAnalyzedMistakeReasons(detailedReasons);
      setSelectedMistakeReason(detailedReasons[0] ?? null);

      window.setTimeout(() => {
      setIsMistakeAnalyzing(false);
      setMistakeModalOpen(false);
      setShowAiInsights(true);
      window.setTimeout(() => {
        aiInsightsRef.current?.scrollIntoView({behavior: "smooth", block: "start"});
      }, 80);
      }, 900);
    } catch (error) {
      setIsMistakeAnalyzing(false);
      setMistakeReasonsError(error instanceof Error ? error.message : "Could not analyze selected mistake reasons.");
    }
  };

  const categoryQuestionNumbers = useMemo(
    () => getListeningCategoryQuestionNumbers(reviewPayload),
    [reviewPayload]
  );

  useEffect(() => {
    if (resolvedBackendAttemptId) return;
    const backendId = localResult?.backendAttemptId?.trim() ?? "";
    if (!backendId || !isUuid(backendId)) return;
    router.replace(`/${locale}/listening/${testId}/result?attempt=${backendId}`);
  }, [locale, localResult?.backendAttemptId, resolvedBackendAttemptId, router, testId]);

  const gradeableQuestions = useMemo<GradeableQuestion[]>(() => {
    return (backendReview?.questions ?? []).map((question) => {
      const meta = backendReview?.answerMeta.find((item) => item.questionId === question.id);
      return {
        id: question.id,
        number: question.number,
        type: question.type,
        correctAnswer: meta?.correctAnswer,
        acceptableAnswers: meta?.acceptableAnswers,
      };
    });
  }, [backendReview]);

  const gradingAnswers = useMemo(
    () => normalizeStoredAnswers(backendReview?.answers ?? {}),
    [backendReview],
  );

  const grading = useMemo(() => {
    // Correctness always comes from the backend's verdicts, never re-graded locally.
    if (backendReview?.verdicts?.length) {
      return gradeTestFromBackendVerdicts(backendReview.verdicts);
    }
    if (!gradeableQuestions.length) return null;
    return gradeTest(gradeableQuestions, gradingAnswers);
  }, [backendReview, gradeableQuestions, gradingAnswers]);

  if (!resolvedBackendAttemptId) {
    if (!localAttemptId) {
      return (
        <div className="mx-auto mt-8 max-w-3xl px-4">
          <Card className="p-6">
            <h1 className="text-xl font-semibold">{tResults("missingAttemptTitle")}</h1>
            <p className="mt-2 text-sm text-muted-foreground">Attempt ID is required to load backend results.</p>
            <Button className="mt-4" asChild>
              <Link href={`/${locale}/listening/${testId}`}>{tResults("retakeTest")}</Link>
            </Button>
          </Card>
        </div>
      );
    }

    if (!localResult) {
      return (
        <div className="mx-auto mt-8 max-w-3xl px-4">
          <Card className="p-6">
            <h1 className="text-xl font-semibold">{tResults("missingAttemptTitle")}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{tResults("missingAttemptDescription")}</p>
            <Button className="mt-4" asChild>
              <Link href={`/${locale}/listening/${testId}`}>{tResults("retakeTest")}</Link>
            </Button>
          </Card>
        </div>
      );
    }

    const test = getListeningTestById(testId);
    const title = test?.title || "Listening Test";
    const total = test?.totalQuestions ?? 40;
    const answered = Object.values(localResult.answers ?? {}).filter((value) => {
      if (typeof value === "string") return value.trim().length > 0;
      if (Array.isArray(value)) return value.length > 0;
      return false;
    }).length;
    const flagged = localResult.markedQuestionIds?.length ?? 0;
    const elapsedSeconds = Math.max(0, Math.floor(((localResult.finishedAt ?? Date.now()) - localResult.startedAt) / 1000));
    const mm = Math.floor(elapsedSeconds / 60).toString().padStart(2, "0");
    const ss = (elapsedSeconds % 60).toString().padStart(2, "0");

    return (
      <section className="mx-auto w-full max-w-3xl space-y-4 px-4 pb-10 pt-6">
        <Card className="rounded-3xl border-border/70 bg-card/80 p-6">
          <p className="text-xs font-medium tracking-wider text-muted-foreground">LISTENING RESULT</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{title}</h1>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-border/70 bg-background/40 p-4">
              <p className="text-[11px] font-medium text-muted-foreground">Answered</p>
              <p className="mt-1 text-xl font-semibold">{answered} / {total}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/40 p-4">
              <p className="text-[11px] font-medium text-muted-foreground">Flagged</p>
              <p className="mt-1 text-xl font-semibold">{flagged}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/40 p-4">
              <p className="text-[11px] font-medium text-muted-foreground">Time used</p>
              <p className="mt-1 text-xl font-semibold">{mm}:{ss}</p>
            </div>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            You finished as a guest. Your answers are saved on this device. Create an account to get scoring, band estimate, explanations, and to sync this attempt to your history.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <Button asChild>
              <Link href={`/${locale}/register`}>Create account</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/${locale}/login`}>Log in</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href={`/${locale}/listening/${testId}`}>{tResults("retakeTest")}</Link>
            </Button>
          </div>
        </Card>
      </section>
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto mt-8 max-w-3xl px-4">
        <Card className="p-6 text-sm text-muted-foreground">Loading backend result...</Card>
      </div>
    );
  }

  if (!backendReview || !grading) {
    return (
      <div className="mx-auto mt-8 max-w-3xl px-4">
        <Card className="p-6">
          <h1 className="text-xl font-semibold">{tResults("missingAttemptTitle")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {tResults("missingAttemptDescription")}
          </p>
          <Button className="mt-4" asChild>
            <Link href={`/${locale}/listening/${testId}`}>{tResults("retakeTest")}</Link>
          </Button>
        </Card>
      </div>
    );
  }

  const timeUsedSeconds = Math.max(0, reviewPayload?.time_used_seconds ?? 0);
  const minutes = Math.floor(timeUsedSeconds / 60).toString().padStart(2, "0");
  const seconds = (timeUsedSeconds % 60).toString().padStart(2, "0");
  const testTitle = reviewPayload?.test_title || "Listening Test";
  const reviewHref = resolvedBackendAttemptId
    ? `/${locale}/listening/${testId}?review=1&attempt=${resolvedBackendAttemptId}${reviewQuerySuffix}`
    : "#review-main";
  const retakeHref = isMarathonContext
    ? `/${locale}/listening/${testId}?restart=1${reviewQuerySuffix}`
    : undefined;

  return (
    <section className="mx-auto w-full max-w-445 space-y-5 px-2 pb-10 pt-4 sm:px-4 lg:px-6">
      <ListeningResultSummaryHeader
        testId={testId}
        testTitle={testTitle}
        correct={grading.correctCount}
        incorrect={grading.incorrectCount}
        unanswered={grading.unansweredCount}
        total={grading.total}
        scorePercent={grading.scorePercent}
        estimatedBand={backendReview.stats.estimatedBand}
        timerUsed={Boolean(reviewPayload?.time_used_seconds)}
        minutes={minutes}
        seconds={seconds}
        reviewHref={reviewHref}
        reviewVariant="analysis"
        showAiAnalysisButton={!isMarathonContext}
        aiAnalysisNotice={isMarathonContext ? actionNotice : aiAnalysisNotice}
        onAiAnalysisClick={isMarathonContext ? undefined : scrollToAiInsights}
        backHref={returnHref}
        backLabel={returnLabel}
        retakeHref={retakeHref}
        feedbackAction={
          <DashboardFeedbackButton
            className="h-10 rounded-xl border-blue-200 bg-white/90 px-4 font-semibold text-blue-700 shadow-sm shadow-blue-100/60 hover:border-blue-300 hover:bg-blue-50 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-100 dark:shadow-none dark:hover:bg-blue-500/15"
            onNotice={(notice) => setActionNotice(`${notice.title}: ${notice.description}`)}
          />
        }
      />

      {isMarathonContext ? (
        <MarathonResultVideoCard
          marathonId={marathonIdParam}
          dayNumber={marathonDayNumber}
          contentId={testId}
          contentType="listening"
        />
      ) : null}

      <ListeningSectionPerformance items={backendReview.sectionPerformance} />
      <ListeningTypePerformance items={backendReview.typePerformance} />

      {!isMarathonContext ? (
        <PostTestMistakeReasonsPanel
          open={mistakeModalOpen}
          reasons={mistakeReasons}
          selectedReasonIds={selectedMistakeReasonIds}
          isLoading={isReasonsLoading}
          isAnalyzing={isMistakeAnalyzing}
          error={mistakeReasonsError}
          canAnalyze={canUseMistakeReasonAnalysis}
          disabledReason={mistakeReasonUsageStatus?.reset_message || null}
          categoryQuestionNumbers={categoryQuestionNumbers}
          onOpenChange={setMistakeModalOpen}
          onToggleReason={handleMistakeReasonSelect}
          onAnalyze={handleAnalyzeMistakes}
        />
      ) : null}

        {showAiInsights && !isMarathonContext ? (
          <div ref={aiInsightsRef} id="ai-insights" className="scroll-mt-24">
          <MistakeReasonAiResponseCard selectedReason={selectedMistakeReason} selectedReasons={analyzedMistakeReasons} />
          </div>
        ) : null}
    </section>
  );
}
