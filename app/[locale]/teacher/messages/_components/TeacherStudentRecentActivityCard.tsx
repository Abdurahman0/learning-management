"use client";

import {CheckCheck, FileCheck2, Headphones, MessageSquareText, MonitorSmartphone} from "lucide-react";
import {useTranslations} from "next-intl";

import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import type {TeacherMessagesRecentActivityItem, TeacherStudentsLastActivity} from "@/data/teacher/selectors";

type TeacherStudentRecentActivityCardProps = {
  items: TeacherMessagesRecentActivityItem[];
};

function formatRelative(t: ReturnType<typeof useTranslations>, value: TeacherStudentsLastActivity) {
  if (typeof value.value === "number") {
    return t(`relative.${value.key}`, {value: value.value});
  }

  return t(`relative.${value.key}`);
}

function activityIcon(key: TeacherMessagesRecentActivityItem["activityKey"]) {
  if (key === "completedReadingTest") {
    return <CheckCheck className="size-4 text-sky-300" />;
  }

  if (key === "submittedWritingAssignment") {
    return <FileCheck2 className="size-4 text-emerald-300" />;
  }

  if (key === "startedListeningDrill") {
    return <Headphones className="size-4 text-violet-300" />;
  }

  if (key === "sentMessage") {
    return <MessageSquareText className="size-4 text-amber-300" />;
  }

  return <MonitorSmartphone className="size-4 text-primary" />;
}

export function TeacherStudentRecentActivityCard({items}: TeacherStudentRecentActivityCardProps) {
  const t = useTranslations("teacherMessages");

  return (
    <Card className="rounded-2xl border-border/70 bg-card/75 py-0">
      <CardHeader className="pt-6 pb-3">
        <CardTitle className="text-xl">{t("recentActivity")}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-3.5 pb-5">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noRecentActivity")}</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="flex items-start gap-2.5">
              <span className="mt-0.5 inline-flex size-7 items-center justify-center rounded-full bg-background/55">
                {activityIcon(item.activityKey)}
              </span>
              <div>
                <p className="text-sm font-medium">{t(`activityLabels.${item.activityKey}`)}</p>
                <p className="text-xs text-muted-foreground">{formatRelative(t, item.relative)}</p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
