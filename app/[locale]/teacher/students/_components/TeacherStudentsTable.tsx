"use client";

import Link from "next/link";
import {useLocale, useTranslations} from "next-intl";

import {Avatar, AvatarFallback} from "@/components/ui/avatar";
import {Button} from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import type {TeacherStudentListItem, TeacherStudentsLastActivity} from "@/data/teacher/selectors";

type TeacherStudentsTableProps = {
  students: TeacherStudentListItem[];
  totalStudents: number;
};

function formatLastActivity(t: ReturnType<typeof useTranslations>, value: TeacherStudentsLastActivity) {
  if (typeof value.value === "number") {
    return t(`lastActivity.${value.key}`, {value: value.value});
  }

  return t(`lastActivity.${value.key}`);
}

function getWeakSkillClass(skill: TeacherStudentListItem["weakestSkill"]) {
  if (skill === "writingTask2") {
    return "border-rose-500/30 bg-rose-500/14 text-rose-300";
  }

  if (skill === "speakingFluency") {
    return "border-amber-500/30 bg-amber-500/14 text-amber-300";
  }

  if (skill === "listeningPart4" || skill === "sentenceCompletion") {
    return "border-sky-500/30 bg-sky-500/14 text-sky-300";
  }

  return "border-indigo-500/30 bg-indigo-500/14 text-indigo-300";
}

function getBandStateLabel(t: ReturnType<typeof useTranslations>, student: TeacherStudentListItem) {
  if (student.estimatedBand >= student.targetBand) {
    return {label: t("bandState.achieved"), className: "text-emerald-300"};
  }

  if (student.progressState === "improving") {
    return {label: t("bandState.improving", {delta: `+${student.bandDelta.toFixed(1)}`}), className: "text-emerald-300"};
  }

  if (student.progressState === "needs_help") {
    return {label: t("bandState.needsHelp"), className: "text-amber-300"};
  }

  return {label: t("bandState.stable"), className: "text-muted-foreground"};
}

export function TeacherStudentsTable({students, totalStudents}: TeacherStudentsTableProps) {
  const t = useTranslations("teacherStudents");
  const locale = useLocale();

  return (
    <Card className="overflow-hidden rounded-2xl border-border/70 bg-card/75 py-0">
      <CardContent className="p-0">
        <div className="hidden overflow-x-auto md:block">
          <Table className="min-w-[1000px]">
            <TableHeader>
              <TableRow>
                <TableHead className="h-12">{t("studentName")}</TableHead>
                <TableHead className="h-12">{t("target")}</TableHead>
                <TableHead className="h-12">{t("estimatedBand")}</TableHead>
                <TableHead className="h-12">{t("weakestSkill")}</TableHead>
                <TableHead className="h-12">{t("lastActivityLabel")}</TableHead>
                <TableHead className="h-12">{t("pending")}</TableHead>
                <TableHead className="h-12 text-right">{t("action")}</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {students.map((student) => {
                const state = getBandStateLabel(t, student);

                return (
                  <TableRow key={student.id} className="h-[76px] hover:bg-muted/20">
                    <TableCell className="py-3.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar size="sm">
                          <AvatarFallback className="bg-primary/18 text-primary">{student.avatarFallback}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{student.name}</p>
                          <p className="text-xs text-muted-foreground">{student.studentCode}</p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="py-3.5 font-semibold text-primary">{student.targetBand.toFixed(1)}</TableCell>
                    <TableCell className="py-3.5">
                      <p className="font-semibold">{student.estimatedBand.toFixed(1)}</p>
                      <p className={`text-xs ${state.className}`}>{state.label}</p>
                    </TableCell>
                    <TableCell className="py-3.5">
                      <span className={`inline-flex rounded-md border px-2.5 py-0.5 text-xs font-semibold ${getWeakSkillClass(student.weakestSkill)}`}>
                        {t(`skills.${student.weakestSkill}`)}
                      </span>
                    </TableCell>
                    <TableCell className="py-3.5 text-muted-foreground">{formatLastActivity(t, student.lastActivity)}</TableCell>
                    <TableCell className="py-3.5">
                      <span className="inline-flex min-w-7 justify-center rounded-full border border-border/70 bg-background/65 px-2 py-0.5 text-xs font-semibold">
                        {student.pendingCount}
                      </span>
                    </TableCell>
                    <TableCell className="py-3.5 text-right">
                      <div className="flex justify-end gap-2">
                        <Button asChild variant="outline" className="rounded-lg border-border/70 bg-background/45">
                          <Link href={`/${locale}/teacher/students/${student.id}/progress`}>{t("viewProgress")}</Link>
                        </Button>
                        <Button asChild variant="secondary" className="rounded-lg">
                          <Link href={`/${locale}/teacher/students/${student.id}`}>{t("viewProfile")}</Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <div className="space-y-3 p-4 md:hidden">
          {students.map((student) => {
            const state = getBandStateLabel(t, student);

            return (
              <div key={student.id} className="rounded-xl border border-border/70 bg-background/45 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{student.name}</p>
                    <p className="text-xs text-muted-foreground">{student.studentCode}</p>
                  </div>
                  <span className="inline-flex min-w-7 justify-center rounded-full border border-border/70 bg-background/65 px-2 py-0.5 text-xs font-semibold">
                    {student.pendingCount}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <p className="text-muted-foreground">{t("target")}</p>
                  <p className="text-right font-semibold">{student.targetBand.toFixed(1)}</p>
                  <p className="text-muted-foreground">{t("estimatedBand")}</p>
                  <p className="text-right font-semibold">{student.estimatedBand.toFixed(1)}</p>
                  <p className="text-muted-foreground">{t("weakestSkill")}</p>
                  <p className="text-right">{t(`skills.${student.weakestSkill}`)}</p>
                  <p className="text-muted-foreground">{t("lastActivityLabel")}</p>
                  <p className="text-right">{formatLastActivity(t, student.lastActivity)}</p>
                </div>

                <p className={`mt-2 text-xs ${state.className}`}>{state.label}</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Button asChild variant="outline" className="h-9 rounded-lg border-border/70 bg-background/45">
                    <Link href={`/${locale}/teacher/students/${student.id}/progress`}>{t("viewProgress")}</Link>
                  </Button>
                  <Button asChild variant="secondary" className="h-9 rounded-lg">
                    <Link href={`/${locale}/teacher/students/${student.id}`}>{t("viewProfile")}</Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-t border-border/65 px-4 py-3 text-sm text-muted-foreground sm:px-5">
          {t("showingStudents", {visible: students.length, total: totalStudents})}
        </div>
      </CardContent>
    </Card>
  );
}
