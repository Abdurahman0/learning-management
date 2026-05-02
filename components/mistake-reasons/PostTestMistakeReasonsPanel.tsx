"use client";

import {useMemo, useState} from "react";
import {AlertTriangle, Brain, Check, Download, FileText, Loader2, Sparkles, X} from "lucide-react";
import {useTranslations} from "next-intl";

import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card} from "@/components/ui/card";
import {cn} from "@/lib/utils";
import type {MistakeReasonCategory, MistakeReasonDetail} from "@/src/services/student/types";

type CategoryQuestionMap = Partial<Record<MistakeReasonCategory, number[]>>;

type PostTestMistakeReasonsPanelProps = {
  open: boolean;
  reasons: MistakeReasonDetail[];
  selectedReasonIds: string[];
  isLoading: boolean;
  isAnalyzing: boolean;
  error: string | null;
  canAnalyze?: boolean;
  disabledReason?: string | null;
  categoryQuestionNumbers?: CategoryQuestionMap;
  onOpenChange: (open: boolean) => void;
  onToggleReason: (reason: MistakeReasonDetail) => void;
  onAnalyze: () => void;
};

const CATEGORY_TONES: Record<MistakeReasonCategory, string> = {
  fully_incorrect: "border-rose-300/70 bg-rose-50 text-rose-700 dark:border-rose-500/35 dark:bg-rose-500/10 dark:text-rose-200",
  blank_answer: "border-amber-300/80 bg-amber-50 text-amber-700 dark:border-amber-500/35 dark:bg-amber-500/10 dark:text-amber-200",
  misspelled: "border-blue-300/80 bg-blue-50 text-blue-700 dark:border-blue-500/35 dark:bg-blue-500/10 dark:text-blue-200"
};

