"use client";

import {Calendar, ClipboardPlus, MessageSquare, NotebookPen, TrendingUp, Trophy} from "lucide-react";
import {useTranslations} from "next-intl";

import {Avatar, AvatarFallback} from "@/components/ui/avatar";
import {Button} from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card";

type TeacherStudentOverviewCardProps = {
  studentName: string;
  studentFallback: string;
  targetBand: number;
  currentBand: number;
  joinedDateLabel: string;
  lastActivityLabel: string;
  testsDone: number;
  streakDays: number;
  onAssignTask: () => void;
  onSendMessage: () => void;
  onAddTeacherNote: () => void;
};

export function TeacherStudentOverviewCard({
  studentName,
  studentFallback,
  targetBand,
  currentBand,
  joinedDateLabel,
  lastActivityLabel,
  testsDone,
  streakDays,
  onAssignTask,
  onSendMessage,
  onAddTeacherNote
}: TeacherStudentOverviewCardProps) {
  const t = useTranslations("teacherStudentProfile");

  return (
    <Card className="overflow-hidden rounded-3xl border-border/70 bg-card/80 py-0">
      <CardContent className="space-y-5 p-5 sm:p-6">
        <div className="flex flex-wrap items-start gap-4">
          <Avatar size="lg" className="ring-2 ring-border/70">
            <AvatarFallback className="bg-primary/18 text-primary">{studentFallback}</AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-2xl font-semibold tracking-tight sm:text-3xl">{studentName}</h1>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-primary">
                <Trophy className="size-3.5" />
                {t("targetBand")}: {targetBand.toFixed(1)}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-emerald-300">
                <TrendingUp className="size-3.5" />
                {t("currentBand")}: {currentBand.toFixed(1)}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/55 px-2.5 py-1 text-muted-foreground">
                <Calendar className="size-3.5" />
                {joinedDateLabel}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Button type="button" className="rounded-xl" onClick={onAssignTask}>
            <ClipboardPlus className="size-4" />
            {t("assignTask")}
          </Button>
          <Button type="button" variant="secondary" className="rounded-xl" onClick={onSendMessage}>
            <MessageSquare className="size-4" />
            {t("sendMessage")}
          </Button>
          <Button type="button" variant="outline" className="rounded-xl border-border/70 bg-background/45" onClick={onAddTeacherNote}>
            <NotebookPen className="size-4" />
            {t("addTeacherNote")}
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-border/70 bg-background/45 px-4 py-3.5">
            <p className="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">{t("lastActivity")}</p>
            <p className="mt-1 text-2xl font-semibold">{lastActivityLabel}</p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-background/45 px-4 py-3.5">
            <p className="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">{t("testsDone")}</p>
            <p className="mt-1 text-2xl font-semibold">{testsDone}</p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-background/45 px-4 py-3.5">
            <p className="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">{t("streak")}</p>
            <p className="mt-1 text-2xl font-semibold text-amber-300">{streakDays}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
