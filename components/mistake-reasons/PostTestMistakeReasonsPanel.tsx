"use client";

import {useMemo, useState} from "react";
import {ChevronDown, Download, FileText, Loader2, Sparkles} from "lucide-react";
import {useTranslations} from "next-intl";

import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {cn} from "@/lib/utils";
import type {MistakeReasonDetail} from "@/src/services/student/types";

type PostTestMistakeReasonsPanelProps = {
  reasons: MistakeReasonDetail[];
  selectedReason: MistakeReasonDetail | null;
  isLoading: boolean;
  error: string | null;
  onSelectReason: (reason: MistakeReasonDetail) => void;
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

export function PostTestMistakeReasonsPanel({
  reasons,
  selectedReason,
  isLoading,
  error,
  onSelectReason
}: PostTestMistakeReasonsPanelProps) {
  const t = useTranslations("mistakeReasons");
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set());

  const groupedReasons = useMemo(() => {
    const groups = new Map<string, {label: string; reasons: MistakeReasonDetail[]}>();

    for (const reason of reasons) {
      const key = reason.mistake_category;
      const current = groups.get(key) ?? {label: reason.mistake_category_display, reasons: []};
      current.reasons.push(reason);
      groups.set(key, current);
    }

    return [...groups.entries()];
  }, [reasons]);

  if (isLoading) {
    return (
      <Card className="rounded-3xl border-border/70 bg-card/80 shadow-none">
        <CardContent className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          {t("loading")}
        </CardContent>
      </Card>
    );
  }

  if (!reasons.length && !error) {
    return null;
  }

  return (
    <Card className="overflow-hidden rounded-3xl border-border/70 bg-card/85 shadow-none">
      <CardHeader className="border-b border-border/60 bg-gradient-to-r from-blue-500/10 via-cyan-500/8 to-transparent pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <span className="inline-flex size-9 items-center justify-center rounded-2xl bg-blue-500/14 text-blue-700 dark:text-blue-200">
            <Sparkles className="size-4.5" />
          </span>
          {t("title")}
        </CardTitle>
        <p className="max-w-3xl text-sm text-muted-foreground">{t("subtitle")}</p>
      </CardHeader>
      <CardContent className="space-y-4 p-4">
        {error ? (
          <div className="rounded-xl border border-rose-400/35 bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-200">
            {error}
          </div>
        ) : null}

        {groupedReasons.map(([category, group]) => (
          <section key={category} className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="rounded-full border-blue-400/30 bg-blue-500/10 text-blue-700 dark:text-blue-200">
                {group.label}
              </Badge>
              <span className="text-xs text-muted-foreground">{t("reasonCount", {count: group.reasons.length})}</span>
            </div>

            <div className="grid gap-2 md:grid-cols-2">
              {group.reasons.map((reason) => {
                const isOpen = openIds.has(reason.id);
                const isSelected = selectedReason?.id === reason.id;
                const solutions = [reason.solution_1, reason.solution_2, reason.solution_3]
                  .map((solution) => solution.trim())
                  .filter(Boolean);

                return (
                  <article
                    key={reason.id}
                    className={cn(
                      "rounded-2xl border p-3 transition-colors",
                      isSelected
                        ? "border-blue-400/70 bg-blue-500/12"
                        : "border-border/70 bg-background/55"
                    )}
                  >
                    <button
                      type="button"
                      className="flex w-full items-start justify-between gap-3 text-left"
                      onClick={() => {
                        onSelectReason(reason);
                        setOpenIds((current) => {
                          const next = new Set(current);
                          if (next.has(reason.id)) {
                            next.delete(reason.id);
                          } else {
                            next.add(reason.id);
                          }
                          return next;
                        });
                      }}
                    >
                      <span className="min-w-0">
                        <span className="mb-2 flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="rounded-full">{reason.module_display}</Badge>
                          {reason.is_file_consists ? (
                            <Badge variant="outline" className="rounded-full">
                              <FileText className="size-3" />
                              {t("attachment")}
                            </Badge>
                          ) : null}
                        </span>
                        <span className="block text-sm font-semibold leading-relaxed text-foreground">{reason.reason}</span>
                      </span>
                      <ChevronDown className={cn("mt-1 size-4 shrink-0 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
                    </button>

                    {isOpen ? (
                      <div className="mt-3 space-y-3 border-t border-border/70 pt-3">
                        {solutions.length ? (
                          <ol className="space-y-2 text-sm text-muted-foreground">
                            {solutions.map((solution, index) => (
                              <li key={`${reason.id}-solution-${index}`} className="flex gap-2">
                                <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-blue-500/12 text-[11px] font-semibold text-blue-700 dark:text-blue-200">
                                  {index + 1}
                                </span>
                                <span className="leading-relaxed">{solution}</span>
                              </li>
                            ))}
                          </ol>
                        ) : (
                          <p className="text-sm text-muted-foreground">{t("emptySolutions")}</p>
                        )}

                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            size="sm"
                            className="rounded-xl"
                            onClick={() => {
                              onSelectReason(reason);
                              document.getElementById("ai-insights")?.scrollIntoView({behavior: "smooth", block: "start"});
                            }}
                          >
                            {t("viewAiAnswer")}
                          </Button>
                          {isSafeDownloadUrl(reason.file_url) ? (
                            <Button size="sm" variant="outline" className="rounded-xl" asChild>
                              <a href={reason.file_url ?? "#"} target="_blank" rel="noopener noreferrer">
                                <Download className="size-4" />
                                {t("downloadGuide")}
                              </a>
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </CardContent>
    </Card>
  );
}
