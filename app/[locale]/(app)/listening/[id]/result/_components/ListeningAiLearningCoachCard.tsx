"use client";

import { Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type ListeningAiLearningCoachCardProps = {
  weakestSectionLabel: string;
  weakestTypeLabel: string;
  skippedCount: number;
  accuracy: number;
  insights: string[];
  onAction: (actionKey: "practiceWeakPart" | "openAiCoach") => void;
};

export function ListeningAiLearningCoachCard({
  weakestSectionLabel,
  weakestTypeLabel,
  skippedCount,
  accuracy,
  insights,
  onAction,
}: ListeningAiLearningCoachCardProps) {
  const t = useTranslations("listeningResult");

  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold tracking-tight">{t("aiLearningCoach")}</h2>
      <Card className="space-y-4 border-slate-200/85 bg-white/95 p-4 shadow-sm shadow-slate-200/50 dark:border-border/80 dark:bg-card/75 dark:shadow-none sm:p-5">
        <div className="grid gap-2 sm:grid-cols-2">
          <Card className="border-slate-200 bg-slate-50/80 p-3 dark:border-border/70 dark:bg-background/45">
            <p className="text-xs text-muted-foreground">{t("coachWeakestPart")}</p>
            <p className="text-base font-semibold">{weakestSectionLabel}</p>
          </Card>
          <Card className="border-slate-200 bg-slate-50/80 p-3 dark:border-border/70 dark:bg-background/45">
            <p className="text-xs text-muted-foreground">{t("coachWeakestType")}</p>
            <p className="text-base font-semibold">{weakestTypeLabel}</p>
          </Card>
          <Card className="border-slate-200 bg-slate-50/80 p-3 dark:border-border/70 dark:bg-background/45">
            <p className="text-xs text-muted-foreground">{t("coachSkippedQuestions")}</p>
            <p className="text-base font-semibold">{skippedCount}</p>
          </Card>
          <Card className="border-slate-200 bg-slate-50/80 p-3 dark:border-border/70 dark:bg-background/45">
            <p className="text-xs text-muted-foreground">{t("coachAccuracy")}</p>
            <p className="text-base font-semibold">{accuracy}%</p>
          </Card>
        </div>

        <div className="rounded-2xl border border-blue-300/70 bg-blue-100/70 p-3 dark:border-blue-500/35 dark:bg-blue-500/10">
          <p className="mb-2 text-sm font-semibold">{t("coachInsightsTitle")}</p>
          <ul className="list-disc space-y-1.5 pl-5 text-sm">
            {insights.map((insight) => (
              <li key={insight}>{insight}</li>
            ))}
          </ul>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => onAction("practiceWeakPart")}>
            <Sparkles className="size-4" />
            {t("startPractice")}
          </Button>
          <Button variant="outline" onClick={() => onAction("openAiCoach")}>
            {t("openAiCoach")}
          </Button>
        </div>
      </Card>
    </section>
  );
}
