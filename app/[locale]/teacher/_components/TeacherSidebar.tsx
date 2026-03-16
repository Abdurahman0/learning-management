"use client";

import Link from "next/link";
import {usePathname} from "next/navigation";
import type {LucideIcon} from "lucide-react";
import {
  BarChart3,
  CircleUserRound,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  Megaphone,
  Menu,
  MessageSquare,
  ShieldAlert,
  Settings,
  Star,
  Users
} from "lucide-react";
import {useLocale, useTranslations} from "next-intl";

import {Button} from "@/components/ui/button";
import {ScrollArea} from "@/components/ui/scroll-area";
import {Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger} from "@/components/ui/sheet";
import {teacherNavItems, type TeacherNavKey} from "@/data/teacher-dashboard";
import {cn} from "@/lib/utils";

const navIcons: Record<TeacherNavKey, LucideIcon> = {
  dashboard: LayoutDashboard,
  myStudents: Users,
  assignments: ClipboardList,
  reviews: Star,
  messages: MessageSquare,
  analytics: BarChart3,
  weakAreas: ShieldAlert,
  announcements: Megaphone,
  profile: CircleUserRound,
  settings: Settings
};

function getItemHref(locale: string, segment: string) {
  return segment ? `/${locale}/teacher/${segment}` : `/${locale}/teacher`;
}

function normalizePath(path: string) {
  if (path.length > 1 && path.endsWith("/")) {
    return path.slice(0, -1);
  }

  return path;
}

function isItemActive(pathname: string, href: string, segment: string) {
  const currentPath = normalizePath(pathname);
  const targetPath = normalizePath(href);

  if (!segment) {
    return currentPath === targetPath;
  }

  return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`);
}

type TeacherNavListProps = {
  closeOnClick?: boolean;
};

function TeacherNavList({closeOnClick = false}: TeacherNavListProps) {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("teacherDashboard");
  const primaryItems = teacherNavItems.filter((item) => item.key !== "settings");
  const settingsItem = teacherNavItems.find((item) => item.key === "settings");

  return (
    <div className="flex h-full min-h-0 flex-col">
      <nav className="space-y-1.5">
        {primaryItems.map((item) => {
          const Icon = navIcons[item.key];
          const href = getItemHref(locale, item.segment);
          const active = isItemActive(pathname, href, item.segment);

          if (!item.enabled) {
            return (
              <div
                key={item.key}
                className="flex items-center justify-between rounded-xl border border-transparent px-3.5 py-2.5 text-sm text-muted-foreground/75"
                aria-disabled="true"
              >
                <span className="inline-flex items-center gap-2.5">
                  <Icon className="size-4" aria-hidden="true" />
                  {t(`sidebar.items.${item.key}`)}
                </span>
                <span className="rounded-md border border-border/80 bg-background/70 px-2 py-0.5 text-[10px] font-semibold uppercase">
                  {t("comingSoon")}
                </span>
              </div>
            );
          }

          const linkNode = (
            <Link
              href={href}
              className={cn(
                "flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "border-primary/35 bg-primary/18 text-primary"
                  : "border-transparent text-muted-foreground hover:border-border/70 hover:bg-muted/45 hover:text-foreground"
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              {t(`sidebar.items.${item.key}`)}
            </Link>
          );

          if (closeOnClick) {
            return (
              <SheetClose asChild key={item.key}>
                {linkNode}
              </SheetClose>
            );
          }

          return <div key={item.key}>{linkNode}</div>;
        })}
      </nav>

      {settingsItem ? (
        <div className="mt-auto border-t border-border/70 pt-3">
          {(() => {
            const Icon = navIcons[settingsItem.key];
            const href = getItemHref(locale, settingsItem.segment);
            const active = isItemActive(pathname, href, settingsItem.segment);

            if (!settingsItem.enabled) {
              return (
                <div
                  className="flex items-center justify-between rounded-xl border border-transparent px-3.5 py-2.5 text-sm text-muted-foreground/75"
                  aria-disabled="true"
                >
                  <span className="inline-flex items-center gap-2.5">
                    <Icon className="size-4" aria-hidden="true" />
                    {t(`sidebar.items.${settingsItem.key}`)}
                  </span>
                  <span className="rounded-md border border-border/80 bg-background/70 px-2 py-0.5 text-[10px] font-semibold uppercase">
                    {t("comingSoon")}
                  </span>
                </div>
              );
            }

            const linkNode = (
              <Link
                href={href}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "border-primary/35 bg-primary/18 text-primary"
                    : "border-transparent text-muted-foreground hover:border-border/70 hover:bg-muted/45 hover:text-foreground"
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
                {t(`sidebar.items.${settingsItem.key}`)}
              </Link>
            );

            if (closeOnClick) {
              return <SheetClose asChild>{linkNode}</SheetClose>;
            }

            return linkNode;
          })()}
        </div>
      ) : null}
    </div>
  );
}

export function TeacherSidebarMobileNav() {
  const t = useTranslations("teacherDashboard");

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="size-9 rounded-xl border-border/70 bg-card/50 lg:hidden">
          <Menu className="size-4" />
          <span className="sr-only">{t("sidebar.openMenu")}</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-76 gap-0 border-l border-border/70 bg-background/95 p-0">
        <SheetHeader className="border-b border-border/70">
          <SheetTitle className="flex items-center gap-2 text-left text-sm">
            <span className="inline-flex size-8 items-center justify-center rounded-lg bg-primary/18 text-primary">
              <GraduationCap className="size-4.5" />
            </span>
            <span>
              <span className="block font-semibold">{t("sidebar.brand")}</span>
              <span className="block text-xs font-normal text-muted-foreground">{t("sidebar.subtitle")}</span>
            </span>
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-86px)]">
          <div className="h-full px-4 py-4">
            <TeacherNavList closeOnClick />
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

export function TeacherSidebar() {
  const t = useTranslations("teacherDashboard");

  return (
    <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-border/70 bg-card/45 p-4 backdrop-blur-xl lg:flex lg:flex-col">
      <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-background/45 px-3 py-3.5">
        <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary">
          <GraduationCap className="size-4.5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold tracking-tight">{t("sidebar.brand")}</p>
          <p className="text-xs text-muted-foreground">{t("sidebar.subtitle")}</p>
        </div>
      </div>

      <div className="mt-4 min-h-0 flex-1">
        <TeacherNavList />
      </div>
    </aside>
  );
}
