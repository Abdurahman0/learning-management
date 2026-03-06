"use client";

import {Bell, CalendarDays, Download, Search} from "lucide-react";
import {useTranslations} from "next-intl";

import {Avatar, AvatarFallback} from "@/components/ui/avatar";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Separator} from "@/components/ui/separator";
import {ThemeToggle} from "@/components/theme-toggle";
import {adminProfile} from "@/data/admin-dashboard";
import {MISTAKES_DATE_RANGE_OPTIONS, type MistakesDateRangeKey} from "@/data/admin-mistakes-analysis";

import {AdminSidebarMobileNav} from "../../_components/AdminSidebar";

type MistakesAnalysisHeaderProps = {
  searchQuery: string;
  selectedRange: MistakesDateRangeKey;
  onSearchChange: (value: string) => void;
  onRangeChange: (value: MistakesDateRangeKey) => void;
  onExport: () => void;
};

export function MistakesAnalysisHeader({
  searchQuery,
  selectedRange,
  onSearchChange,
  onRangeChange,
  onExport
}: MistakesAnalysisHeaderProps) {
  const t = useTranslations("adminMistakesAnalysis");

  return (
    <header className="sticky top-0 z-20 border-b border-border/70 bg-background/85 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <AdminSidebarMobileNav />
          <h1 className="truncate text-lg font-semibold tracking-tight sm:text-xl">{t("title")}</h1>
        </div>

        <div className="ml-auto hidden w-full max-w-[340px] md:block">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t("searchPlaceholder")}
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              className="h-10 rounded-xl border-border/70 bg-card/55 pl-9 focus-visible:ring-primary/35"
            />
          </div>
        </div>

        <div className="hidden items-center gap-2 sm:flex">
          <Select value={selectedRange} onValueChange={(value) => onRangeChange(value as MistakesDateRangeKey)}>
            <SelectTrigger className="h-10 w-[170px] rounded-xl border-border/70 bg-card/55">
              <CalendarDays className="size-4 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MISTAKES_DATE_RANGE_OPTIONS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {t(item.labelKey)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button type="button" className="h-10 rounded-xl px-4 font-semibold" onClick={onExport}>
            <Download className="size-4" />
            {t("exportInsights")}
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

          <div className="hidden items-center gap-2.5 md:flex">
            <div className="text-right leading-tight">
              <p className="text-sm font-medium">{adminProfile.name}</p>
              <p className="text-xs text-muted-foreground">{adminProfile.role}</p>
            </div>
            <Avatar className="ring-2 ring-border/70" size="lg">
              <AvatarFallback className="bg-primary/18 text-primary">{adminProfile.initials}</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>

      <div className="space-y-3 border-t border-border/60 px-4 py-3 md:hidden">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder={t("searchPlaceholder")}
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            className="h-10 rounded-xl border-border/70 bg-card/55 pl-9 focus-visible:ring-primary/35"
          />
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <Select value={selectedRange} onValueChange={(value) => onRangeChange(value as MistakesDateRangeKey)}>
            <SelectTrigger className="h-10 rounded-xl border-border/70 bg-card/55">
              <CalendarDays className="size-4 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MISTAKES_DATE_RANGE_OPTIONS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {t(item.labelKey)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button type="button" className="h-10 rounded-xl px-4 font-semibold" onClick={onExport}>
            <Download className="size-4" />
            {t("exportInsights")}
          </Button>
        </div>
      </div>
    </header>
  );
}

