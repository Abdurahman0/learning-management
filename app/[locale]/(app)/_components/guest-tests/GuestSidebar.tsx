"use client";

import Link from "next/link";
import {usePathname, useRouter} from "next/navigation";
import {BookOpen, Headphones, Home, Lock, Mic, PenLine} from "lucide-react";
import {useLocale, useTranslations} from "next-intl";

import {Avatar, AvatarFallback} from "@/components/ui/avatar";
import {Button} from "@/components/ui/button";
import {ThemeToggle} from "@/components/theme-toggle";
import {getStaticProfile} from "@/lib/auth/session";
import {cn} from "@/lib/utils";
import type {AppSessionRole} from "../session/AppSessionContext";

type GuestSidebarProps = {
  usedTests: number;
  totalTests: number;
  role: AppSessionRole;
};

export function GuestSidebar({usedTests, totalTests, role}: GuestSidebarProps) {
  const t = useTranslations("guest");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const isGuest = role === "guest";
  const profile = role === "guest" ? null : getStaticProfile(role);

  const dashboardHref = role === "admin" ? `/${locale}/admin` : `/${locale}/dashboard`;
  const readingHref = `/${locale}/reading`;
  const listeningHref = `/${locale}/listening`;

  const navItems = [
    ...(!isGuest
      ? [
          {
            key: "dashboard",
            label: t("sidebar.dashboard"),
            href: dashboardHref,
            icon: Home,
            disabled: false
          }
        ]
      : []),
    {
      key: "reading",
      label: t("sidebar.reading"),
      href: readingHref,
      icon: BookOpen,
      disabled: false
    },
    {
      key: "listening",
      label: t("sidebar.listening"),
      href: listeningHref,
      icon: Headphones,
      disabled: false
    },
    {
      key: "writing",
      label: t("sidebar.writingSoon"),
      icon: PenLine,
      disabled: true
    },
    {
      key: "speaking",
      label: t("sidebar.speakingSoon"),
      icon: Mic,
      disabled: true
    }
  ] as const;

  const handleSignOut = async () => {
    await fetch("/api/auth/logout", {method: "POST"});
    router.replace(`/${locale}/login`);
    router.refresh();
  };

  return (
    <aside className="sticky top-0 hidden h-screen w-76 shrink-0 flex-col border-r border-border bg-card/70 px-5 py-6 lg:flex">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-3xl font-extrabold tracking-tight text-blue-600">{t("brand")}</p>
          <p className="mt-1 text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
            {isGuest ? t("sidebar.guestMode") : "Member"}
          </p>
        </div>
        <ThemeToggle />
      </div>

      <nav className="mt-7 space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = !item.disabled && pathname.startsWith(item.href);

          if (item.disabled) {
            return (
              <div
                key={item.key}
                className="flex items-center justify-between rounded-xl px-3.5 py-2.5 text-muted-foreground/60"
              >
                <span className="flex items-center gap-2.5 text-base font-medium">
                  <Icon className="size-4" aria-hidden="true" />
                  {item.label}
                </span>
                <Lock className="size-4" aria-hidden="true" />
              </div>
            );
          }

          return (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-base font-medium transition-colors",
                active
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300"
                  : "text-foreground hover:bg-muted"
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {isGuest ? (
        <div className="mt-7 border-t border-border pt-5">
          <div className="mb-2.5 flex items-center justify-between">
            <p className="text-xl font-semibold text-foreground">{t("sidebar.dailyProgress")}</p>
            <p className="text-lg font-bold text-blue-600">
              {usedTests}/{totalTests}
            </p>
          </div>
          <div className="h-2.5 rounded-full bg-muted">
            <div
              className="h-2.5 rounded-full bg-blue-600"
              style={{width: `${(usedTests / totalTests) * 100}%`}}
              aria-hidden="true"
            />
          </div>
        </div>
      ) : null}

      {isGuest ? (
        <Button asChild className="mt-auto h-12 rounded-xl bg-blue-600 text-base font-semibold hover:bg-blue-600/90">
          <Link href={`/${locale}/auth`}>{t("sidebar.createAccount")}</Link>
        </Button>
      ) : (
        <div className="mt-auto space-y-2">
          <div className="rounded-xl border border-border/70 bg-background/55 px-3 py-2.5">
            <div className="flex items-center gap-2.5">
              <Avatar className="ring-2 ring-border/70" size="lg">
                <AvatarFallback className="bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
                  {profile?.initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{profile?.name}</p>
                <p className="truncate text-xs text-muted-foreground">{profile?.email}</p>
              </div>
            </div>
          </div>
          <Button type="button" variant="outline" className="h-10 w-full rounded-xl border-border/70 bg-background/45" onClick={handleSignOut}>
            Sign out
          </Button>
        </div>
      )}
    </aside>
  );
}
