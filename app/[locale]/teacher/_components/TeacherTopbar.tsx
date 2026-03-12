"use client";

import {Bell, Search} from "lucide-react";
import {useTranslations} from "next-intl";

import {ThemeToggle} from "@/components/theme-toggle";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Separator} from "@/components/ui/separator";

import {TeacherProfileMenu} from "./TeacherProfileMenu";
import {TeacherSidebarMobileNav} from "./TeacherSidebar";

type TeacherTopbarProps = {
  title?: string;
};

export function TeacherTopbar({title}: TeacherTopbarProps) {
  const t = useTranslations("teacherDashboard");

  return (
    <header className="sticky top-0 z-20 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <TeacherSidebarMobileNav />
          <h2 className="truncate text-lg font-semibold tracking-tight sm:text-xl">{title ?? t("title")}</h2>
        </div>

        <div className="ml-auto hidden w-full max-w-xs md:block">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t("topbar.searchPlaceholder")}
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
          <TeacherProfileMenu />
        </div>
      </div>

      <div className="border-t border-border/60 px-4 py-3 md:hidden">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder={t("topbar.searchPlaceholder")}
            className="h-10 rounded-xl border-border/70 bg-card/55 pl-9 focus-visible:ring-primary/35"
          />
        </div>
      </div>
    </header>
  );
}
