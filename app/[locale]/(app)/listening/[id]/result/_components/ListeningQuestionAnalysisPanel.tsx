"use client";

import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleDashed,
  XCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getListeningAnswerMeta } from "@/data/listening-answer-keys";
import type { FlattenedListeningQuestion } from "@/lib/listening-questions";
import type { GradeTestResult } from "@/lib/grading";
import { cn } from "@/lib/utils";

type ListeningQuestionAnalysisPanelProps = {
  questions: FlattenedListeningQuestion[];
  answers: Record<string, string | string[] | null>;
  grading: GradeTestResult;
  expanded: Set<string>;
  onToggleExplanation: (questionId: string) => void;
  onJumpEvidence: (questionId: string) => void;
};

type QuestionStatus = "correct" | "incorrect" | "skipped";

function normalizeAnswerValue(value: string | string[] | null | undefined) {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.join(", ");
  return "";
}

function getQuestionStatus(
  grading: GradeTestResult,
  questionId: string,
): QuestionStatus {
  const result = grading.byQuestion[questionId];
  if (!result?.normalizedUser) return "skipped";
  return result.isCorrect ? "correct" : "incorrect";
}

function getStatusStyles(status: QuestionStatus) {
  if (status === "correct") {
    return {
      card: "border-emerald-200 bg-emerald-50 dark:border-emerald-400/30 dark:bg-emerald-500/[0.07]",
      dot: "border-emerald-300 bg-emerald-100 text-emerald-700 dark:border-emerald-400/50 dark:bg-emerald-500/25 dark:text-emerald-200",
      nav: "border-emerald-300 bg-emerald-100 text-emerald-700 dark:border-emerald-500/55 dark:bg-emerald-500/20 dark:text-emerald-100",
      answer: "text-emerald-700 dark:text-emerald-200",
    };
  }

  if (status === "incorrect") {
    return {
      card: "border-rose-200 bg-rose-50 dark:border-rose-400/35 dark:bg-rose-500/[0.1]",
      dot: "border-rose-300 bg-rose-100 text-rose-700 dark:border-rose-400/55 dark:bg-rose-500/25 dark:text-rose-200",
      nav: "border-rose-300 bg-rose-100 text-rose-700 dark:border-rose-500/55 dark:bg-rose-500/20 dark:text-rose-100",
      answer: "text-rose-700 dark:text-rose-200",
    };
  }

  return {
    card: "border-slate-200 bg-white dark:border-border/70 dark:bg-background/40",
    dot: "border-slate-300 bg-slate-100 text-slate-600 dark:border-border/80 dark:bg-background/65 dark:text-muted-foreground",
    nav: "border-slate-300 bg-white text-slate-600 dark:border-border/70 dark:bg-background/55 dark:text-muted-foreground",
    answer: "text-slate-700 dark:text-muted-foreground",
  };
}

