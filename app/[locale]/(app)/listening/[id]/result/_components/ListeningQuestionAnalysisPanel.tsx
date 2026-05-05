"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { InlineBoldText } from "@/components/test/InlineBoldText";
import type { ListeningBlock } from "@/data/listening-tests-full";
import { formatAnswerForDisplay } from "@/lib/answer-display";
import type { FlattenedListeningQuestion } from "@/lib/listening-questions";
import type { GradeTestResult } from "@/lib/grading";
import { cn } from "@/lib/utils";
import type { ListeningBackendAnswerMeta } from "./backendReviewAdapters";

type ListeningQuestionAnalysisPanelProps = {
  questions: FlattenedListeningQuestion[];
  answers: Record<string, string | string[] | null>;
  answerMetaByQuestionId: Record<string, ListeningBackendAnswerMeta>;
  blocks?: ListeningBlock[];
  grading: GradeTestResult;
  expanded: Set<string>;
  onToggleExplanation: (questionId: string) => void;
  onJumpEvidence: (questionId: string) => void;
  scrollResetKey?: string;
  scrollToQuestionId?: string;
  showTopQuestionNavigator?: boolean;
  className?: string;
};

type QuestionStatus = "correct" | "incorrect" | "skipped";

type TemplateToken =
  | { kind: "text"; value: string; bold: boolean }
  | { kind: "placeholder"; questionNumber: number; bold: boolean };

function tokenizeTemplateTextWithBoldAndPlaceholders(text: string): TemplateToken[] {
  const tokens: TemplateToken[] = [];
  const re = /(\*\*|\{(\d+)\})/g;
  let lastIndex = 0;
  let bold = false;

  for (const match of text.matchAll(re)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      const value = text.slice(lastIndex, index);
      if (value) tokens.push({ kind: "text", value, bold });
    }

    const raw = match[1] ?? "";
    if (raw === "**") {
      bold = !bold;
    } else {
      const questionNumber = Number(match[2] ?? "");
      if (Number.isFinite(questionNumber) && questionNumber > 0) {
        tokens.push({ kind: "placeholder", questionNumber, bold });
      } else if (raw) {
        tokens.push({ kind: "text", value: raw, bold });
      }
    }

    lastIndex = index + raw.length;
  }

  if (lastIndex < text.length) {
    const value = text.slice(lastIndex);
    if (value) tokens.push({ kind: "text", value, bold });
  }

  return tokens;
}

