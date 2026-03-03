"use client";

import Link from "next/link";
import {BookOpen, CircleUserRound} from "lucide-react";
import {useLocale, useTranslations} from "next-intl";

import {ThemeToggle} from "@/components/theme-toggle";
import {Button} from "@/components/ui/button";

export function ReadingMobileHeader() {
  const locale = useLocale();
  const t = useTranslations("guest");

  return (
    <header className="sticky top-0 z-20 border-b border-border/80 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75 lg:hidden">
      <div className="mx-auto flex h-14 w-full max-w-[1240px] items-center justify-between px-4">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex size-8 items-center justify-center rounded-lg bg-blue-600/15 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300">
            <BookOpen className="size-4" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-bold tracking-tight text-foreground">{t("brand")}</p>
            <p className="text-[11px] text-muted-foreground">{t("reading.title")}</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Button asChild variant="ghost" size="icon" className="rounded-xl text-muted-foreground hover:text-foreground">
            <Link href={`/${locale}/register`} aria-label={t("mobile.signIn")}>
              <CircleUserRound className="size-[18px]" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
