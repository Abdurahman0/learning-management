"use client";

import {useMemo} from "react";
import {useLocale, useTranslations} from "next-intl";

import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {findTeacherStudentById, type TeacherAssignmentRow} from "@/data/teacher/selectors";

type TeacherActiveAssignmentsTableProps = {
  rows: TeacherAssignmentRow[];
  onAction: (assignment: TeacherAssignmentRow, action: "view" | "edit" | "close" | "review") => void;
};

function statusClass(status: TeacherAssignmentRow["status"]) {
  if (status === "draft") {
    return "border-slate-500/35 bg-slate-500/15 text-slate-200";
  }

  if (status === "completed") {
    return "border-emerald-500/35 bg-emerald-500/15 text-emerald-300";
  }

  if (status === "overdue") {
    return "border-rose-500/35 bg-rose-500/15 text-rose-300";
  }

  return "border-blue-500/35 bg-blue-500/15 text-blue-200";
}

function formatDate(locale: string, isoDate: string) {
  return new Intl.DateTimeFormat(locale, {month: "short", day: "numeric", year: "numeric"}).format(new Date(isoDate));
}

function progressTone(progress: number) {
  if (progress < 45) {
    return "bg-amber-400";
  }

  if (progress >= 90) {
    return "bg-emerald-400";
  }

  return "bg-blue-500";
}

export function TeacherActiveAssignmentsTable({rows, onAction}: TeacherActiveAssignmentsTableProps) {
  const t = useTranslations("teacherAssignments");
  const locale = useLocale();

  const visibleRows = useMemo(() => rows.slice(0, 12), [rows]);

  return (
    <Card className="overflow-hidden rounded-2xl border-border/70 bg-card/75 py-0">
      <CardHeader className="pt-7 pb-3">
        <CardTitle className="text-2xl">{t("activeAssignmentsTable")}</CardTitle>
      </CardHeader>

      <CardContent className="border-t border-border/65 p-0">
        <div className="overflow-x-auto">
          <Table className="min-w-[1040px]">
            <TableHeader>
              <TableRow>
                <TableHead>{t("columns.title")}</TableHead>
                <TableHead>{t("columns.type")}</TableHead>
                <TableHead>{t("columns.assignedTo")}</TableHead>
                <TableHead>{t("columns.dueDate")}</TableHead>
                <TableHead>{t("columns.status")}</TableHead>
                <TableHead>{t("columns.progress")}</TableHead>
                <TableHead className="text-right">{t("columns.action")}</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {visibleRows.map((row) => {
                const firstStudent = row.assignedStudentIds[0] ? findTeacherStudentById(row.assignedStudentIds[0]) : null;
                const assignedLabel =
                  row.assignedToMode === "all"
                    ? t("assignToOptions.all")
                    : row.assignedToMode === "at_risk"
                      ? t("assignToOptions.at_risk")
                      : row.assignedToMode === "improving"
                        ? t("assignToOptions.improving")
                        : row.assignedStudentIds.length > 1
                          ? t("assignedCount", {count: row.assignedStudentIds.length})
                          : firstStudent?.name ?? t("assignToOptions.one");

                return (
                  <TableRow key={row.id} className="hover:bg-muted/20">
                    <TableCell className="font-medium">{row.title}</TableCell>
                    <TableCell>{t(`typeOptions.${row.type}`)}</TableCell>
                    <TableCell className="text-muted-foreground">{assignedLabel}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(locale, row.dueAt)}</TableCell>
                    <TableCell>
                      <Badge className={`border ${statusClass(row.status)}`}>{t(`statusOptions.${row.status}`)}</Badge>
                    </TableCell>
                    <TableCell className="w-[220px]">
                      <div className="group relative">
                        <div className="h-2 rounded-full bg-muted/70">
                          <div className={`h-2 rounded-full ${progressTone(row.progressPercent)}`} style={{width: `${row.progressPercent}%`}} />
                        </div>
                        <span className="pointer-events-none absolute -top-7 right-0 hidden rounded-md border border-border/70 bg-card px-2 py-0.5 text-[11px] font-semibold shadow-md group-hover:block">
                          {row.progressPercent}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1.5">
                        <Button type="button" variant="ghost" size="sm" className="rounded-lg" onClick={() => onAction(row, "view")}>
                          {t("view")}
                        </Button>
                        <Button type="button" variant="ghost" size="sm" className="rounded-lg" onClick={() => onAction(row, "edit")}>
                          {t("edit")}
                        </Button>
                        <Button type="button" variant="ghost" size="sm" className="rounded-lg" onClick={() => onAction(row, "review")}>
                          {t("reviewSubmissionsAction")}
                        </Button>
                        <Button type="button" variant="ghost" size="sm" className="rounded-lg" onClick={() => onAction(row, "close")}>
                          {t("close")}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
