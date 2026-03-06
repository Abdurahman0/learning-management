"use client";

import {useEffect, useState} from "react";
import {useTranslations} from "next-intl";

import {Avatar, AvatarFallback} from "@/components/ui/avatar";
import {Badge} from "@/components/ui/badge";
import {Separator} from "@/components/ui/separator";
import {Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle} from "@/components/ui/sheet";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import type {AdminUser} from "@/data/admin-users";

import {UserHistoryTab} from "./UserHistoryTab";
import {UserOverviewTab} from "./UserOverviewTab";
import {UserPaymentsTab} from "./UserPaymentsTab";

type UserProfileDrawerProps = {
  open: boolean;
  user: AdminUser | null;
  onOpenChange: (open: boolean) => void;
  onSendMessage: (user: AdminUser) => void;
  onResetPassword: (user: AdminUser) => void;
};

const statusClassName = {
  verified: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  active: "border-blue-500/30 bg-blue-500/10 text-blue-300",
  suspended: "border-rose-500/30 bg-rose-500/10 text-rose-300"
} as const;

const planClassName = {
  free: "border-slate-500/35 bg-slate-500/14 text-slate-300",
  pro: "border-blue-500/35 bg-blue-500/14 text-blue-300",
  premium: "border-amber-500/35 bg-amber-500/14 text-amber-300"
} as const;

function formatDate(dateString: string, t: (key: string, values?: Record<string, string | number>) => string) {
  const [year, monthStr] = dateString.split("-");
  const monthIndex = Number(monthStr) - 1;
  const monthKeys = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"] as const;
  const month = monthKeys[monthIndex] ?? "jan";

  return `${t(`dates.months.${month}`)} ${year}`;
}

export function UserProfileDrawer({open, user, onOpenChange, onSendMessage, onResetPassword}: UserProfileDrawerProps) {
  const t = useTranslations("adminUsers");
  const [tab, setTab] = useState("overview");

  useEffect(() => {
    if (open) {
      setTab("overview");
    }
  }, [open, user?.id]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-[580px] overflow-y-auto border-l border-border/70 bg-background/95 p-0 sm:max-w-[520px]">
        {user ? (
          <div className="space-y-0">
            <SheetHeader className="border-b border-border/70 p-5 pt-6 pr-14">
              <div className="flex items-start gap-3">
                <Avatar className="size-14 rounded-xl ring-2 ring-border/70">
                  <AvatarFallback className="rounded-xl bg-primary/15 text-base font-semibold text-primary">{user.avatarFallback}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 space-y-1 text-left">
                  <SheetTitle className="truncate text-2xl leading-tight font-semibold tracking-tight">{user.name}</SheetTitle>
                  <SheetDescription className="text-sm text-muted-foreground">
                    {t("drawer.memberSince", {date: formatDate(user.joinedAt, t)})}
                  </SheetDescription>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <Badge className={`border px-2 py-0.5 text-[10px] tracking-wide uppercase ${statusClassName[user.status]}`}>
                      {t(`status.${user.status}`)}
                    </Badge>
                    <Badge className={`border px-2 py-0.5 text-[10px] tracking-wide uppercase ${planClassName[user.plan]}`}>
                      {t(`plan.${user.plan}`)}
                    </Badge>
                  </div>
                </div>
              </div>
            </SheetHeader>

            <Tabs value={tab} onValueChange={setTab} className="px-5 pt-3">
              <TabsList className="h-11 w-full justify-start overflow-x-auto">
                <TabsTrigger value="overview" className="h-11 px-4">
                  {t("drawer.tabs.overview")}
                </TabsTrigger>
                <TabsTrigger value="history" className="h-11 px-4">
                  {t("drawer.tabs.history")}
                </TabsTrigger>
                <TabsTrigger value="payments" className="h-11 px-4">
                  {t("drawer.tabs.payments")}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="pt-4 pb-5">
                <UserOverviewTab user={user} onSendMessage={onSendMessage} onResetPassword={onResetPassword} />
              </TabsContent>

              <TabsContent value="history" className="pt-4 pb-5">
                <UserHistoryTab items={user.history} />
              </TabsContent>

              <TabsContent value="payments" className="pt-4 pb-5">
                <UserPaymentsTab items={user.payments} />
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="p-6">
            <SheetTitle className="text-base">{t("drawer.title")}</SheetTitle>
            <Separator className="my-3" />
            <p className="text-sm text-muted-foreground">{t("table.empty")}</p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

