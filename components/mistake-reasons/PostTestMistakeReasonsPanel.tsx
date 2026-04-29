"use client";

import {FileText, Loader2, Sparkles} from "lucide-react";
import {useTranslations} from "next-intl";

import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {cn} from "@/lib/utils";
import type {MistakeReasonBrief, MistakeReasonDetail} from "@/src/services/student/types";

type PostTestMistakeReasonsPanelProps = {
  reasons: MistakeReasonBrief[];
  selectedReason: MistakeReasonDetail | null;
  isLoading: boolean;
  selectingReasonId: string | null;
  error: string | null;
  onSelectReason: (reason: MistakeReasonBrief) => void;
};

export function PostTestMistakeReasonsPanel({
  reasons,
  selectedReason,
  isLoading,
  selectingReasonId,
  error,
  onSelectReason
}: PostTestMistakeReasonsPanelProps) {
  const t = useTranslations("mistakeReasons");

  if (isLoading) {
    return (
      <Card className="rounded-2xl border-border/70 bg-card/80 shadow-none">
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
    <Card className="rounded-2xl border-border/70 bg-card/80 shadow-none">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <span className="inline-flex size-8 items-center justify-center rounded-xl bg-blue-500/12 text-blue-700 dark:text-blue-200">
            <Sparkles className="size-4" />
          </span>
          {t("title")}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {error ? (
          <div className="rounded-xl border border-rose-400/35 bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-200">
            {error}
          </div>
        ) : null}

        <div className="grid gap-2 md:grid-cols-2">
          {reasons.map((reason) => {
            const isSelected = selectedReason?.id === reason.id;
            const isSelecting = selectingReasonId === reason.id;

            return (
              <button
                key={reason.id}
                type="button"
                onClick={() => onSelectReason(reason)}
                disabled={Boolean(selectingReasonId)}
                className={cn(
                  "rounded-xl border p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-70",
                  isSelected
                    ? "border-blue-400/70 bg-blue-500/12"
                    : "border-border/70 bg-background/55 hover:border-blue-400/50 hover:bg-blue-500/8"
                )}
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="rounded-full">{reason.module_display}</Badge>
                  {reason.is_file_consists ? (
                    <Badge variant="outline" className="rounded-full">
                      <FileText className="size-3" />
                      {t("attachment")}
                    </Badge>
                  ) : null}
                  {isSelecting ? <Loader2 className="size-3.5 animate-spin text-muted-foreground" /> : null}
                </div>
                <span className="text-sm font-medium leading-relaxed">{reason.reason}</span>
              </button>
            );
          })}
        </div>

        {selectedReason ? (
          <Button type="button" className="rounded-xl" onClick={() => document.getElementById("ai-insights")?.scrollIntoView({behavior: "smooth", block: "start"})}>
            {t("viewAiAnswer")}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
