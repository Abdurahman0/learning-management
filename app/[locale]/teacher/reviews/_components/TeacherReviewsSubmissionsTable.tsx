"use client";

import {useTranslations} from "next-intl";

import {Avatar, AvatarFallback} from "@/components/ui/avatar";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import type {TeacherReviewSubmission} from "@/data/teacher/selectors";
import {cn} from "@/lib/utils";

type TeacherReviewsSubmissionsTableProps = {
  submissions: TeacherReviewSubmission[];
  selectedSubmissionId: string | null;
  onSelectSubmission: (submissionId: string) => void;
};

function statusClass(status: TeacherReviewSubmission["status"]) {
  if (status === "reviewed") {
    return "border-emerald-500/35 bg-emerald-500/15 text-emerald-300";
  }

  if (status === "overdue") {
    return "border-rose-500/35 bg-rose-500/15 text-rose-300";
  }

  return "border-amber-500/35 bg-amber-500/15 text-amber-300";
}

function moduleClass(type: TeacherReviewSubmission["type"]) {
  if (type === "writing") {
    return "border-indigo-500/35 bg-indigo-500/15 text-indigo-200";
  }

  if (type === "speaking") {
    return "border-violet-500/35 bg-violet-500/15 text-violet-200";
  }

  if (type === "listening_practice") {
    return "border-sky-500/35 bg-sky-500/15 text-sky-200";
  }

  return "border-blue-500/35 bg-blue-500/15 text-blue-200";
}

function formatRelativeTime(t: ReturnType<typeof useTranslations>, isoDate: string) {
  const diffMinutes = Math.max(1, Math.round((Date.now() - new Date(isoDate).getTime()) / (1000 * 60)));

  if (diffMinutes < 60) {
    return t("relative.minutesAgo", {value: diffMinutes});
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return t("relative.hoursAgo", {value: diffHours});
  }

  if (diffHours < 48) {
    return t("relative.yesterday");
  }

  return t("relative.daysAgo", {value: Math.round(diffHours / 24)});
}

export function TeacherReviewsSubmissionsTable({
  submissions,
  selectedSubmissionId,
  onSelectSubmission
}: TeacherReviewsSubmissionsTableProps) {
  const t = useTranslations("teacherReviews");

  return (
    <Card className="overflow-hidden rounded-2xl border-border/70 bg-card/75 py-0">
      <CardHeader className="flex flex-row items-center justify-between gap-2 pt-7 pb-3">
        <CardTitle className="text-2xl">{t("studentSubmissions")}</CardTitle>
        <p className="text-xs text-muted-foreground">{t("showingSubmissions", {count: submissions.length})}</p>
      </CardHeader>

      <CardContent className="border-t border-border/65 p-0">
        <div className="hidden overflow-x-auto md:block">
          <Table className="min-w-[980px]">
            <TableHeader>
              <TableRow>
                <TableHead>{t("student")}</TableHead>
                <TableHead>{t("assignment")}</TableHead>
                <TableHead>{t("module")}</TableHead>
                <TableHead>{t("submitted")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead className="text-right">{t("action")}</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {submissions.map((item) => {
                const isSelected = selectedSubmissionId === item.id;
                const statusText = t(`statusOptions.${item.status}`);
                const actionLabel = item.status === "reviewed" ? t("viewDetails") : t("review");

                return (
                  <TableRow
                    key={item.id}
                    className={cn("cursor-pointer hover:bg-muted/20", isSelected && "bg-muted/20")}
                    onClick={() => onSelectSubmission(item.id)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar size="sm">
                          <AvatarFallback className="bg-primary/18 text-primary">{item.studentAvatarFallback}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{item.studentName}</p>
                          <p className="text-xs text-muted-foreground">{item.studentId}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{item.assignmentTitle}</TableCell>
                    <TableCell>
                      <span className={`inline-flex rounded-md border px-2.5 py-0.5 text-xs font-semibold ${moduleClass(item.type)}`}>
                        {t(`typeOptions.${item.type}`)}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatRelativeTime(t, item.submittedAt)}</TableCell>
                    <TableCell>
                      <span className={`inline-flex rounded-md border px-2.5 py-0.5 text-xs font-semibold ${statusClass(item.status)}`}>
                        {statusText}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        className="rounded-lg"
                        onClick={(event) => {
                          event.stopPropagation();
                          onSelectSubmission(item.id);
                        }}
                      >
                        {actionLabel}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <div className="space-y-3 p-4 md:hidden">
          {submissions.map((item) => {
            const isSelected = selectedSubmissionId === item.id;
            const actionLabel = item.status === "reviewed" ? t("viewDetails") : t("review");

            return (
              <div
                key={item.id}
                className={cn("rounded-xl border border-border/70 bg-background/45 p-3", isSelected && "border-primary/45")}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{item.studentName}</p>
                    <p className="truncate text-sm text-muted-foreground">{item.assignmentTitle}</p>
                  </div>
                  <span className={`inline-flex rounded-md border px-2 py-0.5 text-[11px] font-semibold ${statusClass(item.status)}`}>
                    {t(`statusOptions.${item.status}`)}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                  <span className={`inline-flex rounded-md border px-2 py-0.5 font-semibold ${moduleClass(item.type)}`}>
                    {t(`typeOptions.${item.type}`)}
                  </span>
                  <span className="text-muted-foreground">{formatRelativeTime(t, item.submittedAt)}</span>
                </div>

                <Button type="button" variant="secondary" className="mt-3 h-9 w-full rounded-lg" onClick={() => onSelectSubmission(item.id)}>
                  {actionLabel}
                </Button>
              </div>
            );
          })}
        </div>

        <div className="border-t border-border/65 px-4 py-3 text-sm text-muted-foreground sm:px-5">
          {t("tableFooter", {count: submissions.length})}
        </div>
      </CardContent>
    </Card>
  );
}