export function ListeningQuestionAnalysisPanel({
  questions,
  answers,
  grading,
  expanded,
  onToggleExplanation,
  onJumpEvidence,
}: ListeningQuestionAnalysisPanelProps) {
  const t = useTranslations("listeningResult");

  return (
    <Card className="flex h-[80vh] min-h-0 w-full max-w-full flex-col overflow-hidden rounded-3xl border-slate-200/85 bg-white/95 py-0 shadow-sm shadow-slate-200/50 dark:border-border/75 dark:bg-card/75 dark:shadow-none xl:h-[85vh]">
      <div className="sticky top-0 z-20 min-w-0 max-w-full border-b border-slate-200/90 bg-white/95 px-3.5 py-3 backdrop-blur dark:border-border/70 dark:bg-card/95 sm:px-4">
        <div className="space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-base font-semibold">{t("questionAnalysis")}</p>
            <p className="text-xs tracking-[0.14em] text-muted-foreground uppercase">
              {t("scoreSummary", {
                correct: grading.correctCount,
                total: grading.total,
              })}
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            {t("questionNavigator")}
          </p>

          <div className="overflow-x-scroll max-w-[calc(80vw)] pb-1 [scrollbar-width:thin]">
            <div className="inline-flex items-center gap-1 pr-2">
              {questions.map((question) => {
                const status = getQuestionStatus(grading, question.id);
                const styles = getStatusStyles(status);

                return (
                  <a
                    key={`quick-${question.id}`}
                    href={`#review-question-${question.id}`}
                    className={cn(
                      "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors",
                      styles.nav,
                    )}
                  >
                    {question.number}
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="min-h-0 min-w-0 max-w-full flex-1 space-y-3 overflow-y-auto px-3.5 pb-4 pt-3 [scrollbar-width:thin] sm:px-4">
        {questions.map((question) => {
          const status = getQuestionStatus(grading, question.id);
          const statusStyles = getStatusStyles(status);
          const answerMeta = getListeningAnswerMeta(question.id);
          const isOpen = expanded.has(question.id);
          const userAnswer = normalizeAnswerValue(answers[question.id]);
          const correctAnswer = Array.isArray(answerMeta?.correctAnswer)
            ? answerMeta.correctAnswer.join(", ")
            : (answerMeta?.correctAnswer ?? "");

          return (
            <Card
              id={`review-question-${question.id}`}
              key={question.id}
              className={cn(
                "min-w-0 max-w-full gap-0 overflow-hidden rounded-2xl p-4 shadow-none",
                statusStyles.card,
              )}
            >
              <div className="flex min-w-0 max-w-full flex-col items-start gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                <div className="min-w-0 w-full max-w-full space-y-1.5">
                  <p className="wrap-break-word text-base leading-snug font-semibold">
                    {question.number}. {question.prompt}
                  </p>
                  <div className="flex min-w-0 max-w-full flex-wrap gap-1.5">
                    <Badge
                      variant="outline"
                      className="max-w-full rounded-full text-[11px] text-foreground/85"
                    >
                      {question.sectionTitle}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="max-w-full rounded-full text-[11px] text-foreground/85"
                    >
                      {t(`questionTypes.${question.type}`)}
                    </Badge>
                  </div>
                </div>

                <div
                  className={cn(
                    "mt-0.5 flex shrink-0 items-center gap-1 self-start rounded-full border px-2 py-1 text-[11px] font-semibold",
                    statusStyles.dot,
                  )}
                >
                  {status === "correct" ? (
                    <>
                      <CheckCircle2 className="size-3.5" />
                      <span>{t("correctStatus")}</span>
                    </>
                  ) : status === "incorrect" ? (
                    <>
                      <XCircle className="size-3.5" />
                      <span>{t("incorrectStatus")}</span>
                    </>
                  ) : (
                    <>
                      <CircleDashed className="size-3.5" />
                      <span>{t("skippedStatus")}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="mt-3 grid gap-2 text-sm">
                <p>
                  <span className="font-medium text-muted-foreground">
                    {t("yourAnswer")}:
                  </span>{" "}
                  <span className={cn("wrap-break-word", statusStyles.answer)}>
                    {userAnswer || t("noAnswer")}
                  </span>
                </p>
                <p>
                  <span className="font-medium text-muted-foreground">
                    {t("correctAnswer")}:
                  </span>{" "}
                  <span className="wrap-break-word text-emerald-700 dark:text-emerald-200">
                    {correctAnswer || t("notAvailable")}
                  </span>
                </p>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 rounded-lg px-2.5 text-xs"
                  onClick={() => onToggleExplanation(question.id)}
                >
                  {isOpen ? (
                    <ChevronUp className="size-4" />
                  ) : (
                    <ChevronDown className="size-4" />
                  )}
                  {isOpen ? t("hideExplanation") : t("explain")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-lg border-slate-200 bg-white px-2.5 text-xs hover:bg-slate-100 dark:border-border/70 dark:bg-background/45 dark:hover:bg-background/60"
                  onClick={() => onJumpEvidence(question.id)}
                >
                  {t("jumpToEvidence")}
                </Button>
              </div>

              {isOpen ? (
                <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/90 p-3 text-sm dark:border-border/70 dark:bg-background/50">
                  <p className="wrap-break-word">
                    {answerMeta?.explanation ?? t("notAvailable")}
                  </p>
                  {answerMeta?.evidence.transcriptQuote ? (
                    <p className="mt-2 wrap-break-word text-xs text-muted-foreground">
                      {answerMeta.evidence.transcriptQuote}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </Card>
          );
        })}
      </div>
    </Card>
  );
}
