"use client";

import {Bell, Search} from "lucide-react";
import {useTranslations} from "next-intl";

import {Avatar, AvatarFallback} from "@/components/ui/avatar";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Separator} from "@/components/ui/separator";
import {ThemeToggle} from "@/components/theme-toggle";
import {adminProfile} from "@/data/admin-dashboard";

import {AdminSidebarMobileNav} from "../../_components/AdminSidebar";

type UsersHeaderProps = {
  searchValue: string;
  onSearchChange: (value: string) => void;
};

export function UsersHeader({searchValue, onSearchChange}: UsersHeaderProps) {
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

