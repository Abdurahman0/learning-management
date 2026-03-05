"use client";

import type {ReactNode} from "react";
import Link from "next/link";
import {usePathname, useRouter} from "next/navigation";
import {BookOpen, CircleUserRound, Headphones, Home, Lock, Menu, Mic, PenLine} from "lucide-react";
import {useLocale, useTranslations} from "next-intl";
import ReactCountryFlag from "react-country-flag";

import {ThemeToggle} from "@/components/theme-toggle";
import {Button} from "@/components/ui/button";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger} from "@/components/ui/sheet";
import {cn} from "@/lib/utils";

import {GuestSidebar} from "./GuestSidebar";

type GuestShellProps = {
  children: ReactNode;
};

export function GuestShell({children}: GuestShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("guest");
  const tNav = useTranslations("nav");

  // TODO: Replace with real guest usage counters from backend/session.
  const usedTests = 0;
  const totalTests = 4;
  const baseRoute = `/${locale}`;
  const isMobileHeaderVisible = new RegExp(`^${baseRoute}/(dashboard|reading|listening|settings)/?$`).test(pathname);

  const mobileNavItems = [
    {key: "dashboard", label: t("sidebar.dashboard"), href: `/${locale}/dashboard`, icon: Home, disabled: false},
    {key: "reading", label: t("sidebar.reading"), href: `/${locale}/reading`, icon: BookOpen, disabled: false},
    {key: "listening", label: t("sidebar.listening"), href: `/${locale}/listening`, icon: Headphones, disabled: false},
    {key: "writing", label: t("sidebar.writingSoon"), href: "#", icon: PenLine, disabled: true},
    {key: "speaking", label: t("sidebar.speakingSoon"), href: "#", icon: Mic, disabled: true}
  ] as const;

  const switchLocale = (nextLocale: "uz" | "en") => {
    if (nextLocale === locale) {
      return;
    }

    const withoutLocale = pathname.replace(/^\/(uz|en)(?=\/|$)/, "") || "/";
    const localizedPath = `/${nextLocale}${withoutLocale === "/" ? "" : withoutLocale}`;
    router.replace(localizedPath);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex">
        <GuestSidebar usedTests={usedTests} totalTests={totalTests} />
        <main className="min-h-screen min-w-0 flex-1 px-4 py-4 sm:px-5 lg:px-10 lg:py-8">
          {isMobileHeaderVisible ? (
            <header className="sticky top-0 z-20 -mx-4 mb-4 border-b border-border/80 bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/75 sm:-mx-5 sm:px-5 lg:hidden">
              <div className="mx-auto flex h-14 w-full max-w-[1240px] items-center justify-between">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-600/15 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300">
                    <BookOpen className="size-4" aria-hidden="true" />
                  </span>
                  <p className="truncate text-xs font-bold tracking-tight">{t("brand")}</p>
                </div>
                <div className="flex items-center gap-1">
                  <ThemeToggle />
                  <Button asChild variant="ghost" size="icon" className="rounded-xl">
                    <Link href={`/${locale}/auth`} aria-label={t("mobile.signIn")}>
                      <CircleUserRound className="size-[18px]" />
                    </Link>
                  </Button>

                  <Sheet key={pathname}>
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-xl" aria-label={t("sidebar.guestMode")}>
                        <Menu className="size-[18px]" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-[310px] p-0">
                      <SheetHeader className="border-b border-border pb-4 pr-14">
                        <div className="flex items-center justify-between gap-2">
                          <SheetTitle className="flex min-w-0 items-center gap-1.5 text-sm leading-none">
                            <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-lg bg-blue-600/15 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300">
                              <BookOpen className="size-4" />
                            </span>
                            <span className="whitespace-nowrap text-xs tracking-tight">{t("brand")}</span>
                          </SheetTitle>
                          <div className="flex shrink-0 items-center gap-1.5">
                            <Select value={locale} onValueChange={(value) => switchLocale(value as "uz" | "en")}>
                              <SelectTrigger className="h-9 w-[112px] text-xs">
                                <SelectValue>
                                  <span className="inline-flex items-center gap-1.5">
                                    <ReactCountryFlag
                                      countryCode={locale === "uz" ? "UZ" : "GB"}
                                      svg
                                      style={{width: "1em", height: "1em"}}
                                      aria-hidden="true"
                                    />
                                    {tNav(`language.${locale}`)}
                                  </span>
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="uz">
                                  <span className="inline-flex items-center gap-2">
                                    <ReactCountryFlag countryCode="UZ" svg style={{width: "1em", height: "1em"}} aria-hidden="true" />
                                    {tNav("language.uz")}
                                  </span>
                                </SelectItem>
                                <SelectItem value="en">
                                  <span className="inline-flex items-center gap-2">
                                    <ReactCountryFlag countryCode="GB" svg style={{width: "1em", height: "1em"}} aria-hidden="true" />
                                    {tNav("language.en")}
                                  </span>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </SheetHeader>
                      <div className="space-y-2 px-6 py-4">
                        {mobileNavItems.map((item) => {
                          const Icon = item.icon;
                          const active = !item.disabled && pathname.startsWith(item.href);

                          if (item.disabled) {
                            return (
                              <div
                                key={item.key}
                                className="flex items-center justify-between rounded-xl border border-border/60 px-3 py-2.5 text-muted-foreground/70"
                              >
                                <span className="flex items-center gap-2.5 text-sm">
                                  <Icon className="size-4" />
                                  {item.label}
                                </span>
                                <Lock className="size-4" />
                              </div>
                            );
                          }

                          return (
                            <Link
                              key={item.key}
                              href={item.href}
                              className={cn(
                                "flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors",
                                active
                                  ? "border-blue-500/40 bg-blue-500/15 text-blue-300"
                                  : "border-border/60 text-foreground hover:bg-muted"
                              )}
                            >
                              <Icon className="size-4" />
                              {item.label}
                            </Link>
                          );
                        })}
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
              </div>
            </header>
          ) : null}
          {children}
        </main>
      </div>
    </div>
  );
}
