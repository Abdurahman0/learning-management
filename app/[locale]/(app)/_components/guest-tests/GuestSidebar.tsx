"use client";

import {useState} from "react";
import Link from "next/link";
import {usePathname, useRouter} from "next/navigation";
import {BarChart3, BookCheck, BookOpen, CalendarClock, ChevronDown, ClipboardList, Headphones, Home, Lock, Mic, PenLine, Sparkles} from "lucide-react";
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

type NavItem = {
  key: string;
  label: string;
  href: string;
  icon: typeof Home;
};

type TestNavItem = {
  key: string;
  label: string;
  icon: typeof Home;
  disabled: boolean;
  href?: string;
};

export function GuestSidebar({usedTests, totalTests, role}: GuestSidebarProps) {
  const t = useTranslations("guest");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const isGuest = role === "guest";
  const isStudent = role === "user";
  const profile = role === "guest" ? null : getStaticProfile(role);

  const dashboardHref = role === "admin" ? `/${locale}/admin` : role === "teacher" ? `/${locale}/teacher` : `/${locale}/dashboard`;
  const aiCoachHref = `/${locale}/ai-coach`;
  const assignmentsHref = `/${locale}/assignments`;
  const reviewCenterHref = `/${locale}/review-center`;
  const sessionsHref = `/${locale}/sessions`;
  const analyticsHref = `/${locale}/analytics`;
  const readingHref = `/${locale}/reading`;
  const listeningHref = `/${locale}/listening`;

  const primaryNavItems: NavItem[] = !isGuest
    ? [
        {
          key: "dashboard",
          label: t("sidebar.dashboard"),
          href: dashboardHref,
          icon: Home
        }
      ]
    : [];

  const secondaryNavItems: NavItem[] = isStudent
    ? [
        {
          key: "assignments",
          label: t("sidebar.assignments"),
          href: assignmentsHref,
          icon: ClipboardList
        },
        {
          key: "sessions",
          label: t("sidebar.sessions"),
          href: sessionsHref,
          icon: CalendarClock
        },
        // Temporarily disabled while the product shifts from chat to 1-to-1 sessions.
        // {
        //   key: "messages",
        //   label: t("sidebar.messages"),
        //   href: messagesHref,
        //   icon: MessageSquare
        // },
        {
          key: "aiCoach",
          label: t("sidebar.aiCoach"),
          href: aiCoachHref,
          icon: Sparkles
        },
        {
          key: "analytics",
          label: t("sidebar.analytics"),
          href: analyticsHref,
          icon: BarChart3
        },
        {
          key: "reviewCenter",
          label: t("sidebar.reviewCenter"),
          href: reviewCenterHref,
          icon: BookCheck
        }
      ]
    : [];

  const testNavItems: TestNavItem[] = [
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
  ];

  const testsActive = pathname.startsWith(readingHref) || pathname.startsWith(listeningHref);
  const [testsOpen, setTestsOpen] = useState(testsActive);
  const [testsHovered, setTestsHovered] = useState(false);
  const testsExpanded = testsActive || testsOpen || testsHovered;

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
        {primaryNavItems.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);

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

        <div className="space-y-1" onMouseEnter={() => setTestsHovered(true)} onMouseLeave={() => setTestsHovered(false)}>
          <button
            type="button"
            className={cn(
              "flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-base font-medium transition-colors",
              testsActive
                ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300"
                : "text-foreground hover:bg-muted"
            )}
            onClick={() => setTestsOpen((current) => !current)}
            aria-expanded={testsExpanded}
          >
            <span className="flex items-center gap-2.5">
              <BookOpen className="size-4" aria-hidden="true" />
              {t("sidebar.tests")}
            </span>
            <ChevronDown className={cn("size-4 transition-transform", testsExpanded ? "rotate-180" : "rotate-0")} aria-hidden="true" />
          </button>

          <div className={cn("grid transition-all duration-200", testsExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
            <div className="min-h-0 overflow-hidden pl-4">
              <div className="space-y-1 border-l border-border/70 py-1 pl-3">
                {testNavItems.map((item) => {
                  const Icon = item.icon;
                  const active = !item.disabled && Boolean(item.href && pathname.startsWith(item.href));

                  if (item.disabled) {
                    return (
                      <div key={item.key} className="flex items-center justify-between rounded-lg px-2.5 py-2 text-muted-foreground/60">
                        <span className="flex items-center gap-2 text-sm font-medium">
                          <Icon className="size-3.5" aria-hidden="true" />
                          {item.label}
                        </span>
                        <Lock className="size-3.5" aria-hidden="true" />
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={item.key}
                      href={item.href!}
                      className={cn(
                        "flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300"
                          : "text-foreground/90 hover:bg-muted"
                      )}
                    >
                      <Icon className="size-3.5" aria-hidden="true" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {secondaryNavItems.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);

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
