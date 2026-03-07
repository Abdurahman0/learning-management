"use client";

import {Bell, CalendarDays, Download} from "lucide-react";
import {useTranslations} from "next-intl";

import {Button} from "@/components/ui/button";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Separator} from "@/components/ui/separator";
import {ThemeToggle} from "@/components/theme-toggle";
import type {AnalyticsRangeKey} from "@/data/admin-analytics";

import {AdminProfileMenu} from "../../_components/AdminProfileMenu";
import {AdminSidebarMobileNav} from "../../_components/AdminSidebar";

type AnalyticsHeaderProps = {
  selectedRange: AnalyticsRangeKey;
  onRangeChange: (range: AnalyticsRangeKey) => void;
  onExport: () => void;
};

export function AnalyticsHeader({selectedRange, onRangeChange, onExport}: AnalyticsHeaderProps) {
  const t = useTranslations("adminAnalytics");

  return (
    <header className="sticky top-0 z-20 border-b border-border/70 bg-background/85 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <AdminSidebarMobileNav />
          <h1 className="truncate text-lg font-semibold tracking-tight sm:text-xl">{t("title")}</h1>
        </div>

        <div className="ml-auto hidden items-center gap-2 sm:flex">
          <Select value={selectedRange} onValueChange={(value) => onRangeChange(value as AnalyticsRangeKey)}>
            <SelectTrigger className="h-10 w-[180px] rounded-xl border-border/70 bg-card/55">
              <CalendarDays className="size-4 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last7Days">{t("dateRanges.last7Days")}</SelectItem>
              <SelectItem value="last30Days">{t("dateRanges.last30Days")}</SelectItem>
              <SelectItem value="last3Months">{t("dateRanges.last3Months")}</SelectItem>
            </SelectContent>
          </Select>

          <Button className="h-10 rounded-xl px-4 font-semibold" onClick={onExport}>
            <Download className="size-4" />
            {t("exportReport")}
          </Button>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <ThemeToggle />

          <Button
            variant="ghost"
            size="icon"
            className="relative size-9 rounded-xl text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            aria-label={t("notificationsLabel")}
          >
            <Bell className="size-4.5" />
            <span className="absolute top-2.5 right-2.5 size-1.5 rounded-full bg-rose-500" />
          </Button>

          <Separator orientation="vertical" className="mx-1 hidden h-6 md:block" />
          <AdminProfileMenu />
        </div>
      </div>

      <div className="space-y-3 border-t border-border/60 px-4 py-3 sm:hidden">
        <div className="grid gap-2">
          <Select value={selectedRange} onValueChange={(value) => onRangeChange(value as AnalyticsRangeKey)}>
            <SelectTrigger className="h-10 rounded-xl border-border/70 bg-card/55">
              <CalendarDays className="size-4 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last7Days">{t("dateRanges.last7Days")}</SelectItem>
              <SelectItem value="last30Days">{t("dateRanges.last30Days")}</SelectItem>
              <SelectItem value="last3Months">{t("dateRanges.last3Months")}</SelectItem>
            </SelectContent>
          </Select>

          <Button className="h-10 rounded-xl px-4 font-semibold" onClick={onExport}>
            <Download className="size-4" />
            {t("exportReport")}
          </Button>
        </div>
      </div>
    </header>
  );
}
