"use client";

import {useTranslations} from "next-intl";

import {Card, CardContent} from "@/components/ui/card";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import type {UserHistoryItem} from "@/data/admin-users";

type UserHistoryTabProps = {
  items: UserHistoryItem[];
};

function formatDate(dateString: string, t: (key: string, values?: Record<string, string | number>) => string) {
  const [year, monthStr, dayStr] = dateString.split("-");
  const monthIndex = Number(monthStr) - 1;
  const monthKeys = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"] as const;
  const month = monthKeys[monthIndex] ?? "jan";

  return `${t(`dates.months.${month}`)} ${Number(dayStr || "1")}, ${year}`;
}

export function UserHistoryTab({items}: UserHistoryTabProps) {
  const t = useTranslations("adminUsers");

  return (
    <Card className="rounded-2xl border-border/70 bg-card/70 py-0">
      <CardContent className="pt-4 pb-2">
        <div className="overflow-x-auto">
          <Table className="min-w-[530px]">
            <TableHeader>
              <TableRow>
                <TableHead>{t("history.columns.testName")}</TableHead>
                <TableHead>{t("history.columns.module")}</TableHead>
                <TableHead>{t("history.columns.score")}</TableHead>
                <TableHead>{t("history.columns.date")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length ? (
                items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.testName}</TableCell>
                    <TableCell>{t(`modules.${item.module}`)}</TableCell>
                    <TableCell>{item.score}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(item.date, t)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                    {t("history.empty")}
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

