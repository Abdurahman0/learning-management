"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { CheckCircle2, HelpCircle, RotateCcw, XCircle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { getReadingTestById } from "@/data/reading-tests";
import { getReadingAnswerMeta } from "@/data/reading-answer-keys";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { gradeTest, type GradeableQuestion } from "@/lib/grading";
import { loadAttemptResult } from "@/lib/test-attempt-storage";
import { cn } from "@/lib/utils";

export default function ReadingResultPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations("testResults");

  const testId = typeof params?.id === "string" ? params.id : "";
  const attemptId = searchParams.get("attempt") ?? "";
  const test = getReadingTestById(testId);

  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [activePassageId, setActivePassageId] = useState<"p1" | "p2" | "p3">("p1");
  const [highlightedParagraph, setHighlightedParagraph] = useState<string | null>(null);
  const passageScrollRef = useRef<HTMLDivElement | null>(null);

  const attempt = useMemo(() => {
    if (!test || !attemptId) return null;
    return loadAttemptResult("reading", test.id, attemptId);
  }, [attemptId, test]);

  const gradeableQuestions = useMemo<GradeableQuestion[]>(() => {
    if (!test) return [];
    return test.questions.map((question) => {
      const meta = getReadingAnswerMeta(question.id);
      return {
        id: question.id,
        number: question.number,
        type: question.type,
        correctAnswer: meta?.correctAnswer,
        acceptableAnswers: meta?.acceptableAnswers,
      };
    });
  }, [test]);

  const grading = useMemo(() => {
    if (!test || !attempt) return null;
    return gradeTest(gradeableQuestions, attempt.answers);
  }, [attempt, gradeableQuestions, test]);

  const accuracyByType = useMemo(() => {
    if (!test || !grading) return [] as Array<{ label: string; value: string }>;
    const buckets = new Map<string, { correct: number; total: number }>();

    for (const question of test.questions) {
      const result = grading.byQuestion[question.id];
      const prev = buckets.get(question.type) ?? { correct: 0, total: 0 };
      prev.total += 1;
      if (result?.isCorrect) prev.correct += 1;
      buckets.set(question.type, prev);
    }

    return [...buckets.entries()].map(([label, stats]) => ({
      label,
      value: `${stats.correct}/${stats.total}`,
    }));
  }, [grading, test]);

  useEffect(() => {
    if (!highlightedParagraph) return;
    const timer = window.setTimeout(() => setHighlightedParagraph(null), 2200);
    return () => window.clearTimeout(timer);
  }, [highlightedParagraph]);

  if (!test || !attempt || !grading) {
    return (
      <div className="mx-auto mt-8 max-w-3xl px-4">
        <Card className="p-6">
          <h1 className="text-xl font-semibold">{t("missingAttemptTitle")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("missingAttemptDescription")}</p>
          <Button className="mt-4" asChild>
            <Link href={`/${locale}/reading/${testId}`}>{t("retakeTest")}</Link>
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
          <p className="mt-2 text-sm text-muted-foreground">
            {t("scoreSummary", { correct: grading.correctCount, total: grading.total, percent: grading.scorePercent })}
          </p>
          <p className="mt-1 text-sm text-blue-600">{t("estimatedBand")}</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-3 md:grid-cols-1">
          <Card className="p-3">
            <p className="text-xs text-muted-foreground">{t("correct")}</p>
            <p className="text-lg font-semibold text-emerald-600">{grading.correctCount}</p>
          </Card>
          <Card className="p-3">
            <p className="text-xs text-muted-foreground">{t("incorrect")}</p>
            <p className="text-lg font-semibold text-rose-600">{grading.incorrectCount}</p>
          </Card>
          <Card className="p-3">
            <p className="text-xs text-muted-foreground">{t("unanswered")}</p>
            <p className="text-lg font-semibold text-muted-foreground">{grading.unansweredCount}</p>
          </Card>
        </div>
      </Card>

      <Card className="grid gap-4 p-4 md:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="#question-review">{t("reviewAnswers")}</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/${locale}/reading/${test.id}`}><RotateCcw className="size-4" />{t("retakeTest")}</Link>
            </Button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="p-3">
              <p className="text-xs text-muted-foreground">{t("timeTaken")}</p>
              <p className="text-base font-semibold">{minutes}:{seconds}</p>
              <p className="text-xs text-muted-foreground">{attempt.timerUsed ? t("timerUsed") : t("timerNotUsed")}</p>
            </Card>
            {accuracyByType.map((item) => (
              <Card className="p-3" key={item.label}>
                <p className="text-xs uppercase text-muted-foreground">{item.label}</p>
                <p className="text-base font-semibold">{item.value}</p>
              </Card>
            ))}
          </div>
        </div>

        <Card className="p-3">
          <p className="mb-2 text-sm font-semibold">{t("questionPalette")}</p>
          <div className="grid grid-cols-8 gap-1">
            {test.questions.map((question) => {
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
        </Card>
      </Card>

      <Card className="grid min-h-0 gap-4 overflow-hidden p-0 lg:grid-cols-[minmax(0,1fr)_420px]" id="question-review">
        <div className="min-w-0 space-y-3 overflow-y-auto p-4">
          {test.questions.map((question) => {
            const meta = getReadingAnswerMeta(question.id);
            const result = grading.byQuestion[question.id];
            const yourAnswer = attempt.answers[question.id];
            const isOpen = expanded.has(question.id);
            const paragraphKey = meta?.evidence.paragraphIndex != null ? `para-${meta.evidence.passageId}-${meta.evidence.paragraphIndex}` : null;

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
                    <p className="text-xs text-muted-foreground">{question.type}</p>
                  </div>
                  {result?.isCorrect ? <CheckCircle2 className="size-4 text-emerald-600" /> : <XCircle className="size-4 text-rose-600" />}
                </div>

                <p className="mt-2 text-sm"><span className="font-medium">{t("yourAnswer")}:</span> {typeof yourAnswer === "string" ? yourAnswer || "-" : Array.isArray(yourAnswer) ? yourAnswer.join(", ") : "-"}</p>
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (!meta?.evidence) return;
                      setActivePassageId(meta.evidence.passageId);
                      if (paragraphKey) {
                        setHighlightedParagraph(paragraphKey);
                        window.setTimeout(() => {
                          const target = document.getElementById(paragraphKey);
                          target?.scrollIntoView({ behavior: "smooth", block: "center" });
                        }, 50);
                      }
                    }}
                  >
                    {t("showEvidence")}
                  </Button>
                </div>

                {isOpen ? (
                  <div className="mt-3 rounded-md border bg-muted/20 p-3 text-sm">
                    <p>{meta?.explanation ?? t("notAvailable")}</p>
                    {meta?.evidence.startQuote ? <p className="mt-1 text-xs text-muted-foreground">{meta.evidence.startQuote}</p> : null}
                  </div>
                ) : null}
              </Card>
            );
          })}
        </div>

        <div className="min-w-0 border-t p-4 lg:border-l lg:border-t-0">
          <p className="mb-2 text-sm font-semibold">{t("evidenceViewer")}</p>
          <div className="mb-3 flex gap-2">
            {test.passages.map((passage, index) => (
              <Button key={passage.id} size="sm" variant={activePassageId === passage.id ? "default" : "outline"} onClick={() => setActivePassageId(passage.id)}>
                {t("passage", { index: index + 1 })}
              </Button>
            ))}
          </div>
          <Separator className="mb-3" />
          <div ref={passageScrollRef} className="max-h-[70vh] space-y-3 overflow-y-auto pr-1">
            <h3 className="text-lg font-semibold">{test.passages.find((p) => p.id === activePassageId)?.title}</h3>
            {(test.passages.find((p) => p.id === activePassageId)?.text ?? "").split("\n\n").map((paragraph, index) => {
              const id = `para-${activePassageId}-${index}`;
              return (
                <p
                  id={id}
                  key={id}
                  className={cn(
                    "rounded-md px-2 py-1 text-sm leading-relaxed text-foreground/90",
                    highlightedParagraph === id && "bg-amber-200/60 text-foreground dark:bg-amber-500/20"
                  )}
                >
                  {paragraph}
                </p>
              );
            })}
          </div>
        </div>
      </Card>
    </section>
  );
}
