"use client";

import {Loader2, Search} from "lucide-react";
import {useTranslations} from "next-intl";

import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Separator} from "@/components/ui/separator";
import {ThemeToggle} from "@/components/theme-toggle";

import {AdminProfileMenu} from "../../_components/AdminProfileMenu";
import {AdminNotificationBell} from "../../_components/AdminNotificationBell";
import {AdminSidebarMobileNav} from "../../_components/AdminSidebar";

type UsersHeaderProps = {
  searchValue: string;
  onSearchChange: (value: string) => void;
  isSearching?: boolean;
};

export function UsersHeader({searchValue, onSearchChange, isSearching}: UsersHeaderProps) {
  const t = useTranslations("adminUsers");

  return (
    <header className="sticky top-0 z-20 border-b border-border/70 bg-background/85 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <AdminSidebarMobileNav />
          <h1 className="truncate text-lg font-semibold tracking-tight sm:text-xl">{t("title")}</h1>
        </div>

        <div className="ml-auto hidden w-full max-w-[360px] md:block">
          <div className="relative">
            {isSearching
              ? <Loader2 className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
              : <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />}
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

          <AdminNotificationBell label={t("notificationsLabel")} />

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

