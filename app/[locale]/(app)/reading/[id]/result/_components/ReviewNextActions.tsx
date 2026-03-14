"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { NextAction } from "@/data/review-reading";

type ReviewNextActionsProps = {
  actions: NextAction[];
  onAction: (message: string) => void;
};

export function ReviewNextActions({ actions, onAction }: ReviewNextActionsProps) {
  const t = useTranslations("readingReview");
  const locale = useLocale();

  return (
    <section className="space-y-3 pb-2">
      <h2 className="text-xl font-semibold tracking-tight">{t("nextLearningActions")}</h2>
      <Card className="border-slate-200/85 bg-white/95 p-4 shadow-sm shadow-slate-200/50 dark:border-border/80 dark:bg-card/70 dark:shadow-none">
        <div className="flex flex-wrap gap-2">
          {actions.map((action) => {
            if (action.actionKey === "returnToDashboard") {
              return (
                <Button key={action.id} variant={action.kind === "primary" ? "default" : "outline"} asChild>
                  <Link href={`/${locale}/dashboard`}>{t("returnToDashboard")}</Link>
                </Button>
              );
            }

            return (
              <Button
                key={action.id}
                variant={action.kind === "primary" ? "default" : "outline"}
                onClick={() => onAction(t(action.actionKey))}
              >
                {t(action.actionKey)}
              </Button>
            );
          })}
        </div>
      </Card>
    </section>
  );
}
