"use client";

import {ArrowDownAZ, ArrowUpAZ} from "lucide-react";
import {useTranslations} from "next-intl";

import {Input} from "@/components/ui/input";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import type {HardestQuestion} from "@/data/admin-analytics";

type HardestQuestionsTableProps = {
  rows: HardestQuestion[];
  searchValue: string;
  sortDirection: "asc" | "desc";
  onSearchChange: (value: string) => void;
  onToggleAccuracySort: () => void;
};

export function HardestQuestionsTable({
  rows,
  searchValue,
  sortDirection,
  onSearchChange,
  onToggleAccuracySort
}: HardestQuestionsTableProps) {
  const t = useTranslations("adminAnalytics");

  return (
    <Card className="rounded-2xl border-border/70 bg-card/75 py-0">
      <CardHeader className="flex flex-row items-center justify-between gap-3 pt-5 pb-2">
        <CardTitle className="text-lg font-semibold tracking-tight">{t("hardestQuestions")}</CardTitle>
        <Input
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={t("hardest.searchPlaceholder")}
          className="h-9 w-[210px] rounded-xl border-border/70 bg-background/45"
        />
      </CardHeader>
      <CardContent className="pt-1 pb-5">
        <div className="overflow-x-auto">
          <Table className="min-w-[760px]">
            <TableHeader>
              <TableRow>
                <TableHead>{t("hardest.columns.questionPreview")}</TableHead>
                <TableHead>{t("hardest.columns.type")}</TableHead>
                <TableHead>{t("hardest.columns.testName")}</TableHead>
                <TableHead>
                  <button type="button" className="inline-flex items-center gap-1 text-left" onClick={onToggleAccuracySort}>
                    {t("hardest.columns.accuracy")}
                    {sortDirection === "asc" ? <ArrowDownAZ className="size-3.5" /> : <ArrowUpAZ className="size-3.5" />}
                  </button>
                </TableHead>
                <TableHead>{t("hardest.columns.attempts")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="max-w-[280px] truncate italic">{row.preview}</TableCell>
                  <TableCell>{row.type}</TableCell>
                  <TableCell>{row.testName}</TableCell>
                  <TableCell className="font-semibold text-rose-400">{row.accuracy.toFixed(1)}%</TableCell>
                  <TableCell>{row.attempts.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
