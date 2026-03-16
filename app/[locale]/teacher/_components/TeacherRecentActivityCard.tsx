"use client";

import type {LucideIcon} from "lucide-react";
import {ClipboardCheck, FileText, MessageSquare} from "lucide-react";
import {useTranslations} from "next-intl";

import {Avatar, AvatarFallback} from "@/components/ui/avatar";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {
  teacherRecentActivity,
  type TeacherActivityTone,
  type TeacherRecentActivityEventKey,
  type TeacherRecentActivityTimeKey
} from "@/data/teacher-dashboard";

const eventIcons: Record<TeacherRecentActivityEventKey, LucideIcon> = {
  completedReadingTest3: ClipboardCheck,
  submittedWritingTask1: FileText,
  sentMessage: MessageSquare
};

const toneClass: Record<TeacherActivityTone, string> = {
  blue: "bg-blue-600/72 text-white dark:bg-blue-500/20 dark:text-blue-300",
  emerald: "bg-emerald-600/72 text-white dark:bg-emerald-500/20 dark:text-emerald-300",
  violet: "bg-violet-600/72 text-white dark:bg-violet-500/20 dark:text-violet-300"
};

export function TeacherRecentActivityCard() {
  const t = useTranslations("teacherDashboard");

  return (
    <Card className="rounded-2xl border-border/70 bg-card/75 py-0">
      <CardHeader className="pt-5 pb-3">
        <CardTitle className="text-xl">{t("recentActivity")}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-3.5 pb-5">
        {teacherRecentActivity.map((item) => {
          const Icon = eventIcons[item.event];

          return (
            <div key={item.id} className="flex items-start gap-2.5">
              <Avatar size="sm">
                <AvatarFallback className={toneClass[item.tone]}>{item.studentInitials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-snug">
                  <span className="font-medium text-blue-300">{item.studentName}</span>{" "}
                  <span>{t(`activityFeed.events.${item.event as TeacherRecentActivityEventKey}`)}</span>
                </p>
                <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Icon className="size-3.5" />
                  {t(`activityFeed.time.${item.time as TeacherRecentActivityTimeKey}`)}
                </p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
