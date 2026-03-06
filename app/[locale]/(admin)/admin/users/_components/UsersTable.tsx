"use client";

import {ChevronLeft, ChevronRight} from "lucide-react";
import {useTranslations} from "next-intl";

import {Avatar, AvatarFallback} from "@/components/ui/avatar";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import type {AdminUser} from "@/data/admin-users";
import {cn} from "@/lib/utils";

type UsersTableProps = {
  users: AdminUser[];
  selectedUserId: string | null;
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  onRowClick: (userId: string) => void;
  onPageChange: (page: number) => void;
};

const planClassName: Record<AdminUser["plan"], string> = {
  free: "border-slate-500/35 bg-slate-500/14 text-slate-300",
  pro: "border-blue-500/35 bg-blue-500/14 text-blue-300",
  premium: "border-amber-500/35 bg-amber-500/14 text-amber-300"
};

const moduleColorClass: Record<keyof AdminUser["stats"], string> = {
  reading: "bg-blue-500",
  listening: "bg-cyan-500",
  writing: "bg-amber-500",
  speaking: "bg-violet-500"
};

function getVisiblePages(page: number, totalPages: number) {
  if (totalPages <= 6) {
    return Array.from({length: totalPages}, (_, index) => index + 1);
  }

  if (page <= 3) {
    return [1, 2, 3, 4, -1, totalPages];
  }

  if (page >= totalPages - 2) {
    return [1, -1, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, -1, page - 1, page, page + 1, -2, totalPages];
}

export function UsersTable({users, selectedUserId, page, pageSize, totalItems, totalPages, onRowClick, onPageChange}: UsersTableProps) {
  const t = useTranslations("adminUsers");
  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = totalItems === 0 ? 0 : start + users.length - 1;
  const visiblePages = getVisiblePages(page, totalPages);

  return (
    <Card className="overflow-hidden rounded-3xl border-border/70 bg-card/70 py-0">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table className="min-w-[940px]">
            <TableHeader>
              <TableRow>
                <TableHead>{t("table.columns.user")}</TableHead>
                <TableHead>{t("table.columns.plan")}</TableHead>
                <TableHead>{t("table.columns.band")}</TableHead>
                <TableHead>{t("table.columns.moduleStats")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                    {t("table.empty")}
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow
                    key={user.id}
                    className={cn(
                      "h-[84px] cursor-pointer transition-colors hover:bg-muted/35",
                      selectedUserId === user.id ? "bg-primary/10 hover:bg-primary/14" : ""
                    )}
                    onClick={() => onRowClick(user.id)}
                  >
                    <TableCell className="py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="ring-2 ring-border/70" size="lg">
                          <AvatarFallback className="bg-primary/15 font-semibold text-primary">{user.avatarFallback}</AvatarFallback>
                        </Avatar>
                        <div className="space-y-0.5">
                          <p className="text-lg leading-tight font-semibold tracking-tight">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                          <p className="text-xs text-muted-foreground">{t("table.userId", {id: user.id})}</p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="py-4">
                      <Badge className={`border px-2.5 py-0.5 text-[10px] tracking-wide uppercase ${planClassName[user.plan]}`}>
                        {t(`plan.${user.plan}`)}
                      </Badge>
                    </TableCell>

                    <TableCell className="py-4 text-2xl font-semibold tracking-tight">{user.overallBand.toFixed(1)}</TableCell>

                    <TableCell className="py-4">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {(Object.keys(user.stats) as Array<keyof AdminUser["stats"]>).map((key) => (
                          <span key={`${user.id}-${key}`} className="inline-flex items-center gap-1 rounded-md border border-border/70 bg-muted/35 px-2 py-1 text-xs">
                            <span className={`size-1.5 rounded-full ${moduleColorClass[key]}`} />
                            {t(`modulesShort.${key}`)} {user.stats[key]}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/70 px-6 py-4">
          <p className="text-sm text-muted-foreground">{t("table.showingResults", {from: start, to: end, total: totalItems})}</p>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              className="rounded-lg"
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page <= 1}
              aria-label={t("pagination.previous")}
            >
              <ChevronLeft className="size-4" />
            </Button>

            {visiblePages.map((item, index) =>
              item < 0 ? (
                <span key={`ellipsis-${index}`} className="px-1.5 text-muted-foreground">
                  ...
                </span>
              ) : (
                <Button
                  key={item}
                  variant={item === page ? "default" : "ghost"}
                  size="icon-sm"
                  className={`rounded-lg ${item === page ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""}`}
                  onClick={() => onPageChange(item)}
                >
                  {item}
                </Button>
              )
            )}

            <Button
              variant="ghost"
              size="icon-sm"
              className="rounded-lg"
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              aria-label={t("pagination.next")}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
