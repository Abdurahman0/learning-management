"use client";

import {useTranslations} from "next-intl";

import {Avatar, AvatarFallback} from "@/components/ui/avatar";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import type {RecentProgressItem} from "@/data/admin-achievements";

type RecentUserProgressTableProps = {
  rows: RecentProgressItem[];
  onViewAll: () => void;
};

export function RecentUserProgressTable({rows, onViewAll}: RecentUserProgressTableProps) {
  const t = useTranslations("adminAchievements");

  return (
    <Card className="rounded-3xl border-border/70 bg-card/75 py-0">
      <CardHeader className="flex flex-row items-center justify-between gap-3 pt-5 pb-2">
        <CardTitle className="text-2xl font-semibold tracking-tight">{t("recentUserProgress")}</CardTitle>
        <Button type="button" variant="link" className="h-8 px-0 text-sm text-primary" onClick={onViewAll}>
          {t("viewAll")}
        </Button>
      </CardHeader>
      <CardContent className="pt-1 pb-5">
        <div className="overflow-x-auto">
          <Table className="min-w-[760px]">
            <TableHeader>
              <TableRow>
                <TableHead>{t("table.columns.user")}</TableHead>
                <TableHead>{t("table.columns.achievement")}</TableHead>
                <TableHead>{t("table.columns.dateEarned")}</TableHead>
                <TableHead>{t("table.columns.currentStreak")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length ? (
                rows.map((row) => (
                  <TableRow key={row.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar className="ring-2 ring-border/65" size="lg">
                          <AvatarFallback className="bg-primary/16 text-primary">{row.avatarFallback}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{row.userName}</p>
                          <p className="truncate text-xs text-muted-foreground">{row.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{row.achievement}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{row.dateEarned}</TableCell>
                    <TableCell className="text-base font-semibold text-amber-400">{row.currentStreak}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
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
