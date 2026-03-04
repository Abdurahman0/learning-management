"use client";

import {ChevronDown, Clock3, ListChecks, Lock} from "lucide-react";
import {useState} from "react";
import {useTranslations} from "next-intl";

import type {ReadingGuestTest} from "@/data/guest-tests";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card";
import {cn} from "@/lib/utils";
import {DifficultySignal} from "./DifficultySignal";

type ReadingTestCardProps = {
  test: ReadingGuestTest;
  defaultOpen?: boolean;
};

export function ReadingTestCard({test, defaultOpen = false}: ReadingTestCardProps) {
  const t = useTranslations("guest");
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Card
      className={cn(
        "border-border bg-card py-0 shadow-sm",
        test.isPremium && "opacity-80",
        isOpen && !test.isPremium && "border-blue-600"
      )}
    >
      <CardContent className="p-0">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex w-full items-center justify-between px-4 py-3.5 text-left lg:px-5"
        >
          <div className="flex items-center gap-4">
            <Badge
              variant="secondary"
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-semibold uppercase",
                test.isPremium
                  ? "bg-muted text-muted-foreground"
                  : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
              )}
            >
              {test.isPremium ? t("card.premium") : t("card.free")}
            </Badge>
            <h3 className={cn("text-xl font-semibold text-foreground", test.isPremium && "text-muted-foreground")}>{test.title}</h3>
          </div>

          <div className="flex items-center gap-4 text-muted-foreground">
            <span className="inline-flex items-center gap-2 text-sm">
              <Clock3 className="size-4" aria-hidden="true" />
              {test.durationMinutes} {t("meta.minutes")}
            </span>
            <span className="inline-flex items-center gap-2 text-sm">
              <ListChecks className="size-4" aria-hidden="true" />
              {test.totalQuestions} {t("meta.questions")}
            </span>
            <span className="inline-flex items-center gap-2 text-sm">
              <DifficultySignal difficulty={test.difficulty} />
              {t(`filters.${test.difficulty}`)}
            </span>
            <ChevronDown className={cn("size-4 transition-transform", isOpen && "rotate-180")} aria-hidden="true" />
          </div>
        </button>

        {isOpen && (
          <div className="border-t border-border px-4 py-4 lg:px-5">
            <div className="grid gap-4 lg:grid-cols-3">
              {test.passages.map((passage, index) => (
                <div key={passage.title} className="rounded-xl border border-border bg-background p-3.5">
                  <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
                    {t("card.passage")} {index + 1}
                  </p>
                  <p className="mt-2.5 text-lg font-semibold text-foreground">{passage.title}</p>
                  <p className="mt-2 inline-flex items-center gap-2 text-sm text-muted-foreground">
                    <span>
                      {passage.questionsCount} {t("meta.questions")}
                    </span>
                    <span>•</span>
                    <DifficultySignal difficulty={passage.difficulty} />
                    <span>{t(`filters.${passage.difficulty}`)}</span>
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-end">
              {test.isPremium ? (
                <Button
                  type="button"
                  disabled
                  className="h-10 min-w-40 rounded-xl border border-border bg-muted text-sm text-muted-foreground"
                >
                  <Lock className="mr-2 size-4" aria-hidden="true" />
                  {t("card.locked")}
                </Button>
              ) : (
                <Button type="button" className="h-10 min-w-56 rounded-xl bg-blue-600 text-sm font-semibold hover:bg-blue-600/90">
                  {t("card.startReadingFull")}
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


