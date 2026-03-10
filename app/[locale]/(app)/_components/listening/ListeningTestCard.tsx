"use client";

import {ChevronDown, Clock3, ListChecks, Lock, Play} from "lucide-react";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {useLocale, useTranslations} from "next-intl";

import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card";
import type {ListeningTestItem} from "@/data/listening-tests";
import {cn} from "@/lib/utils";
import {DifficultySignal} from "./DifficultySignal";

type ListeningTestCardProps = {
  test: ListeningTestItem;
};

export function ListeningTestCard({test}: ListeningTestCardProps) {
  const t = useTranslations("guest");
  const locale = useLocale();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card className={cn("max-w-full overflow-hidden border-border bg-card py-0 shadow-sm", test.isPremium && "opacity-85", isOpen && !test.isPremium && "border-blue-600")}>
      <CardContent className="max-w-full p-0">
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

            <h3 className={cn("mt-2 truncate text-sm md:text-lg font-semibold text-foreground", test.isPremium && "text-muted-foreground")}>{test.title}</h3>

            <div className="mt-1.5 flex w-full min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex min-w-0 items-center gap-1.5">
                <Clock3 className="size-4 shrink-0" aria-hidden="true" />
                {test.durationMins} {t("meta.minutes")}
              </span>
              <span className="inline-flex min-w-0 items-center gap-1.5">
                <ListChecks className="size-4 shrink-0" aria-hidden="true" />
                {test.totalQuestions} {t("meta.questions")}
              </span>
              <span className="inline-flex min-w-0 max-w-full items-center gap-1.5 rounded-md bg-muted px-2 py-0.5 text-xs">
                <DifficultySignal difficulty={test.difficulty} />
                <span className="truncate">{t(`filters.${test.difficulty}`)}</span>
              </span>
            </div>
          </div>

          <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform", isOpen && "rotate-180")} aria-hidden="true" />
        </button>

        {isOpen && (
          <div className="max-w-full border-t border-border px-4 py-4">
            <div className="grid min-w-0 max-w-full grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-2.5 md:grid-cols-4">
              {test.sections.map((section) => (
                <div key={`${test.id}-${section.label}`} className="min-w-0 rounded-lg border border-border bg-background px-2.5 py-2 text-center">
                  <p className="truncate break-words text-[11px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">{section.label}</p>
                  <p className="mt-1 truncate break-words text-xs text-muted-foreground">{section.questions} {t("meta.questions")}</p>
                </div>
              ))}
            </div>

            <div className="mt-3.5">
              {test.isPremium ? (
                <Button
                  type="button"
                  disabled
                  className="h-10 w-full rounded-xl border border-border bg-muted text-sm font-semibold text-muted-foreground"
                >
                  <Lock className="mr-2 size-4" aria-hidden="true" />
                  {t("card.locked")}
                </Button>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push(`/${locale}/listening/${test.id}?mode=practice`)}
                    className="h-10 w-full rounded-xl text-sm font-semibold"
                  >
                    Practice
                  </Button>
                  <Button
                    type="button"
                    onClick={() => router.push(`/${locale}/listening/${test.id}?mode=real`)}
                    className="h-10 w-full rounded-xl bg-blue-600 text-sm font-semibold hover:bg-blue-600/90"
                  >
                    Real
                    <Play className="ml-2 size-4 fill-current" aria-hidden="true" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
