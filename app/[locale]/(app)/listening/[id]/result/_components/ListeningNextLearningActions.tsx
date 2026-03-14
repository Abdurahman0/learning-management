"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type {
  ListeningReviewAction,
  ListeningReviewActionKey,
} from "@/data/student/listening-review";

type ListeningNextLearningActionsProps = {
  actions: ListeningReviewAction[];
  onAction: (actionKey: ListeningReviewActionKey) => void;
};

export function ListeningNextLearningActions({
  actions,
  onAction,
}: ListeningNextLearningActionsProps) {
  const t = useTranslations("listeningResult");
  const locale = useLocale();

  return (
    <section className="space-y-3 pb-2">
      <h2 className="text-xl font-semibold tracking-tight">{t("nextLearningActions")}</h2>
      <Card className="border-slate-200/85 bg-white/95 p-4 shadow-sm shadow-slate-200/50 dark:border-border/80 dark:bg-card/70 dark:shadow-none">
        <div className="flex flex-wrap gap-2">
          {actions.map((action) => {
            if (action.actionKey === "openReviewCenter") {
              return (
                <Button
                  key={action.id}
                  variant={action.kind === "primary" ? "default" : "outline"}
                  asChild
                >
                  <Link href={`/${locale}/review-center`}>
                    {t("openReviewCenter")}
                  </Link>
                </Button>
              );
            }

            return (
              <Button
                key={action.id}
                variant={action.kind === "primary" ? "default" : "outline"}
                onClick={() => onAction(action.actionKey)}
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

