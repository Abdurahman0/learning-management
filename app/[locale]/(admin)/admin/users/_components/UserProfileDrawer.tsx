"use client";

import {useEffect, useState} from "react";
import {Crown, Loader2} from "lucide-react";
import {useTranslations} from "next-intl";

import {Avatar, AvatarFallback} from "@/components/ui/avatar";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Separator} from "@/components/ui/separator";
import {Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle} from "@/components/ui/sheet";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import type {AdminUser} from "@/data/admin-users";

import {UserHistoryTab} from "./UserHistoryTab";
import {UserOverviewTab} from "./UserOverviewTab";
import {UserPaymentsTab} from "./UserPaymentsTab";
import {UserPremiumHistoryTab} from "./UserPremiumHistoryTab";

type UserProfileDrawerProps = {
  open: boolean;
  user: AdminUser | null;
  onOpenChange: (open: boolean) => void;
  onSendMessage: (user: AdminUser) => void;
  onResetPassword: (user: AdminUser) => void;
  onTogglePremium?: (userId: string, enable: boolean) => void;
  premiumLoading?: Set<string>;
};

const statusClassName = {
  verified: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  active: "border-blue-500/30 bg-blue-500/10 text-blue-300",
  suspended: "border-rose-500/30 bg-rose-500/10 text-rose-300"
} as const;

function formatDate(dateString: string, t: (key: string, values?: Record<string, string | number>) => string) {
  const parsedDate = new Date(dateString);
  const safeDate = Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
  const year = safeDate ? String(safeDate.getFullYear()) : dateString.split("-")[0];
  const monthStr = safeDate ? String(safeDate.getMonth() + 1) : dateString.split("-")[1];
  const day = safeDate ? String(safeDate.getDate()).padStart(2, "0") : "";
  const monthIndex = Number(monthStr) - 1;
  const monthKeys = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"] as const;
  const month = monthKeys[monthIndex] ?? "jan";

  return day ? `${t(`dates.months.${month}`)} ${day}, ${year}` : `${t(`dates.months.${month}`)} ${year}`;
}

export function UserProfileDrawer({open, user, onOpenChange, onSendMessage, onResetPassword, onTogglePremium, premiumLoading}: UserProfileDrawerProps) {
  const t = useTranslations("adminUsers");
  const [tab, setTab] = useState("overview");

  useEffect(() => {
    if (open) {
      setTab("overview");
    }
  }, [open, user?.id]);

  const isPremiumToggleLoading = user ? (premiumLoading?.has(user.id) ?? false) : false;

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
                <div className="min-w-0 flex-1 space-y-1 text-left">
                  <SheetTitle className="truncate text-2xl leading-tight font-semibold tracking-tight">{user.name}</SheetTitle>
                  <SheetDescription className="text-sm text-muted-foreground">
                    {t("drawer.memberSince", {date: formatDate(user.joinedAt, t)})}
                  </SheetDescription>
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <Badge className={`border px-2 py-0.5 text-[10px] tracking-wide uppercase ${statusClassName[user.status]}`}>
                      {t(`status.${user.status}`)}
                    </Badge>
                    {user.isPremium ? (
                      <Badge className="border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] tracking-wide uppercase text-amber-400">
                        <Crown className="mr-1 size-2.5" />
                        Premium
                      </Badge>
                    ) : (
                      <Badge className="border border-slate-500/20 bg-slate-500/8 px-2 py-0.5 text-[10px] tracking-wide uppercase text-muted-foreground">
                        Free
                      </Badge>
                    )}
                    {onTogglePremium ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={isPremiumToggleLoading}
                        onClick={() => onTogglePremium(user.id, !user.isPremium)}
                        className={`h-6 rounded-md border px-2 text-[10px] font-semibold uppercase tracking-wide ${user.isPremium ? "border-rose-500/30 bg-rose-500/8 text-rose-400 hover:bg-rose-500/15" : "border-amber-500/30 bg-amber-500/8 text-amber-500 hover:bg-amber-500/15"}`}
                      >
                        {isPremiumToggleLoading ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : user.isPremium ? (
                          "Revoke"
                        ) : (
                          "Grant"
                        )}
                      </Button>
                    ) : null}
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
                <TabsTrigger value="premium" className="h-11 px-4">
                  <Crown className="mr-1.5 size-3.5" />
                  Premium
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

              <TabsContent value="premium" className="pt-4 pb-5">
                <UserPremiumHistoryTab userId={user.id} />
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
