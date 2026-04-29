"use client";

import {Download, Sparkles, WandSparkles} from "lucide-react";
import {useEffect, useMemo, useState} from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { AiCoachData, MistakeBreakdownItem } from "@/data/review-reading";
import type {MistakeReasonDetail} from "@/src/services/student/types";

type ReviewAiCoachCardProps = {
  coach: AiCoachData;
  mistakeBreakdown: MistakeBreakdownItem[];
  onAction: (message: string) => void;
  selectedMistakeReason?: MistakeReasonDetail | null;
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

export function ReviewAiCoachCard({ coach, mistakeBreakdown, onAction, selectedMistakeReason = null }: ReviewAiCoachCardProps) {
  const t = useTranslations("readingReview");
  const tMistakeReasons = useTranslations("mistakeReasons");
  const solutionText = useMemo(() => {
    if (!selectedMistakeReason) return "";
    return [selectedMistakeReason.solution_1, selectedMistakeReason.solution_2, selectedMistakeReason.solution_3]
      .map((item) => item.trim())
      .filter(Boolean)
      .join("\n\n");
  }, [selectedMistakeReason]);
  const [typedSolution, setTypedSolution] = useState("");

  useEffect(() => {
    if (!solutionText) {
      setTypedSolution("");
      return;
    }

    setTypedSolution("");
    let index = 0;
    const timer = window.setInterval(() => {
      index += 4;
      setTypedSolution(solutionText.slice(0, index));
      if (index >= solutionText.length) {
        window.clearInterval(timer);
      }
    }, 16);

    return () => window.clearInterval(timer);
  }, [solutionText]);

  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold tracking-tight">{t("aiLearningCoach")}</h2>
      <Card className="space-y-5 border-slate-200/85 bg-white/95 p-4 shadow-sm shadow-slate-200/50 dark:border-border/80 dark:bg-card/70 dark:shadow-none sm:p-5">
        <div className="grid gap-2 sm:grid-cols-3">
          <Card className="border-slate-200 bg-slate-50/80 p-3 dark:border-border/70 dark:bg-background/45">
            <p className="text-xs text-muted-foreground">{t("score")}</p>
            <p className="text-2xl font-semibold">{coach.score}</p>
          </Card>
          <Card className="border-slate-200 bg-slate-50/80 p-3 dark:border-border/70 dark:bg-background/45">
            <p className="text-xs text-muted-foreground">{t("accuracy")}</p>
            <p className="text-2xl font-semibold text-blue-700 dark:text-blue-300">{coach.accuracy}</p>
          </Card>
          <Card className="border-slate-200 bg-slate-50/80 p-3 dark:border-border/70 dark:bg-background/45">
            <p className="text-xs text-muted-foreground">{t("timeUsed")}</p>
            <p className="text-2xl font-semibold">{coach.timeUsed}</p>
          </Card>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold">{t("mistakeBreakdown")}</p>
          {mistakeBreakdown.map((item) => (
            <div key={item.id} className="space-y-1.5">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-medium">{item.successRate}%</span>
              </div>
              <Progress value={item.successRate} />
            </div>
          ))}
        </div>

        {selectedMistakeReason ? (
          <Card className="border-blue-300/70 bg-blue-100/70 p-3 dark:border-blue-500/35 dark:bg-blue-500/10">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold">{tMistakeReasons("aiAnswerTitle")}</p>
                <p className="text-xs text-muted-foreground">{selectedMistakeReason.reason}</p>
              </div>
              {isSafeDownloadUrl(selectedMistakeReason.file_url) ? (
                <Button size="sm" variant="outline" asChild>
                  <a href={selectedMistakeReason.file_url ?? "#"} target="_blank" rel="noopener noreferrer">
                    <Download className="size-4" />
                    {tMistakeReasons("downloadGuide")}
                  </a>
                </Button>
              ) : null}
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
              {typedSolution || tMistakeReasons("thinking")}
            </p>
          </Card>
        ) : (
          <Card className="border-blue-300/70 bg-blue-100/70 p-3 dark:border-blue-500/35 dark:bg-blue-500/10">
            <p className="mb-2 text-sm font-semibold">{t("aiInsights")}</p>
            <ul className="list-disc space-y-1.5 pl-5 text-sm text-foreground/90">
              {coach.insights.map((insight) => (
                <li key={insight} className="leading-relaxed">{insight}</li>
              ))}
            </ul>
          </Card>
        )}

        <div className="space-y-2">
          <p className="text-sm font-semibold">{t("personalizedImprovementPlan")}</p>
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-foreground/90">
            {coach.plan.map((item) => (
              <li key={item} className="leading-relaxed">{item}</li>
            ))}
          </ul>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => onAction(t("startPracticeSession"))}>
            <Sparkles className="size-4" />
            {t("startPracticeSession")}
          </Button>
          <Button variant="outline" onClick={() => onAction(t("generateSimilarTest"))}>
            <WandSparkles className="size-4" />
            {t("generateSimilarTest")}
          </Button>
          <Button variant="outline" onClick={() => onAction(t("practiceWeakAreas"))}>
            {t("practiceWeakAreas")}
          </Button>
        </div>
      </Card>
    </section>
  );
}

