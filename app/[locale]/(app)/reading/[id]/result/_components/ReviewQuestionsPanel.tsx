"use client";

import { CheckCircle2, ChevronDown, ChevronUp, CircleDashed, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ReadingQuestion } from "@/data/reading-tests";
import type { GradeTestResult } from "@/lib/grading";
import { getReadingAnswerMeta } from "@/data/reading-answer-keys";

type ReviewQuestionsPanelProps = {
  questions: ReadingQuestion[];
  answers: Record<string, string | string[] | null>;
  grading: GradeTestResult;
  expanded: Set<string>;
  onToggleExplanation: (questionId: string) => void;
  onJumpEvidence: (questionId: string) => void;
};

type QuestionStatus = "correct" | "incorrect" | "skipped";

function toTypeLabel(type: ReadingQuestion["type"]) {
  switch (type) {
    case "tfng":
      return "True / False / Not Given";
    case "mcq":
      return "Multiple Choice";
    case "matchingHeadings":
      return "Matching Headings";
    case "matchingInfo":
      return "Matching Information";
    case "sentenceCompletion":
      return "Sentence Completion";
    default:
      return type;
  }
}

function normalizeAnswerValue(value: string | string[] | null | undefined) {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.join(", ");
  return "";
}

function getQuestionStatus(grading: GradeTestResult, questionId: string): QuestionStatus {
  const result = grading.byQuestion[questionId];
  if (!result?.normalizedUser) return "skipped";
  return result.isCorrect ? "correct" : "incorrect";
}

export function ReviewQuestionsPanel({
  questions,
  answers,
  grading,
  expanded,
  onToggleExplanation,
  onJumpEvidence,
}: ReviewQuestionsPanelProps) {
  const t = useTranslations("readingReview");

  return (
    <Card className="min-h-0 overflow-hidden border-border/80 bg-card/70 py-0">
      <div className="sticky top-0 z-20 border-b border-border/70 bg-card/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between gap-2">
          <p className="text-base font-semibold">{t("questionReview")}</p>
          <p className="text-xs tracking-[0.14em] text-muted-foreground uppercase">
            {t("scoreSummary", {
              correct: grading.correctCount,
              total: grading.total,
              percent: grading.scorePercent,
            })}
          </p>
        </div>
        <div className="mt-2 flex overflow-x-auto pb-1 [scrollbar-width:thin]">
          <div className="inline-flex items-center gap-1">
            {questions.map((question) => {
              const status = getQuestionStatus(grading, question.id);
              return (
                <a
                  key={`quick-${question.id}`}
                  href={`#review-question-${question.id}`}
                  className={cn(
                    "inline-flex h-7 min-w-7 items-center justify-center rounded-md border px-1 text-xs font-semibold transition-colors",
                    status === "correct" && "border-emerald-500/60 bg-emerald-500/20 text-emerald-100",
                    status === "incorrect" && "border-rose-500/60 bg-rose-500/20 text-rose-100",
                    status === "skipped" && "border-border bg-background/50 text-muted-foreground"
                  )}
                >
                  {question.number}
                </a>
              );
            })}
          </div>
        </div>
      </div>

      <div className="h-[68vh] space-y-3 overflow-y-auto p-4">
        {questions.map((question) => {
          const status = getQuestionStatus(grading, question.id);
          const answerMeta = getReadingAnswerMeta(question.id);
          const isOpen = expanded.has(question.id);
          const userAnswer = normalizeAnswerValue(answers[question.id]);
          const correctAnswer = Array.isArray(answerMeta?.correctAnswer)
            ? answerMeta?.correctAnswer.join(", ")
            : answerMeta?.correctAnswer ?? "";

          return (
            <Card
              id={`review-question-${question.id}`}
              key={question.id}
              className={cn(
                "border p-4",
                status === "correct" && "border-emerald-500/40 bg-emerald-500/5",
                status === "incorrect" && "border-rose-500/45 bg-rose-500/10",
                status === "skipped" && "border-border/80 bg-background/45"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-base font-semibold leading-snug">
                    {question.number}. {question.prompt}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{toTypeLabel(question.type)}</p>
                </div>

                <div className="mt-0.5 flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold">
                  {status === "correct" ? (
                    <>
                      <CheckCircle2 className="size-3.5 text-emerald-400" />
                      <span className="text-emerald-300">{t("correct")}</span>
                    </>
                  ) : status === "incorrect" ? (
                    <>
                      <XCircle className="size-3.5 text-rose-400" />
                      <span className="text-rose-300">{t("incorrect")}</span>
                    </>
                  ) : (
                    <>
                      <CircleDashed className="size-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">{t("skipped")}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="mt-3 grid gap-2 text-sm">
                <p>
                  <span className="font-medium text-muted-foreground">{t("yourAnswer")}:</span>{" "}
                  <span className={cn(status === "incorrect" && "text-rose-200", status === "correct" && "text-emerald-200")}>
                    {userAnswer || "-"}
                  </span>
                </p>
                <p>
                  <span className="font-medium text-muted-foreground">{t("correctAnswer")}:</span>{" "}
                  <span className="text-emerald-200">{correctAnswer || t("notAvailable")}</span>
                </p>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="ghost" size="sm" onClick={() => onToggleExplanation(question.id)}>
                  {isOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                  {isOpen ? t("hideExplanation") : t("showExplanation")}
                </Button>
                <Button variant="outline" size="sm" onClick={() => onJumpEvidence(question.id)}>
                  {t("jumpToEvidence")}
                </Button>
              </div>

              {isOpen ? (
                <div className="mt-3 rounded-lg border border-border/70 bg-background/45 p-3 text-sm">
                  <p>{answerMeta?.explanation ?? t("notAvailable")}</p>
                  {answerMeta?.evidence.startQuote ? (
                    <p className="mt-2 text-xs text-muted-foreground">{answerMeta.evidence.startQuote}</p>
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