function normalizeAnswerValue(value: string | string[] | null | undefined) {
  return formatAnswerForDisplay(value);
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
  answerMetaByQuestionId,
  blocks,
  grading,
  expanded,
  onToggleExplanation,
  onJumpEvidence,
  scrollResetKey,
  scrollToQuestionId,
  showTopQuestionNavigator = true,
  className,
}: ListeningQuestionAnalysisPanelProps) {
  const t = useTranslations("listeningResult");
  const [answersVisible, setAnswersVisible] = useState(false);
  const questionsContainerRef = useRef<HTMLDivElement | null>(null);
  const questionIdByNumber = useMemo(() => {
    const map = new Map<number, string>();
    for (const question of questions) {
      if (Number.isFinite(question.number)) {
        map.set(question.number, question.id);
      }
    }
    return map;
  }, [questions]);

  const normalizeCorrectAnswer = useMemo(() => {
    const cache = new Map<string, string>();
    for (const question of questions) {
      const meta = answerMetaByQuestionId[question.id];
      const value = formatAnswerForDisplay(meta?.correctAnswer);
      cache.set(question.id, value);
    }
    return cache;
  }, [answerMetaByQuestionId, questions]);

  const getQuestionId = (questionNumber: number) =>
    questionIdByNumber.get(questionNumber) ?? `q-${questionNumber}`;

  const getUserAnswerByNumber = (questionNumber: number) => {
    const questionId = getQuestionId(questionNumber);
    return answers[questionId];
  };

  const getStatusByNumber = (questionNumber: number): QuestionStatus => {
    const questionId = getQuestionId(questionNumber);
    return getQuestionStatus(grading, questionId);
  };

  const renderActions = (questionId: string) => {
    const isOpen = expanded.has(questionId);
    return (
      <div className="flex items-center gap-1.5">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 rounded-md px-2 text-[11px]"
          onClick={() => onToggleExplanation(questionId)}
        >
          {isOpen ? (
            <ChevronUp className="size-4" />
          ) : (
            <ChevronDown className="size-4" />
          )}
          {isOpen ? t("hideExplanation") : t("explain")}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 rounded-md border-border/70 bg-background/40 px-2 text-[11px] hover:bg-background/60"
          onClick={() => onJumpEvidence(questionId)}
        >
          {t("jumpToEvidence")}
        </Button>
      </div>
    );
  };

  const renderExplanation = (questionId: string) => {
    if (!expanded.has(questionId)) return null;
    const meta = answerMetaByQuestionId[questionId];
    const text = (meta?.explanation ?? "").trim();
    return (
      <div className="mt-2 rounded-xl border border-border/70 bg-background/55 p-3 text-sm">
        <p className="wrap-break-word">{text || t("notAvailable")}</p>
        {meta?.evidence.transcriptQuote ? (
          <p className="mt-2 wrap-break-word text-xs text-muted-foreground">
            {meta.evidence.transcriptQuote}
          </p>
        ) : null}
      </div>
    );
  };

  const renderCorrectAnswer = (questionId: string) => {
    if (!answersVisible) return null;
    const userAnswer = normalizeAnswerValue(answers[questionId]);
    const correctAnswer = normalizeCorrectAnswer.get(questionId) ?? "";
    return (
      <div className="mt-2 grid gap-1 text-xs text-muted-foreground">
        <p>
          <span className="font-medium">{t("yourAnswer")}:</span>{" "}
          <span className="font-semibold text-foreground">{userAnswer || t("noAnswer")}</span>
        </p>
        <p>
          <span className="font-medium">{t("correctAnswer")}:</span>{" "}
          <span className="font-semibold text-emerald-700 dark:text-emerald-200">
            {correctAnswer || t("notAvailable")}
          </span>
        </p>
      </div>
    );
  };

  const renderQuestionChip = (questionNumber: number, questionId: string, status: QuestionStatus) => {
    const styles = getStatusStyles(status);
    return (
      <span
        className={cn(
          "inline-flex h-7 min-w-7 items-center justify-center rounded-full border px-2 text-xs font-semibold",
          styles.dot
        )}
        aria-label={`${t("questionAnalysis")} ${questionNumber}`}
      >
        {questionNumber}
      </span>
    );
  };

  const renderTemplateTokens = (template: string) => {
    const tokens = tokenizeTemplateTextWithBoldAndPlaceholders(template);
    return tokens.map((token, idx) => {
      if (token.kind === "text") {
        const value = token.value;
        if (!value) return null;
        return token.bold ? (
          <strong key={`tmpl-${idx}`} className="font-semibold">
            {value}
          </strong>
        ) : (
          <span key={`tmpl-${idx}`}>{value}</span>
        );
      }

      const questionNumber = token.questionNumber;
      const questionId = getQuestionId(questionNumber);
      const status = getStatusByNumber(questionNumber);
      const value = normalizeAnswerValue(getUserAnswerByNumber(questionNumber));

      return (
        <span
          key={`tmpl-${idx}`}
          id={`review-question-${questionId}`}
          className="inline-flex items-center gap-2 scroll-mt-24"
        >
          {renderQuestionChip(questionNumber, questionId, status)}
          <Input
            readOnly
            value={value}
            placeholder="..."
            className="h-9 w-32 rounded-xl bg-background/70 text-sm shadow-none"
          />
          {renderActions(questionId)}
        </span>
      );
    });
  };

  useEffect(() => {
    if (!scrollResetKey) return;
    const container = questionsContainerRef.current;
    if (!container) return;
    if (scrollToQuestionId) {
      const target = container.querySelector<HTMLElement>(`#review-question-${scrollToQuestionId}`);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }
    container.scrollTo({top: 0, behavior: "smooth"});
  }, [scrollResetKey, scrollToQuestionId]);

  return (
    <Card
      className={cn(
        "flex h-[80vh] min-h-0 w-full max-w-full flex-col overflow-hidden rounded-3xl border-slate-200/85 bg-white/95 py-0 shadow-sm shadow-slate-200/50 dark:border-border/75 dark:bg-card/75 dark:shadow-none xl:h-[85vh]",
        className
      )}
    >
      <div className="sticky top-0 z-20 min-w-0 max-w-full border-b border-slate-200/90 bg-white/95 px-3.5 py-3 backdrop-blur dark:border-border/70 dark:bg-card/95 sm:px-4">
        <div className="space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-base font-semibold">{t("questionAnalysis")}</p>
            <div className="flex items-center gap-2">
              <p className="text-xs tracking-[0.14em] text-muted-foreground uppercase">
                {t("scoreSummary", {
                  correct: grading.correctCount,
                  total: grading.total,
                })}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 rounded-lg border-slate-200 bg-white px-2.5 text-xs hover:bg-slate-100 dark:border-border/70 dark:bg-background/45 dark:hover:bg-background/60"
                onClick={() => setAnswersVisible((previous) => !previous)}
              >
                {answersVisible ? t("hideAnswers") : t("showAnswers")}
              </Button>
            </div>
          </div>
          {showTopQuestionNavigator ? (
            <>
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
            </>
          ) : null}
        </div>
      </div>

      <div ref={questionsContainerRef} className="min-h-0 min-w-0 max-w-full flex-1 space-y-3 overflow-y-auto px-3.5 pb-4 pt-3 [scrollbar-width:thin] sm:px-4">
        {blocks?.length ? (
          <div className="space-y-3">
            {blocks.map((block, blockIndex) => {
              if (block.type === "noteForm") {
                return (
                  <Card
                    key={`block-${blockIndex}`}
                    className="min-w-0 max-w-full gap-0 overflow-hidden rounded-2xl border border-border/70 bg-background/40 p-4 shadow-none"
                  >
                    {block.groupRangeLabel ? (
                      <p className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                        {block.groupRangeLabel}
                      </p>
                    ) : null}
                    <h4 className="mt-1 text-center text-base font-semibold">
                      <InlineBoldText text={block.title} />
                    </h4>
                    {block.groupInstruction ? (
                      <p className="mt-2 text-sm text-muted-foreground">
                        <InlineBoldText text={block.groupInstruction} />
                      </p>
                    ) : null}

                    <div className="mt-4 space-y-3">
                      {block.fields.map((field) => {
                        const questionId = getQuestionId(field.questionNumber);
                        const status = getStatusByNumber(field.questionNumber);
                        const styles = getStatusStyles(status);
                        const userAnswer = normalizeAnswerValue(getUserAnswerByNumber(field.questionNumber));

                        return (
                          <div key={`field-${field.questionNumber}`} className="min-w-0">
                            <div className="flex min-w-0 items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <p className="wrap-break-word text-sm font-medium">
                                  <span className="mr-2 inline-flex align-middle">
                                    {renderQuestionChip(field.questionNumber, questionId, status)}
                                  </span>
                                  <InlineBoldText text={field.label} />
                                </p>
                              </div>
                              <div className="shrink-0">{renderActions(questionId)}</div>
                            </div>
                            <Input
                              readOnly
                              id={`review-question-${questionId}`}
                              value={userAnswer}
                              placeholder="..."
                              className={cn(
                                "mt-2 h-10 w-full rounded-xl bg-background/70 text-sm shadow-none",
                                styles.card
                              )}
                            />
                            {renderCorrectAnswer(questionId)}
                            {renderExplanation(questionId)}
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                );
              }

              if (block.type === "summaryCompletion") {
                const blockQuestionIds = new Set(
                  block.lines.map((line) => getQuestionId(line.questionNumber))
                );
                return (
                  <Card
                    key={`block-${blockIndex}`}
                    className="min-w-0 max-w-full gap-0 overflow-hidden rounded-2xl border border-border/70 bg-background/40 p-4 shadow-none"
                  >
                    {block.groupRangeLabel ? (
                      <p className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                        {block.groupRangeLabel}
                      </p>
                    ) : null}
                    <h4 className="mt-1 text-center text-base font-semibold">
                      <InlineBoldText text={block.title} />
                    </h4>
                    {block.groupInstruction || block.instruction ? (
                      <p className="mt-2 text-sm text-muted-foreground">
                        <InlineBoldText text={block.groupInstruction ?? block.instruction} />
                      </p>
                    ) : null}

                    <div className="mt-4 space-y-3 text-sm leading-7">
                      {block.templateText ? (
                        <div className="rounded-xl border border-border/70 bg-background/55 p-3 leading-7">
                          {renderTemplateTokens(block.templateText)}
                        </div>
                      ) : null}

                      {block.templateText ? (
                        <div className="pt-1">
                          {Array.from(expanded)
                            .filter((questionId) => blockQuestionIds.has(questionId))
                            .map((questionId) => (
                              <div key={`tmpl-explain-${questionId}`} className="mt-3">
                                {renderCorrectAnswer(questionId)}
                                {renderExplanation(questionId)}
                              </div>
                            ))}
                        </div>
                      ) : null}

                      {!block.templateText ? (
                        <div className="space-y-3">
                          {block.lines.map((line) => {
                            const questionId = getQuestionId(line.questionNumber);
                            const status = getStatusByNumber(line.questionNumber);
                            const userAnswer = normalizeAnswerValue(getUserAnswerByNumber(line.questionNumber));

                            return (
                              <div key={`line-${line.questionNumber}`} className="min-w-0">
                                <div className="flex min-w-0 items-start justify-between gap-2">
                                  <p className="min-w-0 flex-1 wrap-break-word">
                                    <InlineBoldText text={line.before} />{" "}
                                    <span className="inline-flex align-middle">
                                      {renderQuestionChip(line.questionNumber, questionId, status)}
                                    </span>
                                  </p>
                                  <div className="shrink-0">{renderActions(questionId)}</div>
                                </div>
                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                  <Input
                                    readOnly
                                    id={`review-question-${questionId}`}
                                    value={userAnswer}
                                    placeholder="..."
                                    className="h-10 w-44 rounded-xl bg-background/70 text-sm shadow-none"
                                  />
                                  {line.after ? <InlineBoldText text={line.after} /> : null}
                                </div>
                                {renderCorrectAnswer(questionId)}
                                {renderExplanation(questionId)}
                              </div>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  </Card>
                );
              }

              if (block.type === "tableCompletion") {
                const tableQuestionIds = new Set(
                  block.rows.flatMap((row) =>
                    row.questionNumbers.map((questionNumber) => getQuestionId(questionNumber))
                  )
                );

                return (
                  <Card
                    key={`block-${blockIndex}`}
                    className="min-w-0 max-w-full gap-0 overflow-hidden rounded-2xl border border-border/70 bg-background/40 p-4 shadow-none"
                  >
                    {block.groupRangeLabel ? (
                      <p className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                        {block.groupRangeLabel}
                      </p>
                    ) : null}
                    <h4 className="mt-1 text-center text-base font-semibold">
                      <InlineBoldText text={block.title} />
                    </h4>
                    {block.groupInstruction ? (
                      <p className="mt-2 text-sm text-muted-foreground">
                        <InlineBoldText text={block.groupInstruction} />
                      </p>
                    ) : null}

                    <div className="mt-4 overflow-x-auto rounded-xl border border-border/70 bg-background/60">
                      <table className="min-w-full table-fixed border-collapse text-sm">
                        <thead>
                          <tr className="border-b border-border/70 bg-muted/30">
                            {block.columns.map((column, idx) => (
                              <th
                                key={`col-${idx}`}
                                className="px-3 py-2 text-left text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase"
                              >
                                <InlineBoldText text={column} />
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {block.rows.map((row) => (
                            <tr key={row.id} className="border-b border-border/50 last:border-b-0">
                              {row.values.map((cell, cellIdx) => (
                                <td key={`${row.id}-cell-${cellIdx}`} className="px-3 py-2 align-top">
                                  <div className="flex flex-wrap items-center gap-2">
                                    {renderTemplateTokens(cell)}
                                  </div>
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Expanded explanations for any blanks in this table */}
                    {Array.from(expanded)
                      .filter((questionId) => tableQuestionIds.has(questionId))
                      .map((questionId) => (
                        <div key={`table-explain-${questionId}`} className="mt-3">
                          {renderCorrectAnswer(questionId)}
                          {renderExplanation(questionId)}
                        </div>
                      ))}
                  </Card>
                );
              }

              if (block.type === "mcqGroup") {
                const allowMultiple = Boolean(block.allowMultiple);
                return (
                  <Card
                    key={`block-${blockIndex}`}
                    className="min-w-0 max-w-full gap-0 overflow-hidden rounded-2xl border border-border/70 bg-background/40 p-4 shadow-none"
                  >
                    {block.groupRangeLabel ? (
                      <p className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                        {block.groupRangeLabel}
                      </p>
                    ) : null}
                    {block.title ? (
                      <h4 className="mt-1 text-center text-base font-semibold">
                        <InlineBoldText text={block.title} />
                      </h4>
                    ) : null}
                    {block.groupInstruction ? (
                      <p className="mt-2 text-sm text-muted-foreground">
                        <InlineBoldText text={block.groupInstruction} />
                      </p>
                    ) : null}

                    <div className="mt-4 space-y-5">
                      {block.questions.map((mcq) => {
                        const questionId = getQuestionId(mcq.questionNumber);
                        const status = getStatusByNumber(mcq.questionNumber);
                        const statusStyles = getStatusStyles(status);
                        const meta = answerMetaByQuestionId[questionId];
                        const rawAnswer = answers[questionId];
                        const selectedKeys = new Set(
                          (typeof rawAnswer === "string"
                            ? rawAnswer.split(",")
                            : Array.isArray(rawAnswer)
                              ? rawAnswer
                              : []
                          )
                            .map((value) => String(value ?? "").trim().toUpperCase())
                            .filter(Boolean)
                        );
                        const correctKeys = new Set(
                          (Array.isArray(meta?.correctAnswer)
                            ? meta.correctAnswer
                            : typeof meta?.correctAnswer === "string"
                              ? meta.correctAnswer.split(",")
                              : []
                          )
                            .map((value) => String(value ?? "").trim().toUpperCase())
                            .filter(Boolean)
                        );

                        return (
                          <div
                            key={`mcq-${mcq.questionNumber}`}
                            id={`review-question-${questionId}`}
                            className={cn(
                              "scroll-mt-24 rounded-2xl border p-3",
                              statusStyles.card
                            )}
                          >
                            <div className="flex min-w-0 items-start justify-between gap-2">
                              <p className="min-w-0 flex-1 wrap-break-word text-sm font-semibold">
                                {renderQuestionChip(mcq.questionNumber, questionId, status)}{" "}
                                <span className="ml-1">
                                  <InlineBoldText text={mcq.prompt} />
                                </span>
                              </p>
                              <div className="shrink-0">{renderActions(questionId)}</div>
                            </div>

                            <div className="mt-3 space-y-2">
                              {mcq.options.map((option, idx) => {
                                const match = option.trim().match(/^([A-Z])[\)\].:\-]\s*(.+)$/i);
                                const key = (match?.[1] ?? String.fromCharCode("A".charCodeAt(0) + idx)).toUpperCase();
                                const text = (match?.[2] ?? option).trim();
                                const isSelected = selectedKeys.has(key);
                                const isCorrect = correctKeys.has(key);

                                return (
                                  <div
                                    key={`opt-${mcq.questionNumber}-${key}`}
                                    className={cn(
                                      "flex min-w-0 items-start gap-2 rounded-xl border px-3 py-2 text-sm",
                                      isCorrect
                                        ? "border-emerald-200 bg-emerald-50/70 dark:border-emerald-400/30 dark:bg-emerald-500/[0.08]"
                                        : isSelected
                                          ? "border-rose-200 bg-rose-50/70 dark:border-rose-400/30 dark:bg-rose-500/[0.08]"
                                          : "border-border/70 bg-background/40"
                                    )}
                                  >
                                    <span
                                      className={cn(
                                        "mt-0.5 inline-flex h-7 min-w-7 items-center justify-center rounded-full border px-2 text-xs font-semibold",
                                        isCorrect
                                          ? "border-emerald-300 bg-emerald-100 text-emerald-700 dark:border-emerald-500/55 dark:bg-emerald-500/20 dark:text-emerald-100"
                                          : isSelected
                                            ? "border-rose-300 bg-rose-100 text-rose-700 dark:border-rose-500/55 dark:bg-rose-500/20 dark:text-rose-100"
                                            : "border-border/70 bg-muted/35 text-foreground"
                                      )}
                                    >
                                      {allowMultiple ? (isSelected ? "✓" : "") : isSelected ? "●" : ""}
                                      <span className={cn(!isSelected && "text-muted-foreground")}>{key}</span>
                                    </span>
                                    <p className="min-w-0 flex-1 wrap-break-word leading-snug">
                                      <InlineBoldText text={text} />
                                    </p>
                                  </div>
                                );
                              })}
                            </div>

                            {renderCorrectAnswer(questionId)}
                            {renderExplanation(questionId)}
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                );
              }

              if (block.type === "matching" || block.type === "diagramLabeling") {
                const items =
                  block.type === "matching"
                    ? block.items.map((item) => ({ questionNumber: item.questionNumber, prompt: item.prompt }))
                    : block.items.map((item) => ({ questionNumber: item.questionNumber, prompt: item.label }));

                return (
                  <Card
                    key={`block-${blockIndex}`}
                    className="min-w-0 max-w-full gap-0 overflow-hidden rounded-2xl border border-border/70 bg-background/40 p-4 shadow-none"
                  >
                    {block.groupRangeLabel ? (
                      <p className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                        {block.groupRangeLabel}
                      </p>
                    ) : null}
                    <h4 className="mt-1 text-center text-base font-semibold">
                      <InlineBoldText text={block.title} />
                    </h4>
                    {block.groupInstruction ? (
                      <p className="mt-2 text-sm text-muted-foreground">
                        <InlineBoldText text={block.groupInstruction} />
                      </p>
                    ) : null}

                    <div className="mt-4 space-y-3">
                      {items.map((item) => {
                        const questionId = getQuestionId(item.questionNumber);
                        const status = getStatusByNumber(item.questionNumber);
                        const statusStyles = getStatusStyles(status);
                        const userAnswer = normalizeAnswerValue(getUserAnswerByNumber(item.questionNumber));

                        return (
                          <div
                            key={`match-${item.questionNumber}`}
                            id={`review-question-${questionId}`}
                            className={cn("scroll-mt-24 rounded-2xl border p-3", statusStyles.card)}
                          >
                            <div className="flex min-w-0 items-start justify-between gap-2">
                              <p className="min-w-0 flex-1 wrap-break-word text-sm font-semibold">
                                {renderQuestionChip(item.questionNumber, questionId, status)}{" "}
                                <span className="ml-1">
                                  <InlineBoldText text={item.prompt} />
                                </span>
                              </p>
                              <div className="shrink-0">{renderActions(questionId)}</div>
                            </div>
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <Input
                                readOnly
                                value={userAnswer}
                                placeholder="..."
                                className="h-10 w-32 rounded-xl bg-background/70 text-sm shadow-none"
                              />
                            </div>
                            {renderCorrectAnswer(questionId)}
                            {renderExplanation(questionId)}
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                );
              }

              if (block.type === "listSelection") {
                const selectionByKey = new Map<string, number[]>();
                for (const qn of block.questionNumbers) {
                  const raw = normalizeAnswerValue(getUserAnswerByNumber(qn));
                  const key = raw.trim().toUpperCase();
                  if (!key) continue;
                  const existing = selectionByKey.get(key) ?? [];
                  existing.push(qn);
                  selectionByKey.set(key, existing);
                }

                return (
                  <Card
                    key={`block-${blockIndex}`}
                    className="min-w-0 max-w-full gap-0 overflow-hidden rounded-2xl border border-border/70 bg-background/40 p-4 shadow-none"
                  >
                    {block.groupRangeLabel ? (
                      <p className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                        {block.groupRangeLabel}
                      </p>
                    ) : null}
                    <h4 className="mt-1 text-center text-base font-semibold">
                      <InlineBoldText text={block.title} />
                    </h4>
                    {block.groupInstruction ? (
                      <p className="mt-2 text-sm text-muted-foreground">
                        <InlineBoldText text={block.groupInstruction} />
                      </p>
                    ) : null}

                    <div className="mt-4 space-y-3">
                      <p className="wrap-break-word text-sm font-semibold">
                        {block.questionNumbers.map((qn) => {
                          const qid = getQuestionId(qn);
                          const status = getStatusByNumber(qn);
                          return (
                            <span key={`ls-q-${qn}`} className="mr-2 inline-flex align-middle">
                              {renderQuestionChip(qn, qid, status)}
                            </span>
                          );
                        })}
                        <InlineBoldText text={block.prompt} />
                      </p>

                      <div className="space-y-2">
                        {block.options.map((option, idx) => {
                          const match = option.trim().match(/^([A-Z])[\)\].:\-]\s*(.+)$/i);
                          const key = (match?.[1] ?? String.fromCharCode("A".charCodeAt(0) + idx)).toUpperCase();
                          const text = (match?.[2] ?? option).trim();
                          const pickedBy = selectionByKey.get(key) ?? [];

                          return (
                            <div
                              key={`ls-opt-${key}`}
                              className={cn(
                                "flex min-w-0 items-start gap-2 rounded-xl border px-3 py-2 text-sm",
                                pickedBy.length
                                  ? "border-emerald-200 bg-emerald-50/70 dark:border-emerald-400/30 dark:bg-emerald-500/[0.08]"
                                  : "border-border/70 bg-background/40"
                              )}
                            >
                              <span
                                className={cn(
                                  "mt-0.5 inline-flex h-7 min-w-7 items-center justify-center rounded-full border px-2 text-xs font-semibold",
                                  pickedBy.length
                                    ? "border-emerald-300 bg-emerald-100 text-emerald-700 dark:border-emerald-500/55 dark:bg-emerald-500/20 dark:text-emerald-100"
                                    : "border-border/70 bg-muted/35 text-muted-foreground"
                                )}
                              >
                                {pickedBy.length ? "✓" : ""} {key}
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="wrap-break-word leading-snug">
                                  <InlineBoldText text={text} />
                                </p>
                                {pickedBy.length ? (
                                  <p className="mt-1 text-[11px] text-muted-foreground">
                                    {t("yourAnswer")}: {pickedBy.join(", ")}
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-2 space-y-3">
                        {block.questionNumbers.map((qn) => {
                          const questionId = getQuestionId(qn);
                          const status = getStatusByNumber(qn);
                          const statusStyles = getStatusStyles(status);
                          return (
                            <div key={`ls-meta-${qn}`} className={cn("rounded-2xl border p-3", statusStyles.card)}>
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-sm font-semibold">
                                  {renderQuestionChip(qn, questionId, status)}{" "}
                                  <span className="ml-1">{t.has("questionPosition") ? t("questionPosition", { current: qn, total: grading.total }) : `Question ${qn}`}</span>
                                </p>
                                <div className="shrink-0">{renderActions(questionId)}</div>
                              </div>
                              {renderCorrectAnswer(questionId)}
                              {renderExplanation(questionId)}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </Card>
                );
              }

              // Should not happen, but keep UI stable.
              return (
                <Card
                  key={`block-${blockIndex}`}
                  className="min-w-0 max-w-full gap-0 overflow-hidden rounded-2xl border border-border/70 bg-background/40 p-4 shadow-none"
                >
                  <p className="text-sm text-muted-foreground">{t("notAvailable")}</p>
                </Card>
              );
            })}
          </div>
        ) : null}

        {!blocks?.length
          ? questions.map((question) => {
          const status = getQuestionStatus(grading, question.id);
          const statusStyles = getStatusStyles(status);
          const answerMeta = answerMetaByQuestionId[question.id];
          const isOpen = expanded.has(question.id);
          const userAnswer = normalizeAnswerValue(answers[question.id]);
          const correctAnswer = formatAnswerForDisplay(answerMeta?.correctAnswer);
          const explanationText = (answerMeta?.explanation ?? "").trim();

          const rawAnswer = answers[question.id];
          const selectedMcqKeys = new Set(
            (typeof rawAnswer === "string"
              ? rawAnswer.split(",")
              : Array.isArray(rawAnswer)
                ? rawAnswer
                : []
            )
              .map((value) => String(value ?? "").trim().toUpperCase())
              .filter(Boolean)
          );
          const correctMcqKeys = new Set(
            (Array.isArray(answerMeta?.correctAnswer)
              ? answerMeta.correctAnswer
              : typeof answerMeta?.correctAnswer === "string"
                ? answerMeta.correctAnswer.split(",")
                : []
            )
              .map((value) => String(value ?? "").trim().toUpperCase())
              .filter(Boolean)
          );

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
                    {question.number}. <InlineBoldText text={question.prompt} />
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

              {question.type === "mcq" && answerMeta?.options?.length ? (
                <div className="mt-3 space-y-2">
                  {answerMeta.options.map((option) => {
                    const key = option.key.toUpperCase();
                    const isCorrect = correctMcqKeys.has(key);
                    const isSelected = selectedMcqKeys.has(key);

                    return (
                      <div
                        key={`${question.id}-opt-${key}`}
                        className={cn(
                          "flex min-w-0 items-start gap-2 rounded-xl border px-3 py-2 text-sm",
                          isCorrect
                            ? "border-emerald-200 bg-emerald-50/70 dark:border-emerald-400/30 dark:bg-emerald-500/[0.08]"
                            : isSelected
                              ? "border-rose-200 bg-rose-50/70 dark:border-rose-400/30 dark:bg-rose-500/[0.08]"
                              : "border-border/70 bg-background/40"
                        )}
                      >
                        <span
                          className={cn(
                            "mt-0.5 inline-flex h-7 min-w-7 items-center justify-center rounded-full border px-2 text-xs font-semibold",
                            isCorrect
                              ? "border-emerald-300 bg-emerald-100 text-emerald-700 dark:border-emerald-500/55 dark:bg-emerald-500/20 dark:text-emerald-100"
                              : isSelected
                                ? "border-rose-300 bg-rose-100 text-rose-700 dark:border-rose-500/55 dark:bg-rose-500/20 dark:text-rose-100"
                                : "border-border/70 bg-muted/35 text-foreground"
                          )}
                        >
                          {key}
                        </span>
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <p className="wrap-break-word leading-snug">
                            <InlineBoldText text={option.text} />
                          </p>
                          {isSelected && !isCorrect ? (
                            <p className="text-[11px] text-rose-700 dark:text-rose-200">
                              {t("yourAnswer")}
                            </p>
                          ) : isCorrect ? (
                            <p className="text-[11px] text-emerald-700 dark:text-emerald-200">
                              {t("correctAnswer")}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}

              {answersVisible ? (
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
              ) : null}

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
                    {explanationText || t("notAvailable")}
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
        })
          : null}
      </div>
    </Card>
  );
}
