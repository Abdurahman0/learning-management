"use client";

import {Info} from "lucide-react";
import Link from "next/link";
import {useLocale, useTranslations} from "next-intl";

import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card";

import {useGuestDemoStats} from "../guest-tests/useGuestDemoStats";

export function GuestCallout() {
  const t = useTranslations("guest");
  const locale = useLocale();
  const stats = useGuestDemoStats(true);
  const demoCount = stats?.totalPublicCount ?? 4;
  const readingCount = stats?.readingPublicCount ?? 2;
  const listeningCount = stats?.listeningPublicCount ?? 2;
  const totalAll = stats?.totalAllCount ?? null;

  return (
    <Card className="overflow-hidden border-blue-300/60 bg-gradient-to-r from-card to-blue-50/30 py-0 shadow-sm dark:from-card dark:to-blue-500/10 dark:border-blue-500/40">
      <CardContent className="px-4 py-3.5 sm:px-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
              <Info className="size-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-base font-semibold text-foreground">{t("banner.title")}</p>
              <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                {t("banner.desc", {count: demoCount, reading: readingCount, listening: listeningCount})}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge variant="secondary" className="h-auto px-2.5 py-1 text-[11px] whitespace-normal">
                  {t("banner.badges.demo", {count: demoCount})}
                </Badge>
                <Badge variant="secondary" className="h-auto px-2.5 py-1 text-[11px] whitespace-normal">
                  {t("banner.badges.scoreOnly")}
                </Badge>
                <Badge variant="secondary" className="h-auto px-2.5 py-1 text-[11px] whitespace-normal">
                  {t("banner.badges.analysisAfterSignup")}
                </Badge>
              </div>
            </div>
          </div>

          <div className="hidden text-right sm:block">
            <p className="text-[11px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">{t("banner.used")}</p>
            <p className="text-xl font-bold text-blue-600">
              {typeof totalAll === "number" ? `${demoCount}/${totalAll}` : `${demoCount}`}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {typeof totalAll === "number" ? t("banner.available", {count: totalAll}) : t("banner.available")}
            </p>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="text-right sm:hidden">
            <p className="text-[11px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">{t("banner.used")}</p>
            <p className="text-xl font-bold text-blue-600 leading-none">
              {typeof totalAll === "number" ? `${demoCount}/${totalAll}` : `${demoCount}`}
            </p>
          </div>
          <Button asChild className="h-9 rounded-lg bg-blue-600 px-4 text-sm font-semibold hover:bg-blue-600/90">
            <Link href={`/${locale}/auth`}>{t("banner.signup")}</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
