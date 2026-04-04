"use client";

import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormattedInstructionText } from "@/components/test/FormattedInstructionText";
import { cn } from "@/lib/utils";

type ListeningEvidenceStatus = "correct" | "incorrect" | "skipped";

export type ListeningTranscriptEvidence = {
  questionId: string;
  questionNumber: number;
  prompt: string;
  quote: string;
  timeRange?: [number, number];
  status: ListeningEvidenceStatus;
};

export type ListeningReviewSection = {
  sectionId: string;
  label: string;
  title: string;
  instructions: string;
  nowPlayingLabel: string;
  audioTitle: string;
  evidenceItems: ListeningTranscriptEvidence[];
};

type ListeningTranscriptReviewPanelProps = {
  sections: ListeningReviewSection[];
  activeSectionId: string;
  highlightedQuestionId: string | null;
  onSectionChange: (sectionId: string) => void;
  onGoToQuestion?: (questionId: string) => void;
};

function toClock(totalSeconds: number) {
  const safe = Math.max(0, totalSeconds);
  const min = Math.floor(safe / 60)
    .toString()
    .padStart(2, "0");
  const sec = (safe % 60).toString().padStart(2, "0");
  return `${min}:${sec}`;
}

function getStatusStyles(status: ListeningEvidenceStatus) {
  if (status === "correct") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/[0.08] dark:text-emerald-200";
  }
  if (status === "incorrect") {
    return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/35 dark:bg-rose-500/[0.12] dark:text-rose-200";
  }
  return "border-slate-200 bg-white text-slate-600 dark:border-border/70 dark:bg-background/55 dark:text-muted-foreground";
}

export function ListeningTranscriptReviewPanel({
  sections,
  activeSectionId,
  highlightedQuestionId,
  onSectionChange,
  onGoToQuestion,
}: ListeningTranscriptReviewPanelProps) {
  const t = useTranslations("listeningResult");
  const activeSection = sections.find((section) => section.sectionId === activeSectionId) ?? sections[0];

  if (!activeSection) return null;

  return (
    <Card className="flex h-[80vh] min-h-0 w-full max-w-full flex-col overflow-hidden rounded-3xl border-slate-200/85 bg-white/95 py-0 shadow-sm shadow-slate-200/50 dark:border-border/75 dark:bg-card/75 dark:shadow-none xl:h-[85vh]">
      <div className="sticky top-0 z-20 min-w-0 max-w-full border-b border-slate-200/90 bg-white/95 px-3 py-3 backdrop-blur dark:border-border/70 dark:bg-card/95 sm:px-4">
        <div className="min-w-0 max-w-full space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">{t("listeningReview")}</p>
            <p className="text-xs text-muted-foreground">{activeSection.label}</p>
          </div>
          <div className="min-w-0 w-full max-w-full overflow-x-auto overflow-y-hidden pb-1 [scrollbar-width:thin]">
            <div className="inline-flex gap-2 pr-2">
              {sections.map((section) => (
                <Button
                  key={section.sectionId}
                  size="sm"
                  variant={section.sectionId === activeSectionId ? "default" : "outline"}
                  className={cn(
                    "h-8 shrink-0 rounded-xl px-3.5",
                    section.sectionId === activeSectionId
                      ? "bg-blue-500 text-blue-50 hover:bg-blue-500/90"
                      : "border-slate-200 bg-white hover:bg-slate-100 dark:border-border/70 dark:bg-background/40 dark:hover:bg-background/60"
                  )}
                  onClick={() => onSectionChange(section.sectionId)}
                >
                  {section.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="min-h-0 min-w-0 max-w-full flex-1 overflow-y-auto px-4 pb-5 pt-4 [scrollbar-width:thin] sm:px-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-[1.9rem]">{activeSection.title}</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              <FormattedInstructionText text={activeSection.instructions} />
            </p>
          </div>

          <Card className="gap-1 rounded-2xl border-slate-200 bg-slate-50/80 p-3.5 shadow-none dark:border-border/65 dark:bg-background/45">
            <p className="text-xs tracking-[0.12em] text-muted-foreground uppercase">{activeSection.nowPlayingLabel}</p>
            <p className="text-sm font-medium">{activeSection.audioTitle}</p>
          </Card>

          {highlightedQuestionId ? (
            <Card className="rounded-2xl border-blue-300/70 bg-blue-100/70 p-3.5 shadow-none dark:border-blue-400/40 dark:bg-blue-500/12">
              <p className="text-xs tracking-[0.12em] text-blue-700 dark:text-blue-200/90 uppercase">{t("selectedEvidence")}</p>
              <p className="mt-1 text-sm text-foreground/95">
                {activeSection.evidenceItems.find((item) => item.questionId === highlightedQuestionId)?.quote ?? t("notAvailable")}
              </p>
            </Card>
          ) : null}

          <div className="space-y-3">
            {activeSection.evidenceItems.map((item) => (
              <Card
                key={item.questionId}
                id={`listening-evidence-${item.questionId}`}
                className={cn(
                  "min-w-0 max-w-full gap-2 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-none dark:border-border/65 dark:bg-background/35",
                  highlightedQuestionId === item.questionId && "border-blue-300/80 bg-blue-100/65 ring-1 ring-blue-300/70 dark:border-blue-400/60 dark:bg-blue-500/[0.14] dark:ring-blue-400/45"
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="rounded-full border-blue-300 bg-blue-100 text-blue-700 dark:border-blue-400/45 dark:bg-blue-500/15 dark:text-blue-100">
                      Q{item.questionNumber}
                    </Badge>
                    <Badge variant="outline" className={cn("rounded-full", getStatusStyles(item.status))}>
                      {t(`${item.status}Status`)}
                    </Badge>
                  </div>
                  {item.timeRange ? (
                    <p className="text-xs text-muted-foreground">
                      {toClock(item.timeRange[0])} - {toClock(item.timeRange[1])}
                    </p>
                  ) : null}
                </div>
                <p className="wrap-break-word text-sm font-medium text-foreground/95">{item.prompt}</p>
                <p className="wrap-break-word text-sm leading-relaxed text-muted-foreground">{item.quote}</p>
                <div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 rounded-lg px-2.5 text-xs"
                    onClick={() => {
                      if (onGoToQuestion) {
                        onGoToQuestion(item.questionId);
                        return;
                      }
                      const node = document.getElementById(`review-question-${item.questionId}`);
                      node?.scrollIntoView({ behavior: "smooth", block: "center" });
                    }}
                  >
                    {t("goToQuestion")}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
