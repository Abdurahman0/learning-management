"use client";

import Link from "next/link";
import {ArrowRight} from "lucide-react";
import {useLocale, useTranslations} from "next-intl";

import {Avatar, AvatarFallback} from "@/components/ui/avatar";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import type {TeacherStudentsLastActivity, TeacherWeakAreasStudentRow} from "@/data/teacher/selectors";

type TeacherStudentsNeedingImprovementTableProps = {
  rows: TeacherWeakAreasStudentRow[];
  totalCount: number;
  viewAllHref: string;
};

function typeToneClass(type: TeacherWeakAreasStudentRow["weakestType"]) {
  if (type === "matchingHeadings" || type === "trueFalseNotGiven") {
    return "border-rose-500/30 bg-rose-600/72 text-white dark:bg-rose-500/14 dark:text-rose-300";
  }

  if (type === "writingTask2" || type === "sentenceCompletion") {
    return "border-amber-500/30 bg-amber-600/72 text-white dark:bg-amber-500/14 dark:text-amber-300";
  }

  if (type === "listeningPart4") {
    return "border-sky-500/30 bg-sky-600/72 text-white dark:bg-sky-500/14 dark:text-sky-300";
  }

  return "border-indigo-500/30 bg-indigo-600/72 text-white dark:bg-indigo-500/14 dark:text-indigo-300";
}

function formatLastActivity(t: ReturnType<typeof useTranslations>, value: TeacherStudentsLastActivity) {
  if (typeof value.value === "number") {
    return t(`lastActivity.${value.key}`, {value: value.value});
  }

  return t(`lastActivity.${value.key}`);
}

export function TeacherStudentsNeedingImprovementTable({
  rows,
  totalCount,
  viewAllHref
}: TeacherStudentsNeedingImprovementTableProps) {
  const t = useTranslations("teacherWeakAreas");
  const locale = useLocale();

  return (
    <Card className="overflow-hidden rounded-2xl border-border/70 bg-card/75 py-0">
      <CardHeader className="flex flex-row items-center justify-between gap-2 pt-6 pb-4">
        <CardTitle className="text-2xl">{t("studentsNeedingImprovement")}</CardTitle>
        <Button asChild variant="link" className="h-auto px-0 text-sm text-primary">
          <Link href={viewAllHref}>
            {t("viewAllStudents", {count: totalCount})}
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </CardHeader>

      <CardContent className="border-t border-border/65 p-0">
        <div className="hidden overflow-x-auto md:block">
          <Table className="min-w-240">
            <TableHeader>
              <TableRow>
                <TableHead className="h-12">{t("studentName")}</TableHead>
                <TableHead className="h-12">{t("weakestModule")}</TableHead>
                <TableHead className="h-12">{t("weakestType")}</TableHead>
                <TableHead className="h-12">{t("currentBand")}</TableHead>
                <TableHead className="h-12">{t("lastActivityLabel")}</TableHead>
                <TableHead className="h-12 text-right">{t("action")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((student) => (
                <TableRow key={student.id} className="h-18 hover:bg-muted/20">
                  <TableCell className="py-3.5">
                    <div className="flex items-center gap-2.5">
                      <Avatar size="sm">
                        <AvatarFallback className="bg-primary/18 text-primary">{student.avatarFallback}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{student.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3.5">{t(`modules.${student.weakestModule}`)}</TableCell>
                  <TableCell className="py-3.5">
                    <span className={`inline-flex rounded-md border px-2.5 py-0.5 text-xs font-semibold ${typeToneClass(student.weakestType)}`}>
                      {t(`questionTypeLabels.${student.weakestType}`)}
                    </span>
                  </TableCell>
                  <TableCell className="py-3.5 font-semibold">{student.currentBand.toFixed(1)}</TableCell>
                  <TableCell className="py-3.5 text-muted-foreground">{formatLastActivity(t, student.lastActivity)}</TableCell>
                  <TableCell className="py-3.5 text-right">
                    <Button asChild variant="secondary" className="rounded-lg">
                      <Link href={`/${locale}/teacher/students/${student.id}`}>{t("viewProfile")}</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="space-y-3 p-4 md:hidden">
          {rows.map((student) => (
            <div key={`mobile-${student.id}`} className="space-y-3 rounded-xl border border-border/70 bg-background/45 p-3">
              <div className="flex items-center gap-2.5">
                <Avatar size="sm">
                  <AvatarFallback className="bg-primary/18 text-primary">{student.avatarFallback}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate font-medium">{student.name}</p>
                  <p className="text-xs text-muted-foreground">{formatLastActivity(t, student.lastActivity)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <p className="text-muted-foreground">{t("weakestModule")}</p>
                <p className="text-right">{t(`modules.${student.weakestModule}`)}</p>
                <p className="text-muted-foreground">{t("weakestType")}</p>
                <p className="text-right">{t(`questionTypeLabels.${student.weakestType}`)}</p>
                <p className="text-muted-foreground">{t("currentBand")}</p>
                <p className="text-right font-semibold">{student.currentBand.toFixed(1)}</p>
              </div>

              <Button asChild className="h-9 w-full rounded-lg">
                <Link href={`/${locale}/teacher/students/${student.id}`}>{t("viewProfile")}</Link>
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
