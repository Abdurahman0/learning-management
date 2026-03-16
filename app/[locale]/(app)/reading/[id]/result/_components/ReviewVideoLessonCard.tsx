"use client";

import { Bookmark, Clock3, PlayCircle, UserRound } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { VideoLesson } from "@/data/review-reading";

type ReviewVideoLessonCardProps = {
  lesson: VideoLesson;
  onAction: (message: string) => void;
};

export function ReviewVideoLessonCard({ lesson, onAction }: ReviewVideoLessonCardProps) {
  const t = useTranslations("readingReview");

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xl font-semibold tracking-tight">{t("videoLesson")}</h2>
        <Badge variant="secondary" className="border-blue-300 bg-blue-100 text-blue-700 dark:border-blue-400/40 dark:bg-blue-500/15 dark:text-blue-100">
          {lesson.tag}
        </Badge>
      </div>

      <Card className="overflow-hidden border-slate-200/85 bg-white/95 p-0 shadow-sm shadow-slate-200/50 dark:border-border/80 dark:bg-card/70 dark:shadow-none">
        <div className="grid gap-0 lg:grid-cols-[300px_minmax(0,1fr)]">
          <div className="relative flex min-h-45 items-center justify-center border-b border-slate-200 bg-linear-to-br from-blue-100 via-indigo-100/40 to-white dark:border-border/70 dark:from-blue-700/35 dark:via-indigo-700/20 dark:to-background lg:border-r lg:border-b-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(59,130,246,0.2),transparent_55%)] dark:bg-[radial-gradient(circle_at_20%_10%,rgba(59,130,246,0.25),transparent_55%)]" />
            <div className="relative text-center">
              <Button
                size="icon"
                className="size-14 rounded-full bg-blue-600 text-white hover:bg-blue-500"
                onClick={() => onAction(`${t("watchLesson")} - ${lesson.title}`)}
              >
                <PlayCircle className="size-7" />
              </Button>
              <p className="mt-2 text-xs text-muted-foreground">{lesson.thumbnailLabel ?? t("videoLesson")}</p>
            </div>
            <Badge className="absolute bottom-3 right-3 border border-slate-200 bg-white/90 text-slate-700 dark:border-border dark:bg-background/80 dark:text-foreground">
              {lesson.duration}
            </Badge>
          </div>

          <div className="space-y-4 p-4 sm:p-5">
            <div>
              <h3 className="text-xl font-semibold">{lesson.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{lesson.description}</p>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Clock3 className="size-4" />
                {t("duration")}: {lesson.duration}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <UserRound className="size-4" />
                {t("instructor")}: {lesson.instructor}
              </span>
            </div>

            {lesson.timestamps?.length ? (
              <div>
                <p className="mb-2 text-xs tracking-[0.14em] text-muted-foreground uppercase">{t("lessonTimestamps")}</p>
                <div className="flex flex-wrap gap-2">
                  {lesson.timestamps.map((stamp) => (
                    <Button
                      key={`${stamp.label}-${stamp.time}`}
                      size="sm"
                      variant="outline"
                      className="border-slate-200 bg-white/80 hover:bg-slate-100 dark:border-border dark:bg-background/50 dark:hover:bg-background/70"
                      onClick={() => onAction(`${stamp.label} (${stamp.time})`)}
                    >
                      {stamp.label}
                      <span className="text-xs text-muted-foreground">{stamp.time}</span>
                    </Button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <Button onClick={() => onAction(`${t("watchLesson")} - ${lesson.title}`)}>
                <PlayCircle className="size-4" />
                {t("watchLesson")}
              </Button>
              <Button variant="outline" onClick={() => onAction(`${t("saveForLater")} - ${lesson.title}`)}>
                <Bookmark className="size-4" />
                {t("saveForLater")}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </section>
  );
}
