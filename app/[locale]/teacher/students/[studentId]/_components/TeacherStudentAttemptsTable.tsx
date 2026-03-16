"use client";

import {Eye} from "lucide-react";
import {useLocale, useTranslations} from "next-intl";

import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import type {TeacherStudentProfileAttemptRow} from "@/data/teacher/selectors";

type TeacherStudentAttemptsTableProps = {
  attempts: TeacherStudentProfileAttemptRow[];
  onViewAttempt: (attemptId: string) => void;
};

function formatDate(locale: string, isoDate: string) {
  return new Intl.DateTimeFormat(locale, {month: "short", day: "numeric", year: "numeric"}).format(new Date(isoDate));
}

export function TeacherStudentAttemptsTable({attempts, onViewAttempt}: TeacherStudentAttemptsTableProps) {
  const t = useTranslations("teacherStudentProfile");
  const locale = useLocale();

  return (
    <Card className="overflow-hidden rounded-2xl border-border/70 bg-card/75 py-0">
      <CardHeader className="flex flex-row items-center justify-between pt-7 pb-3">
        <CardTitle className="text-xl">{t("recentTestAttempts")}</CardTitle>
      </CardHeader>

      <CardContent className="border-t border-border/65 p-0">
        <div className="overflow-x-auto">
          <Table className="min-w-195">
            <TableHeader>
              <TableRow>
                <TableHead>{t("columns.testName")}</TableHead>
                <TableHead>{t("columns.module")}</TableHead>
                <TableHead>{t("columns.score")}</TableHead>
                <TableHead>{t("columns.band")}</TableHead>
                <TableHead>{t("columns.date")}</TableHead>
                <TableHead className="text-right">{t("columns.action")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attempts.map((attempt) => (
                <TableRow key={attempt.id} className="hover:bg-muted/20">
                  <TableCell className="font-medium">{attempt.title}</TableCell>
                  <TableCell>{t(`modules.${attempt.module}`)}</TableCell>
                  <TableCell>{attempt.scoreLabel}</TableCell>
                  <TableCell>{attempt.band === null ? "N/A" : attempt.band.toFixed(1)}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(locale, attempt.attemptedAt)}</TableCell>
                  <TableCell className="text-right">
                    <Button type="button" variant="ghost" size="sm" className="rounded-lg" onClick={() => onViewAttempt(attempt.id)}>
                      <Eye className="size-4" />
                      {t("view")}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
