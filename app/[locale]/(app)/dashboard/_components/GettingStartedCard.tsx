"use client";

import {useMemo} from "react";
import type React from "react";
import {useRouter} from "next/navigation";
import {useLocale, useTranslations} from "next-intl";
import {BookOpenText, Check, ChevronRight, ClipboardList, Headphones, LineChart} from "lucide-react";

import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {cn} from "@/lib/utils";
import {openOnboardingWizard} from "@/lib/onboarding-storage";

type GettingStartedCardProps = {
  isVisible: boolean;
  completedSurvey: boolean;
  triedListening: boolean;
  triedReading: boolean;
  checkedProgress: boolean;
};

type TaskId = "survey" | "listening" | "reading" | "progress";

export function GettingStartedCard({isVisible, completedSurvey, triedListening, triedReading, checkedProgress}: GettingStartedCardProps) {
  const t = useTranslations("dashboard.gettingStarted");
  const locale = useLocale();
  const router = useRouter();

  const tasks = useMemo(() => {
    const items: Array<{
      id: TaskId;
      done: boolean;
      label: string;
      icon: React.ComponentType<{className?: string}>;
      bubble: string;
      onClick?: () => void;
    }> = [
      {
        id: "survey",
        done: completedSurvey,
        label: t("tasks.survey"),
        icon: ClipboardList,
        bubble: "border-rose-400/45 text-rose-300 bg-rose-500/10",
        onClick: completedSurvey ? undefined : () => openOnboardingWizard()
      },
      {
        id: "listening",
        done: triedListening,
        label: t("tasks.listening"),
        icon: Headphones,
        bubble: "border-blue-400/45 text-blue-300 bg-blue-500/10",
        onClick: triedListening ? undefined : () => router.push(`/${locale}/listening`)
      },
      {
        id: "reading",
        done: triedReading,
        label: t("tasks.reading"),
        icon: BookOpenText,
        bubble: "border-emerald-400/45 text-emerald-300 bg-emerald-500/10",
        onClick: triedReading ? undefined : () => router.push(`/${locale}/reading`)
      },
      {
        id: "progress",
        done: checkedProgress,
        label: t("tasks.progress"),
        icon: LineChart,
        bubble: "border-violet-400/45 text-violet-300 bg-violet-500/10",
        onClick: undefined
      }
    ];

    return items;
  }, [checkedProgress, completedSurvey, locale, router, t, triedListening, triedReading]);

  const completedCount = tasks.filter((task) => task.done).length;
  const totalCount = tasks.length;
  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  if (!isVisible) return null;

  return (
    <section className="mt-4">
      <Card className="overflow-hidden rounded-2xl border-border/70 bg-card/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] animate-in fade-in slide-in-from-bottom-2 duration-500">
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="text-lg font-semibold tracking-tight">{t("title")}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{t("subtitle", {done: completedCount, total: totalCount})}</p>
          </div>

          <div className="flex items-start gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold text-foreground">{percent}%</p>
              <p className="text-[11px] text-muted-foreground">{t("percentLabel")}</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted/40">
            <div
              className="h-full rounded-full bg-linear-to-r from-rose-500 via-blue-500 to-violet-500 transition-[width] duration-700"
              style={{width: `${percent}%`}}
            />
          </div>

          <div className="overflow-hidden rounded-xl border border-border/60 bg-background/30">
            {tasks.map((task) => (
              <button
                key={task.id}
                type="button"
                disabled={!task.onClick}
                onClick={task.onClick}
                className={cn(
                  "group flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/25",
                  task.onClick ? "hover:bg-muted/35 cursor-pointer" : "cursor-default opacity-70",
                  "border-b border-border/60 last:border-b-0"
                )}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-full border", task.bubble)}>
                    {task.done ? <Check className="size-4" /> : <task.icon className="size-4" />}
                  </span>
                  <span className="truncate text-sm font-medium text-foreground">{task.label}</span>
                </div>

                {task.onClick ? (
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" />
                ) : (
                  <span className="text-xs text-muted-foreground">{t("done")}</span>
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
