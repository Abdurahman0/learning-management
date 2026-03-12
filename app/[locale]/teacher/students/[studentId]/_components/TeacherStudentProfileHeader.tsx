"use client";

import Link from "next/link";
import {ChevronRight} from "lucide-react";
import {useLocale, useTranslations} from "next-intl";

import {Button} from "@/components/ui/button";

type TeacherStudentProfileHeaderProps = {
  studentName: string;
  progressHref: string;
};

export function TeacherStudentProfileHeader({studentName, progressHref}: TeacherStudentProfileHeaderProps) {
  const t = useTranslations("teacherStudentProfile");
  const locale = useLocale();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href={`/${locale}/teacher/students`} className="hover:text-foreground">
          {t("students")}
        </Link>
        <ChevronRight className="size-4" />
        <span className="font-medium text-foreground">{studentName}</span>
      </div>

      <Button asChild variant="outline" className="h-9 rounded-lg border-border/70 bg-background/45">
        <Link href={progressHref}>{t("viewProgress")}</Link>
      </Button>
    </div>
  );
}
