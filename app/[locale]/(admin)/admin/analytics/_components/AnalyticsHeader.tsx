"use client";

import {CalendarDays, Download} from "lucide-react";
import {useTranslations} from "next-intl";

import {Button} from "@/components/ui/button";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
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
    <header className="sticky top-0 z-20 border-b border-border/70 bg-background/90 backdrop-blur-xl">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 lg:hidden">
          <AdminSidebarMobileNav />
        </div>

        <h1 className="text-lg font-semibold tracking-tight sm:text-xl">{t("title")}</h1>

        <div className="ml-auto flex flex-wrap items-center gap-2">
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
          <AdminProfileMenu compact className="ml-1" />
        </div>
      </div>
    </header>
  );
}
