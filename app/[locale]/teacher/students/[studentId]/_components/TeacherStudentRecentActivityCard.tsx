"use client";

import type {LucideIcon} from "lucide-react";
import {Activity, CheckCircle2, LogIn, MessageSquare, PenSquare} from "lucide-react";
import {useTranslations} from "next-intl";

import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import type {TeacherStudentProfileActivityKey, TeacherStudentProfileActivityRow} from "@/data/teacher/selectors";

type TeacherStudentRecentActivityCardProps = {
  activity: TeacherStudentProfileActivityRow[];
};

function relativeTimeLabel(t: ReturnType<typeof useTranslations>, occurredAt: string) {
  const diffMinutes = Math.max(1, Math.round((Date.now() - new Date(occurredAt).getTime()) / (1000 * 60)));

  if (diffMinutes < 60) {
    return t("relative.minutesAgo", {value: diffMinutes});
  }

  const hours = Math.round(diffMinutes / 60);
  if (hours < 24) {
    return t("relative.hoursAgo", {value: hours});
  }

  const date = new Date(occurredAt);
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return t("relative.yesterdayAt", {time: `${hh}:${mm}`});
}

const iconMap: Record<TeacherStudentProfileActivityKey, LucideIcon> = {
  completedReadingTest: CheckCircle2,
  submittedWritingAssignment: PenSquare,
  startedListeningDrill: Activity,
  loggedIntoDashboard: LogIn,
  sentMessage: MessageSquare
};

export function TeacherStudentRecentActivityCard({activity}: TeacherStudentRecentActivityCardProps) {
  const t = useTranslations("teacherStudentProfile");

  return (
    <Card className="rounded-2xl border-border/70 bg-card/75 py-0">
      <CardHeader className="pt-7 pb-3">
        <CardTitle className="text-xl">{t("recentActivity")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pb-5">
        {activity.map((item) => {
          const Icon = iconMap[item.activityKey];

          return (
            <div key={item.id} className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex size-7 items-center justify-center rounded-full border border-primary/25 bg-primary/12 text-primary">
                <Icon className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium">{t(`activityLabels.${item.activityKey}`)}</p>
                <p className="text-xs text-muted-foreground">{relativeTimeLabel(t, item.occurredAt)}</p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
