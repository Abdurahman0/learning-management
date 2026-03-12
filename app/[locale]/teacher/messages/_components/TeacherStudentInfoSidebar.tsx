"use client";

import Link from "next/link";
import {useLocale, useTranslations} from "next-intl";

import {Avatar, AvatarFallback} from "@/components/ui/avatar";
import {Button} from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card";
import type {TeacherMessagesConversationData, TeacherStudentsLastActivity} from "@/data/teacher/selectors";

import {TeacherStudentRecentActivityCard} from "./TeacherStudentRecentActivityCard";

type TeacherStudentInfoSidebarProps = {
  conversationData: TeacherMessagesConversationData | null;
};

function formatRelative(t: ReturnType<typeof useTranslations>, value: TeacherStudentsLastActivity) {
  if (typeof value.value === "number") {
    return t(`relative.${value.key}`, {value: value.value});
  }

  return t(`relative.${value.key}`);
}

export function TeacherStudentInfoSidebar({conversationData}: TeacherStudentInfoSidebarProps) {
  const t = useTranslations("teacherMessages");
  const locale = useLocale();

  if (!conversationData) {
    return (
      <Card className="rounded-2xl border-border/70 bg-card/75 py-0">
        <CardContent className="flex min-h-[300px] items-center justify-center p-5 text-center text-sm text-muted-foreground">
          {t("selectConversation")}
        </CardContent>
      </Card>
    );
  }

  const student = conversationData.studentInfo;

  return (
    <div className="space-y-5">
      <Card className="rounded-2xl border-border/70 bg-card/75 py-0">
        <CardContent className="space-y-4 p-5">
          <div className="flex flex-col items-center text-center">
            <Avatar size="lg">
              <AvatarFallback className="bg-primary/18 text-primary">{student.studentAvatarFallback}</AvatarFallback>
            </Avatar>
            <p className="mt-3 text-xl font-semibold">{student.studentName}</p>
            <p className="text-sm text-muted-foreground">{t(student.subtitleKey)}</p>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between rounded-lg border border-border/70 bg-background/40 px-3 py-2">
              <span className="text-sm text-muted-foreground">{t("bandEstimate")}</span>
              <span className="font-semibold">{student.bandEstimate.toFixed(1)}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/70 bg-background/40 px-3 py-2">
              <span className="text-sm text-muted-foreground">{t("targetBand")}</span>
              <span className="font-semibold">{student.targetBand.toFixed(1)}</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-lg border border-border/70 bg-background/40 px-3 py-2">
                <p className="text-xs text-muted-foreground">{t("activity")}</p>
                <p className="mt-1 text-sm font-semibold">{formatRelative(t, student.lastActivity)}</p>
              </div>
              <div className="rounded-lg border border-border/70 bg-background/40 px-3 py-2">
                <p className="text-xs text-muted-foreground">{t("testsCompleted")}</p>
                <p className="mt-1 text-sm font-semibold">{t("testsCompletedValue", {count: student.testsCompleted})}</p>
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            <Button asChild variant="secondary" className="h-10 w-full rounded-lg">
              <Link href={`/${locale}/teacher/students/${student.studentId}`}>{t("viewStudentProfile")}</Link>
            </Button>
            <Button asChild className="h-10 w-full rounded-lg">
              <Link href={`/${locale}/teacher/assignments?studentId=${student.studentId}`}>{t("assignTask")}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <TeacherStudentRecentActivityCard items={conversationData.recentActivity} />
    </div>
  );
}
