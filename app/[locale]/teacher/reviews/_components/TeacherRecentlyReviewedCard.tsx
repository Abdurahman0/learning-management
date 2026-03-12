"use client";

import {CheckCircle2, MoreVertical} from "lucide-react";
import {useTranslations} from "next-intl";

import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import type {TeacherReviewActivityItem} from "@/data/teacher/selectors";

type TeacherRecentlyReviewedCardProps = {
  items: TeacherReviewActivityItem[];
};

function formatRelativeTime(t: ReturnType<typeof useTranslations>, isoDate: string) {
  const diffMinutes = Math.max(1, Math.round((Date.now() - new Date(isoDate).getTime()) / (1000 * 60)));

  if (diffMinutes < 60) {
    return t("relative.minutesAgo", {value: diffMinutes});
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return t("relative.hoursAgo", {value: diffHours});
  }

  if (diffHours < 48) {
    return t("relative.yesterday");
  }

  return t("relative.daysAgo", {value: Math.round(diffHours / 24)});
}

export function TeacherRecentlyReviewedCard({items}: TeacherRecentlyReviewedCardProps) {
  const t = useTranslations("teacherReviews");

  return (
    <Card className="rounded-2xl border-border/70 bg-card/75 py-0">
      <CardHeader className="pt-7 pb-3">
        <CardTitle className="text-2xl">{t("recentlyReviewedActivity")}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-2.5 pb-5">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noRecentReviews")}</p>
        ) : null}

        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/65 bg-background/40 px-3 py-2.5">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                <span className="text-foreground">{item.studentName}</span> - {item.assignmentTitle}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("finalGradeLabel", {band: item.finalBand.toFixed(1)})} - {formatRelativeTime(t, item.reviewedAt)}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              <span className="inline-flex size-7 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">
                <CheckCircle2 className="size-4" />
              </span>
              <Button type="button" variant="ghost" size="icon" className="size-8 rounded-lg">
                <MoreVertical className="size-4" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
