"use client";

import Link from "next/link";
import {usePathname} from "next/navigation";
import {BookOpen, Headphones, Lock, Mic, PenLine} from "lucide-react";
import {useLocale, useTranslations} from "next-intl";

import {Button} from "@/components/ui/button";
import {ThemeToggle} from "@/components/theme-toggle";
import {cn} from "@/lib/utils";

type GuestSidebarProps = {
  usedTests: number;
  totalTests: number;
};

export function GuestSidebar({usedTests, totalTests}: GuestSidebarProps) {
  const t = useTranslations("guest");
  const locale = useLocale();
  const pathname = usePathname();

  const readingHref = `/${locale}/reading`;
  const listeningHref = `/${locale}/listening`;

  const navItems = [
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

  return (
    <aside className="sticky top-0 hidden h-screen w-76 shrink-0 flex-col border-r border-border bg-card/70 px-5 py-6 lg:flex">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-3xl font-extrabold tracking-tight text-blue-600">{t("brand")}</p>
          <p className="mt-1 text-[11px] tracking-[0.2em] text-muted-foreground uppercase">{t("sidebar.guestMode")}</p>
        </div>
        <ThemeToggle />
      </div>

      <nav className="mt-7 space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = !item.disabled && pathname === item.href;

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

      <Button asChild className="mt-auto h-12 rounded-xl bg-blue-600 text-base font-semibold hover:bg-blue-600/90">
        <Link href={`/${locale}/register`}>{t("sidebar.createAccount")}</Link>
      </Button>
    </aside>
  );
}

