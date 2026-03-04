"use client";

import {ChevronDown, Clock3, ListChecks, Lock, Play} from "lucide-react";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {useLocale, useTranslations} from "next-intl";

import type {ReadingGuestTest} from "@/data/guest-tests";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card";
import {cn} from "@/lib/utils";
import {DifficultySignal} from "../guest-tests/DifficultySignal";

type ReadingTestCardProps = {
  test: ReadingGuestTest;
  defaultOpen?: boolean;
};

export function ReadingTestCard({test, defaultOpen = false}: ReadingTestCardProps) {
  const t = useTranslations("guest");
  const locale = useLocale();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Card className={cn("border-border bg-card py-0 shadow-sm", test.isPremium && "opacity-85", isOpen && !test.isPremium && "border-blue-600")}>
      <CardContent className="p-0">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex w-full items-center justify-between gap-2 px-4 py-3.5 text-left"
        >
          <div className="min-w-0">
            <Badge
              variant="secondary"
              className={cn(
                "h-6 rounded-md px-2.5 text-[11px] font-semibold tracking-wide uppercase",
                test.isPremium
                  ? "bg-muted text-muted-foreground"
                  : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
              )}
            >
              {test.isPremium ? (
                <span className="inline-flex items-center gap-1.5">
                  <Lock className="size-3" aria-hidden="true" />
                  {t("card.premium")}
                </span>
              ) : (
                t("card.free")
              )}
            </Badge>

            <h3 className={cn("mt-2 truncate text-lg font-semibold text-foreground", test.isPremium && "text-muted-foreground")}>{test.title}</h3>

            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Clock3 className="size-4" aria-hidden="true" />
                {test.durationMinutes} {t("meta.minutes")}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ListChecks className="size-4" aria-hidden="true" />
                {test.totalQuestions} {t("meta.questions")}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-0.5 text-xs">
                <DifficultySignal difficulty={test.difficulty} />
                {t(`filters.${test.difficulty}`)}
              </span>
            </div>
          </div>

          <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform", isOpen && "rotate-180")} aria-hidden="true" />
        </button>

        {isOpen && (
          <div className="border-t border-border px-4 py-4">
            <div className="grid gap-2.5 sm:grid-cols-3">
              {test.passages.map((passage, index) => (
                <div key={passage.title} className="rounded-lg border border-border bg-background px-3 py-2.5">
                  <p className="text-[11px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">{t("card.passage")} {index + 1}</p>
                  <p className="mt-1.5 text-sm font-medium text-foreground">{passage.title}</p>
                  <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span>{passage.questionsCount} {t("meta.questions")}</span>
                    <span>|</span>
                    <DifficultySignal difficulty={passage.difficulty} />
                    <span>{t(`filters.${passage.difficulty}`)}</span>
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-3.5">
              {test.isPremium ? (
                <Button type="button" disabled className="h-10 w-full rounded-xl border border-border bg-muted text-sm font-semibold text-muted-foreground">
                  <Lock className="mr-2 size-4" aria-hidden="true" />
                  {t("card.locked")}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={() => router.push(`/${locale}/reading/${test.id}`)}
                  className="h-10 w-full rounded-xl bg-blue-600 text-sm font-semibold hover:bg-blue-600/90"
                >
                  {t("card.startReadingFull")}
                  <Play className="ml-2 size-4 fill-current" aria-hidden="true" />
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
