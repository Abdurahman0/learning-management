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
  search?: {
    value: string;
    onValueChange: (value: string) => void;
    placeholder?: string;
  };
};

export function TeacherTopbar({title, search}: TeacherTopbarProps) {
  const t = useTranslations("teacherDashboard");

  return (
    <header className="sticky top-0 z-20 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <h2 className="truncate text-lg font-semibold tracking-tight sm:text-xl">{title ?? t("title")}</h2>
        </div>

        {search ? (
          <div className="hidden w-full max-w-xs md:block">
            <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={search.value}
              onChange={(event) => search.onValueChange(event.target.value)}
              placeholder={search.placeholder ?? t("topbar.searchPlaceholder")}
              className="h-10 rounded-xl border-border/70 bg-card/55 pl-9 focus-visible:ring-primary/35"
            />
            </div>
          </div>
        ) : null}

        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
          <div className="hidden lg:block">
            <ThemeToggle />
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="relative size-9 rounded-xl text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            aria-label={t("notificationsLabel")}
          >
            <Bell className="size-4.5" />
            <span className="absolute top-2.5 right-2.5 size-1.5 rounded-full bg-rose-500" />
          </Button>

          <TeacherProfileMenu compact visibility="all" className="lg:hidden" />
          <TeacherSidebarMobileNav />

          <Separator orientation="vertical" className="mx-1 hidden h-6 lg:block" />
          <TeacherProfileMenu visibility="all" className="hidden lg:flex" />
        </div>
      </div>

      {search ? (
        <div className="border-t border-border/60 px-4 py-3 md:hidden">
          <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={search.value}
            onChange={(event) => search.onValueChange(event.target.value)}
            placeholder={search.placeholder ?? t("topbar.searchPlaceholder")}
            className="h-10 rounded-xl border-border/70 bg-card/55 pl-9 focus-visible:ring-primary/35"
          />
          </div>
        </div>
      ) : null}
    </header>
  );
}
