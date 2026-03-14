"use client";

import { Sparkles, WandSparkles } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { AiCoachData, MistakeBreakdownItem } from "@/data/review-reading";

type ReviewAiCoachCardProps = {
  coach: AiCoachData;
  mistakeBreakdown: MistakeBreakdownItem[];
  onAction: (message: string) => void;
};

export function ReviewAiCoachCard({ coach, mistakeBreakdown, onAction }: ReviewAiCoachCardProps) {
  const t = useTranslations("readingReview");

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

        <Card className="border-blue-300/70 bg-blue-100/70 p-3 dark:border-blue-500/35 dark:bg-blue-500/10">
          <p className="mb-2 text-sm font-semibold">{t("aiInsights")}</p>
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-foreground/90">
            {coach.insights.map((insight) => (
              <li key={insight} className="leading-relaxed">{insight}</li>
            ))}
          </ul>
        </Card>

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

