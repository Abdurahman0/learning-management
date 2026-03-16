"use client";

import Link from "next/link";
import {useLocale, useTranslations} from "next-intl";

import {Avatar, AvatarFallback} from "@/components/ui/avatar";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {
  teacherStudentsNeedingHelp,
  type TeacherLastActivityKey,
  type TeacherWeakAreaKey
} from "@/data/teacher-dashboard";

function getBandClass(band: number) {
  if (band <= 5.5) {
    return "border-rose-500/30 bg-rose-600/72 text-white dark:bg-rose-500/15 dark:text-rose-300";
  }

  return "border-amber-500/30 bg-amber-600/72 text-white dark:bg-amber-500/15 dark:text-amber-300";
}

export function TeacherStudentsNeedingHelpTable() {
  const t = useTranslations("teacherDashboard");
  const locale = useLocale();

  return (
    <Card className="overflow-hidden rounded-2xl border-border/70 bg-card/75 py-0">
      <CardHeader className="pt-5 pb-4">
        <CardTitle className="text-2xl">{t("studentsNeedingHelp")}</CardTitle>
      </CardHeader>

      <CardContent className="border-t border-border/65 p-0">
        <div className="overflow-x-auto">
          <Table className="min-w-205">
            <TableHeader>
              <TableRow>
                <TableHead className="h-12">{t("columns.studentName")}</TableHead>
                <TableHead className="h-12">{t("columns.currentBand")}</TableHead>
                <TableHead className="h-12">{t("columns.weakArea")}</TableHead>
                <TableHead className="h-12">{t("columns.lastActivity")}</TableHead>
                <TableHead className="h-12 text-right">{t("columns.action")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teacherStudentsNeedingHelp.map((item) => (
                <TableRow key={item.id} className="h-17.5">
                  <TableCell className="py-3.5">
                    <div className="flex items-center gap-2.5">
                      <Avatar size="sm">
                        <AvatarFallback className="bg-primary/18 text-primary">{item.studentInitials}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{item.studentName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3.5">
                    <span className={`inline-flex rounded-md border px-2.5 py-0.5 text-xs font-semibold ${getBandClass(item.currentBand)}`}>
                      {item.currentBand.toFixed(1)}
                    </span>
                  </TableCell>
                  <TableCell className="py-3.5">{t(`weakAreas.${item.weakArea as TeacherWeakAreaKey}`)}</TableCell>
                  <TableCell className="py-3.5 text-muted-foreground">
                    {t(`lastActivity.${item.lastActivity as TeacherLastActivityKey}`)}
                  </TableCell>
                  <TableCell className="py-3.5 text-right">
                    <Button asChild type="button" variant="secondary" className="rounded-lg">
                      <Link href={`/${locale}/teacher/students/${item.id}`}>
                      {t("viewStudent")}
                      </Link>
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
