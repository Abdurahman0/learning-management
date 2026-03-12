"use client";

import {useLocale, useTranslations} from "next-intl";

import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import type {TeacherStudentProfileAssignmentRow} from "@/data/teacher/selectors";

type TeacherStudentAssignmentsCardProps = {
  assignments: TeacherStudentProfileAssignmentRow[];
  onCreateAssignment: () => void;
  onAction: (assignmentId: string, action: "edit" | "review" | "viewReport") => void;
};

function getStatusClass(status: TeacherStudentProfileAssignmentRow["status"]) {
  if (status === "reviewed") {
    return "border-emerald-500/30 bg-emerald-500/15 text-emerald-300";
  }

  if (status === "completed") {
    return "border-blue-500/30 bg-blue-500/15 text-blue-300";
  }

  return "border-amber-500/30 bg-amber-500/15 text-amber-300";
}

function formatDate(locale: string, isoDate: string) {
  return new Intl.DateTimeFormat(locale, {month: "short", day: "numeric", year: "numeric"}).format(new Date(isoDate));
}

export function TeacherStudentAssignmentsCard({assignments, onCreateAssignment, onAction}: TeacherStudentAssignmentsCardProps) {
  const t = useTranslations("teacherStudentProfile");
  const locale = useLocale();

  return (
    <Card className="overflow-hidden rounded-2xl border-border/70 bg-card/75 py-0">
      <CardHeader className="flex flex-row items-center justify-between gap-2 pt-7 pb-3">
        <CardTitle className="text-xl">{t("activeAssignments")}</CardTitle>
        <Button type="button" variant="secondary" className="rounded-lg" onClick={onCreateAssignment}>
          {t("createAssignment")}
        </Button>
      </CardHeader>

      <CardContent className="border-t border-border/65 p-0">
        <div className="overflow-x-auto">
          <Table className="min-w-[780px]">
            <TableHeader>
              <TableRow>
                <TableHead>{t("columns.name")}</TableHead>
                <TableHead>{t("columns.module")}</TableHead>
                <TableHead>{t("columns.dueDate")}</TableHead>
                <TableHead>{t("columns.status")}</TableHead>
                <TableHead className="text-right">{t("columns.action")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.map((assignment) => {
                const action: "edit" | "review" | "viewReport" =
                  assignment.status === "pending" ? "edit" : assignment.status === "completed" ? "review" : "viewReport";

                return (
                  <TableRow key={assignment.id} className="hover:bg-muted/20">
                    <TableCell className="font-medium">{assignment.title}</TableCell>
                    <TableCell>{t(`modules.${assignment.module}`)}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(locale, assignment.dueAt)}</TableCell>
                    <TableCell>
                      <Badge className={`border ${getStatusClass(assignment.status)}`}>{t(`assignmentStatus.${assignment.status}`)}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button type="button" variant="ghost" size="sm" className="rounded-lg" onClick={() => onAction(assignment.assignmentId, action)}>
                        {t(action)}
                      </Button>
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
