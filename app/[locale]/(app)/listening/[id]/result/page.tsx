"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { CheckCircle2, HelpCircle, RotateCcw, XCircle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { getListeningTestById } from "@/data/listening-tests-full";
import { getListeningAnswerMeta } from "@/data/listening-answer-keys";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { gradeTest, type GradeableQuestion } from "@/lib/grading";
import { flattenListeningQuestions } from "@/lib/listening-questions";
import { loadAttemptResult } from "@/lib/test-attempt-storage";
import { cn } from "@/lib/utils";

export default function ListeningResultPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations("testResults");

  const testId = typeof params?.id === "string" ? params.id : "";
  const attemptId = searchParams.get("attempt") ?? "";
  const test = getListeningTestById(testId);

  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [activeEvidenceQuestionId, setActiveEvidenceQuestionId] = useState<string | null>(null);

  const flatQuestions = useMemo(() => {
    if (!test) return [];
    return flattenListeningQuestions(test.id, test.sections);
  }, [test]);

  const attempt = useMemo(() => {
    if (!test || !attemptId) return null;
    return loadAttemptResult("listening", test.id, attemptId);
  }, [attemptId, test]);

  const gradeable = useMemo<GradeableQuestion[]>(() => {
    return flatQuestions.map((question) => {
      const meta = getListeningAnswerMeta(question.id);
      return {
        id: question.id,
        number: question.number,
        type: question.type,
        correctAnswer: meta?.correctAnswer,
        acceptableAnswers: meta?.acceptableAnswers,
      };
    });
  }, [flatQuestions]);

  const grading = useMemo(() => {
    if (!attempt) return null;
    return gradeTest(gradeable, attempt.answers);
  }, [attempt, gradeable]);

  if (!test || !attempt || !grading) {
    return (
      <div className="mx-auto mt-8 max-w-3xl px-4">
        <Card className="p-6">
          <h1 className="text-xl font-semibold">{t("missingAttemptTitle")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("missingAttemptDescription")}</p>
          <Button className="mt-4" asChild>
            <Link href={`/${locale}/listening/${testId}`}>{t("retakeTest")}</Link>
          </Button>
        </Card>
      </div>
    );
  }

  const timeTakenSec = Math.max(0, attempt.finishedAt ? Math.floor((attempt.finishedAt - attempt.startedAt) / 1000) : 0);
  const minutes = Math.floor(timeTakenSec / 60).toString().padStart(2, "0");
  const seconds = (timeTakenSec % 60).toString().padStart(2, "0");

  return (
    <section className="mx-auto w-full max-w-[1280px] space-y-4 px-3 pb-8 pt-4 sm:px-5 lg:px-8">
      <Card className="grid gap-4 p-5 md:grid-cols-[1.2fr_1fr]">
        <div>
          <p className="text-sm text-muted-foreground">{test.title}</p>
          <h1 className="text-2xl font-semibold">{t("title")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("scoreSummary", { correct: grading.correctCount, total: grading.total, percent: grading.scorePercent })}</p>
          <p className="mt-1 text-sm text-blue-600">{t("estimatedBand")}</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-3 md:grid-cols-1">
          <Card className="p-3"><p className="text-xs text-muted-foreground">{t("correct")}</p><p className="text-lg font-semibold text-emerald-600">{grading.correctCount}</p></Card>
          <Card className="p-3"><p className="text-xs text-muted-foreground">{t("incorrect")}</p><p className="text-lg font-semibold text-rose-600">{grading.incorrectCount}</p></Card>
          <Card className="p-3"><p className="text-xs text-muted-foreground">{t("unanswered")}</p><p className="text-lg font-semibold text-muted-foreground">{grading.unansweredCount}</p></Card>
        </div>
      </Card>

      <Card className="flex flex-wrap gap-2 p-4">
        <Button asChild><Link href="#question-review">{t("reviewAnswers")}</Link></Button>
        <Button variant="outline" asChild><Link href={`/${locale}/listening/${test.id}`}><RotateCcw className="size-4" />{t("retakeTest")}</Link></Button>
        <p className="ml-auto text-sm text-muted-foreground">{t("timeTaken")}: {minutes}:{seconds}</p>
      </Card>

      <Card id="question-review" className="p-4">
        <p className="mb-3 text-sm font-semibold">{t("questionReview")}</p>
        {activeEvidenceQuestionId ? (
          <Card className="mb-3 border-amber-300 bg-amber-50/60 p-3 dark:bg-amber-500/10">
            <p className="text-sm font-medium">{t("evidenceViewer")}</p>
            <p className="mt-1 text-sm text-foreground/90">
              {getListeningAnswerMeta(activeEvidenceQuestionId)?.evidence.transcriptQuote ?? t("notAvailable")}
            </p>
          </Card>
        ) : null}
        <div className="grid grid-cols-8 gap-1 sm:grid-cols-10">
          {flatQuestions.map((question) => {
            const result = grading.byQuestion[question.id];
            const marked = attempt.markedQuestionIds.includes(question.id);
            return (
              <a
                key={question.id}
                href={`#review-${question.id}`}
                className={cn(
                  "inline-flex h-8 items-center justify-center rounded-md border text-xs font-medium",
                  result?.isCorrect && "border-emerald-200 bg-emerald-50 text-emerald-700",
                  !result?.isCorrect && result?.normalizedUser && "border-rose-200 bg-rose-50 text-rose-700",
                  !result?.normalizedUser && "border-border bg-muted/20 text-muted-foreground",
                  marked && "ring-2 ring-amber-400/70"
                )}
              >
                {question.number}
              </a>
            );
          })}
        </div>

        <div className="mt-4 space-y-3">
          {flatQuestions.map((question) => {
            const result = grading.byQuestion[question.id];
            const meta = getListeningAnswerMeta(question.id);
            const yourAnswer = attempt.answers[question.id];
            const open = expanded.has(question.id);

            return (
              <Card
                key={question.id}
                id={`review-${question.id}`}
                className={cn(
                  "p-3",
                  result?.isCorrect && "border-emerald-300",
                  !result?.isCorrect && result?.normalizedUser && "border-rose-300",
                  !result?.normalizedUser && "border-border"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">{question.number}. {question.prompt}</p>
                    <p className="text-xs text-muted-foreground">{question.sectionTitle} - {question.type}</p>
                  </div>
                  {result?.isCorrect ? <CheckCircle2 className="size-4 text-emerald-600" /> : <XCircle className="size-4 text-rose-600" />}
                </div>
                <p className="mt-2 text-sm"><span className="font-medium">{t("yourAnswer")}:</span> {typeof yourAnswer === "string" ? yourAnswer || "-" : "-"}</p>
                <p className="text-sm"><span className="font-medium">{t("correctAnswer")}:</span> {Array.isArray(meta?.correctAnswer) ? meta?.correctAnswer.join(", ") : (meta?.correctAnswer ?? t("notAvailable"))}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setExpanded((prev) => {
                        const next = new Set(prev);
                        if (next.has(question.id)) next.delete(question.id);
                        else next.add(question.id);
                        return next;
                      });
                    }}
                  >
                    <HelpCircle className="size-4" />
                    {t("explain")}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setActiveEvidenceQuestionId(question.id)}>
                    {t("showEvidence")}
                  </Button>
                </div>
                {open ? (
                  <div className="mt-3 rounded-md border bg-muted/20 p-3 text-sm">
                    <p>{meta?.explanation ?? t("notAvailable")}</p>
                    {meta?.evidence.transcriptQuote ? <p className="mt-1 text-xs text-muted-foreground">{meta.evidence.transcriptQuote}</p> : null}
                  </div>
                ) : null}
              </Card>
            );
          })}
        </div>
      </Card>
    </section>
  );
}