function isSafeDownloadUrl(value: string | null) {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function formatQuestionNumbers(numbers: number[]) {
  if (!numbers.length) return "";
  return numbers.slice(0, 16).join(", ") + (numbers.length > 16 ? "..." : "");
}

export function PostTestMistakeReasonsPanel({
  open,
  reasons,
  selectedReasonIds,
  isLoading,
  isAnalyzing,
  error,
  canAnalyze = true,
  disabledReason = null,
  categoryQuestionNumbers,
  onOpenChange,
  onToggleReason,
  onAnalyze
}: PostTestMistakeReasonsPanelProps) {
  const t = useTranslations("mistakeReasons");
  const [touched, setTouched] = useState(false);

  const groupedReasons = useMemo(() => {
    const groups = new Map<MistakeReasonCategory, {label: string; reasons: MistakeReasonDetail[]}>();

    for (const reason of reasons) {
      const key = reason.mistake_category;
      const current = groups.get(key) ?? {label: reason.mistake_category_display, reasons: []};
      current.reasons.push(reason);
      groups.set(key, current);
    }

    return [...groups.entries()];
  }, [reasons]);

  if (!open) {
    return null;
  }

  const hasSelection = selectedReasonIds.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/55 px-3 py-5 backdrop-blur-md">
      <Card className="relative max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-[2rem] border-slate-200/80 bg-white shadow-2xl shadow-slate-950/20 dark:border-slate-700/70 dark:bg-slate-950">
        <button
          type="button"
          className="absolute right-4 top-4 z-10 inline-flex size-10 items-center justify-center rounded-full border border-border/70 bg-background/80 text-muted-foreground transition-colors hover:text-foreground"
          onClick={() => onOpenChange(false)}
          aria-label={t("modal.close")}
          disabled={isAnalyzing}
        >
          <X className="size-4" />
        </button>

        <div className="relative overflow-hidden border-b border-border/70 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.18),transparent_34%),linear-gradient(135deg,rgba(248,250,252,0.96),rgba(239,246,255,0.92))] px-5 py-6 dark:bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.22),transparent_34%),linear-gradient(135deg,rgba(15,23,42,0.98),rgba(15,23,42,0.9))] sm:px-7">
          <div className="flex max-w-3xl items-start gap-4">
            <span className="inline-flex size-13 shrink-0 items-center justify-center rounded-3xl border border-blue-300/50 bg-blue-500/12 text-blue-700 shadow-sm dark:border-blue-500/35 dark:text-blue-200">
              <Brain className="size-6" />
            </span>
            <div>
              <Badge className="mb-3 rounded-full border-blue-400/30 bg-blue-500/10 text-blue-700 dark:text-blue-200">
                <Sparkles className="size-3" />
                {t("modal.badge")}
              </Badge>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-3xl">{t("title")}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{t("modal.description")}</p>
            </div>
          </div>
        </div>

        <div className="max-h-[58vh] overflow-y-auto px-5 py-5 sm:px-7">
          {isLoading ? (
            <div className="flex min-h-60 items-center justify-center rounded-3xl border border-dashed border-border/80 bg-muted/30">
              <div className="text-center">
                <Loader2 className="mx-auto size-7 animate-spin text-blue-600" />
                <p className="mt-3 text-sm text-muted-foreground">{t("loading")}</p>
              </div>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-rose-400/35 bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-200">
              {error}
            </div>
          ) : groupedReasons.length ? (
            <div className="space-y-4">
              {groupedReasons.map(([category, group]) => {
                const questionNumbers = categoryQuestionNumbers?.[category] ?? [];

                return (
                  <section key={category} className="rounded-3xl border border-border/70 bg-card/80 p-4">
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <Badge className={cn("rounded-full border", CATEGORY_TONES[category])}>
                          {group.label}
                        </Badge>
                        <h3 className="mt-3 text-base font-semibold text-foreground">{t(`modal.categoryTitle.${category}`)}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {questionNumbers.length
                            ? t(`modal.categoryDescription.${category}`, {questions: formatQuestionNumbers(questionNumbers)})
                            : t(`modal.categoryFallback.${category}`)}
                        </p>
                      </div>
                      <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                        {t("reasonCount", {count: group.reasons.length})}
                      </span>
                    </div>

                    <div className="grid gap-2 md:grid-cols-2">
                      {group.reasons.map((reason) => {
                        const checked = selectedReasonIds.includes(reason.id);

                        return (
                          <button
                            key={reason.id}
                            type="button"
                            onClick={() => {
                              setTouched(true);
                              onToggleReason(reason);
                            }}
                            className={cn(
                              "group flex min-h-24 items-start gap-3 rounded-2xl border p-3 text-left transition-all",
                              checked
                                ? "border-blue-400/80 bg-blue-500/12 shadow-sm shadow-blue-500/10"
                                : "border-border/70 bg-background/55 hover:border-blue-300/80 hover:bg-blue-500/6"
                            )}
                          >
                            <span
                              className={cn(
                                "mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full border transition-colors",
                                checked
                                  ? "border-blue-500 bg-blue-600 text-white"
                                  : "border-border bg-background text-transparent group-hover:text-blue-500"
                              )}
                            >
                              <Check className="size-3.5" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="mb-1.5 flex flex-wrap items-center gap-1.5">
                                <Badge variant="outline" className="rounded-full text-[10px]">{reason.module_display}</Badge>
                                {reason.is_file_consists ? (
                                  <Badge variant="outline" className="rounded-full text-[10px]">
                                    <FileText className="size-3" />
                                    {t("attachment")}
                                  </Badge>
                                ) : null}
                              </span>
                              <span className="block text-sm font-semibold leading-relaxed text-foreground">{reason.reason}</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-border/80 bg-muted/30 p-8 text-center">
              <AlertTriangle className="mx-auto size-8 text-muted-foreground" />
              <p className="mt-3 text-sm text-muted-foreground">{t("modal.empty")}</p>
            </div>
          )}
        </div>

        <div className="border-t border-border/70 bg-background/90 px-5 py-4 sm:px-7">
          {isAnalyzing ? (
            <div className="flex items-center gap-3 rounded-2xl border border-blue-400/30 bg-blue-500/10 px-4 py-3 text-sm text-blue-700 dark:text-blue-200">
              <Loader2 className="size-4 animate-spin" />
              <span>{t("modal.analyzing")}</span>
            </div>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className={cn("text-sm", touched && !hasSelection ? "text-rose-600 dark:text-rose-300" : "text-muted-foreground")}>
                {!canAnalyze && disabledReason
                  ? disabledReason
                  : hasSelection
                    ? t("modal.selected", {count: selectedReasonIds.length})
                    : t("modal.selectHint")}
              </p>
              <div className="flex flex-wrap gap-2 sm:justify-end">
                <Button type="button" variant="outline" className="rounded-xl" onClick={() => onOpenChange(false)}>
                  {t("modal.cancel")}
                </Button>
                <Button
                  type="button"
                  className="rounded-xl bg-blue-600 px-5 hover:bg-blue-500"
                  disabled={!hasSelection || !canAnalyze}
                  onClick={() => {
                    setTouched(true);
                    onAnalyze();
                  }}
                >
                  <Sparkles className="size-4" />
                  {t("modal.analyze")}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

export {isSafeDownloadUrl};
