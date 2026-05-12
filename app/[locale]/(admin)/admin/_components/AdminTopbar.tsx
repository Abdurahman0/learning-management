"use client";

import type {ReactNode} from "react";
import {Search} from "lucide-react";
import {useTranslations} from "next-intl";

import {Button} from "@/components/ui/button";
import {ThemeToggle} from "@/components/theme-toggle";
import {Input} from "@/components/ui/input";
import {Separator} from "@/components/ui/separator";

import {AdminProfileMenu} from "./AdminProfileMenu";
import {AdminNotificationBell} from "./AdminNotificationBell";
import {AdminSidebarMobileNav} from "./AdminSidebar";

type AdminTopbarProps = {
  title?: string;
  actions?: ReactNode;
  search?: {
    value: string;
    onValueChange: (value: string) => void;
    placeholder?: string;
  };
};

export function AdminTopbar({title, actions, search}: AdminTopbarProps) {
  const t = useTranslations("adminDashboard");

  return (
    <header className="sticky top-0 z-20 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <h1 className="truncate text-lg font-semibold tracking-tight sm:text-xl">{title ?? t("topbar.title")}</h1>
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

        {actions ? <div className="ml-auto hidden shrink-0 items-center gap-2 sm:flex">{actions}</div> : null}

        <div className={`flex shrink-0 items-center gap-1.5 sm:gap-2 ${actions ? "ml-auto sm:ml-0" : "ml-auto"}`}>
          <div className="hidden lg:block">
            <ThemeToggle />
          </div>

          <AdminNotificationBell label={t("topbar.notificationsLabel")} />

          <AdminProfileMenu compact visibility="all" className="lg:hidden" />
          <AdminSidebarMobileNav />

          <Separator orientation="vertical" className="mx-1 hidden h-6 lg:block" />
          <AdminProfileMenu visibility="all" className="hidden lg:flex" />
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

      {actions ? (
        <div className="border-t border-border/60 px-4 py-3 sm:hidden">
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        </div>
      ) : null}
    </header>
  );
}
