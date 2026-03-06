"use client";

import {useTranslations} from "next-intl";

import {Avatar, AvatarFallback} from "@/components/ui/avatar";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {recentActivity, type ActivityAvatarTone, type ActivityStatus} from "@/data/admin-dashboard";

const avatarToneClass: Record<ActivityAvatarTone, string> = {
  blue: "bg-sky-500/20 text-sky-300",
  emerald: "bg-emerald-500/20 text-emerald-300",
  violet: "bg-violet-500/20 text-violet-300",
  amber: "bg-amber-500/20 text-amber-300"
};

const statusClass: Record<ActivityStatus, string> = {
  verified: "border-emerald-500/30 bg-emerald-500/15 text-emerald-300",
  active: "border-blue-500/30 bg-blue-500/15 text-blue-300",
  pendingReview: "border-amber-500/30 bg-amber-500/15 text-amber-300"
};

export function AdminRecentActivity() {
  const t = useTranslations("adminDashboard");

  return (
    <Card className="overflow-hidden rounded-2xl border-border/70 bg-card/75 py-0">
      <CardHeader className="flex flex-row items-center justify-between gap-3 pt-5 pb-4">
        <CardTitle className="text-xl">{t("activity.title")}</CardTitle>
        <Button variant="ghost" size="sm" className="h-8 rounded-lg px-2 text-sm text-primary hover:bg-primary/10 hover:text-primary">
          {t("activity.viewAll")}
        </Button>
      </CardHeader>

      <CardContent className="border-t border-border/65 p-0">
        <div className="overflow-x-auto">
          <Table className="min-w-[690px]">
            <TableHeader>
              <TableRow>
                <TableHead className="h-12">{t("activity.columns.user")}</TableHead>
                <TableHead className="h-12">{t("activity.columns.action")}</TableHead>
                <TableHead className="h-12">{t("activity.columns.score")}</TableHead>
                <TableHead className="h-12">{t("activity.columns.status")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentActivity.map((item) => (
                <TableRow key={item.id} className="h-[68px]">
                  <TableCell className="py-3.5">
                    <div className="flex items-center gap-2.5">
                      <Avatar size="sm">
                        <AvatarFallback className={avatarToneClass[item.avatarTone]}>{item.userInitials}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{item.userName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3.5 text-sm">{item.action}</TableCell>
                  <TableCell className={`py-3.5 ${item.score === "-" ? "font-semibold text-muted-foreground" : "font-semibold"}`}>{item.score}</TableCell>
                  <TableCell className="py-3.5">
                    <Badge className={`border px-2.5 py-0.5 text-[10px] tracking-wide uppercase ${statusClass[item.status]}`}>
                      {t(`activity.statuses.${item.status}`)}
                    </Badge>
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
