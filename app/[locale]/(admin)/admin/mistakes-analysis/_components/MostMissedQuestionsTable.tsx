"use client";

import {ArrowDownAZ, ArrowUpAZ} from "lucide-react";
import {useTranslations} from "next-intl";

import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import type {MostMissedQuestion} from "@/data/admin-mistakes-analysis";

type MostMissedQuestionsTableProps = {
  rows: MostMissedQuestion[];
  sortBy: "accuracyRate" | "attempts";
  sortDirection: "asc" | "desc";
  onSortChange: (field: "accuracyRate" | "attempts") => void;
  onViewDetailedList: () => void;
};

export function MostMissedQuestionsTable({
  rows,
  sortBy,
  sortDirection,
  onSortChange,
  onViewDetailedList
}: MostMissedQuestionsTableProps) {
  const t = useTranslations("adminMistakesAnalysis");

  const SortIcon = sortDirection === "asc" ? ArrowDownAZ : ArrowUpAZ;

  return (
    <Card className="rounded-3xl border-border/70 bg-card/75 py-0">
      <CardHeader className="flex flex-row items-center justify-between gap-3 pt-5 pb-2">
        <CardTitle className="text-2xl font-semibold tracking-tight">{t("mostMissedQuestions")}</CardTitle>
        <Button type="button" variant="link" className="h-8 px-0 text-sm text-primary" onClick={onViewDetailedList}>
          {t("viewDetailedList")}
        </Button>
      </CardHeader>
      <CardContent className="pt-1 pb-5">
        <div className="overflow-x-auto">
          <Table className="min-w-[880px]">
            <TableHeader>
              <TableRow>
                <TableHead>{t("table.columns.questionPreview")}</TableHead>
                <TableHead>{t("table.columns.testName")}</TableHead>
                <TableHead>{t("table.columns.type")}</TableHead>
                <TableHead>
                  <button type="button" className="inline-flex items-center gap-1 text-left" onClick={() => onSortChange("accuracyRate")}>
                    {t("table.columns.accuracyRate")}
                    {sortBy === "accuracyRate" ? <SortIcon className="size-3.5" /> : null}
                  </button>
                </TableHead>
                <TableHead>
                  <button type="button" className="inline-flex items-center gap-1 text-left" onClick={() => onSortChange("attempts")}>
                    {t("table.columns.totalAttempts")}
                    {sortBy === "attempts" ? <SortIcon className="size-3.5" /> : null}
                  </button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length ? (
                rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="max-w-[350px] truncate text-sm">{row.preview}</TableCell>
                    <TableCell className="text-sm">{row.testName}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="rounded-md border-border/70 px-2 py-0.5 text-xs">
                        {row.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-base font-semibold text-rose-400">{row.accuracyRate}%</TableCell>
                    <TableCell className="text-base text-muted-foreground">{row.attempts.toLocaleString()}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                    {t("table.empty")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
