"use client";

import {Bell, Search} from "lucide-react";
import {useTranslations} from "next-intl";

import {ThemeToggle} from "@/components/theme-toggle";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Separator} from "@/components/ui/separator";

import {AdminProfileMenu} from "../../_components/AdminProfileMenu";
import {AdminSidebarMobileNav} from "../../_components/AdminSidebar";

type ReportsHeaderProps = {
  searchValue: string;
  onSearchChange: (value: string) => void;
};

export function ReportsHeader({searchValue, onSearchChange}: ReportsHeaderProps) {
  const t = useTranslations("adminReports");

  return (
    <header className="sticky top-0 z-20 border-b border-border/70 bg-background/85 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <AdminSidebarMobileNav />
          <h1 className="truncate text-lg font-semibold tracking-tight sm:text-xl">{t("title")}</h1>
        </div>

        <div className="ml-auto hidden w-full max-w-[420px] md:block">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t("searchPlaceholder")}
              value={searchValue}
              onChange={(event) => onSearchChange(event.target.value)}
              className="h-10 rounded-xl border-border/70 bg-card/55 pl-9 focus-visible:ring-primary/35"
            />
          </div>
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

      <div className="border-t border-border/60 px-4 py-3 md:hidden">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder={t("searchPlaceholder")}
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            className="h-10 rounded-xl border-border/70 bg-card/55 pl-9 focus-visible:ring-primary/35"
          />
        </div>
      </div>
    </header>
  );
}
