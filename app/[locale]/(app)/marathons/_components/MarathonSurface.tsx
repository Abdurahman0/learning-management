"use client";

import Link from "next/link";
import {useEffect, useMemo, useState, type ReactNode} from "react";
import {ArrowLeft, Flame, Home, Map} from "lucide-react";
import {usePathname} from "next/navigation";
import {useLocale} from "next-intl";

import {authApi} from "@/lib/api/auth";
import {getUserInitials} from "@/lib/auth/current-user";
import {ThemeToggle} from "@/components/theme-toggle";
import {Avatar, AvatarFallback} from "@/components/ui/avatar";
import {Button} from "@/components/ui/button";
import {cn} from "@/lib/utils";


type MarathonSurfaceProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  showBack?: boolean;
  showLeaderboardNav?: boolean;
  hideHeader?: boolean;
  sidebarContent?: ReactNode;
};

export function MarathonSurface({
  title,
  subtitle,
  children,
  showBack = true,
  showLeaderboardNav = false,
  hideHeader = false,
  sidebarContent
}: MarathonSurfaceProps) {
  const locale = useLocale();
  const pathname = usePathname();
  const [realProfile, setRealProfile] = useState<{name: string; email: string; initials: string} | null>(null);
  const pathSegments = useMemo(() => pathname.split("/").filter(Boolean), [pathname]);
  const marathonsIndex = pathSegments.indexOf("marathons");
  const marathonId = marathonsIndex >= 0 ? pathSegments[marathonsIndex + 1] : null;
  const isBrowse = marathonId == null;
  const marathonBaseHref = marathonId ? `/${locale}/marathons/${marathonId}` : `/${locale}/marathons`;
  const isLeaderboardPage = marathonId ? pathname.startsWith(`${marathonBaseHref}/leaderboard`) : false;
  const marathonHref = marathonBaseHref;
  const leaderboardHref = marathonId ? `${marathonBaseHref}/leaderboard` : `/${locale}/marathons`;
  const dashboardActive = pathname.startsWith(`/${locale}/dashboard`);
  const marathonActive = pathname.startsWith(`/${locale}/marathons`) && !isLeaderboardPage;
  const leaderboardActive = isLeaderboardPage;
  const profile = useMemo(() => realProfile, [realProfile]);

  useEffect(() => {
    let isCancelled = false;

    const loadCurrentUser = async () => {
      const response = await authApi.me();
      if (isCancelled || !response.ok || !response.data) {
        return;
      }

      const fullName = response.data.full_name.trim();
      const email = response.data.email.trim();

      if (!fullName || !email) {
        return;
      }

      setRealProfile({
        name: fullName,
        email,
        initials: getUserInitials(fullName)
      });
    };

    void loadCurrentUser();

    return () => {
      isCancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.08),transparent_18%),linear-gradient(180deg,#f6f9ff_0%,#f9fbff_42%,#f5f8ff_100%)] text-slate-950 dark:bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.12),transparent_18%),linear-gradient(180deg,#08101c_0%,#0b1322_54%,#0a1220_100%)] dark:text-slate-100">
      <div className="pointer-events-none fixed inset-0 opacity-35 [background-image:radial-gradient(rgba(148,163,184,0.18)_1px,transparent_1px)] [background-size:20px_20px] dark:opacity-25" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.10),transparent_20%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.08),transparent_16%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.16),transparent_20%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.10),transparent_16%),radial-gradient(circle_at_bottom,rgba(15,23,42,0.35),transparent_40%)]" />

      <div className="relative flex min-h-screen w-full">
        <aside className="sticky top-0 hidden h-screen w-76 shrink-0 flex-col border-r border-border bg-card/70 px-5 py-6 backdrop-blur-sm lg:flex">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-3xl font-extrabold tracking-tight text-blue-600 dark:text-blue-400">EnglishLabs</p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Marathon mode</p>
            </div>
            <ThemeToggle />
          </div>

          <nav className="mt-7 space-y-1.5">
            <Link
              href={`/${locale}/dashboard`}
              className={cn(
                "flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-base font-medium transition-colors",
                dashboardActive
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300"
                  : "text-foreground hover:bg-muted"
              )}
            >
              <Home className="size-4" />
              Dashboard
            </Link>
            <Link
              href={marathonHref}
              className={cn(
                "flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-base font-medium transition-colors",
                marathonActive
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300"
                  : "text-foreground hover:bg-muted"
              )}
            >
              <Map className="size-4" />
              Marathon
            </Link>
            {showLeaderboardNav ? (
              <Link
                href={leaderboardHref}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-base font-medium transition-colors",
                  leaderboardActive
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300"
                    : "text-foreground hover:bg-muted"
                )}
              >
                <Flame className="size-4" />
                Leaderboard
              </Link>
            ) : null}
          </nav>

          {sidebarContent ? (
            <div className="mt-6 rounded-2xl border border-border/70 bg-background/45 p-3">
              {sidebarContent}
            </div>
          ) : null}

          <div className="mt-auto space-y-2">
            {showBack ? (
              <Button asChild variant="outline" className="h-10 w-full rounded-xl border-border/70 bg-background/45">
                <Link
                  href={`/${locale}/dashboard`}
                >
                  <ArrowLeft className="size-4" />
                  Back to dashboard
                </Link>
              </Button>
            ) : null}
            <div className="rounded-xl border border-border/70 bg-background/55 px-3 py-2.5">
              <div className="flex items-center gap-2.5">
                <Avatar className="ring-2 ring-border/70" size="lg">
                  <AvatarFallback className="bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
                    {profile?.initials ?? "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{profile?.name ?? "User"}</p>
                  <p className="truncate text-xs text-muted-foreground">{profile?.email ?? ""}</p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1 px-4 py-5 sm:px-6 lg:px-8">
          {!hideHeader ? (
            <header className="mb-6 rounded-[32px] border border-sky-100 bg-white/90 px-5 py-4 shadow-[0_28px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-white/7 dark:shadow-[0_28px_80px_rgba(0,0,0,0.28)] sm:px-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-4">
                  <div className="min-w-0">
                    <div className="mb-3 flex items-center gap-3">
                      <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-cyan-400 to-blue-600 shadow-[0_16px_32px_rgba(37,99,235,0.35)]">
                        <Flame className="size-5 text-white" />
                      </span>
                      <span className="rounded-full border border-cyan-300/18 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.26em] text-cyan-700/90 dark:text-cyan-100/90">
                        IELTS Marathon
                      </span>
                    </div>
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-[2rem]">{title}</h1>
                    <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-[15px]">{subtitle}</p>
                  </div>
                </div>
              </div>
            </header>
          ) : null}
          {children}
        </div>
      </div>
    </div>
  );
}
