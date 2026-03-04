"use client";

import {Info} from "lucide-react";
import Link from "next/link";
import {useLocale, useTranslations} from "next-intl";

import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card";

export function GuestTopBanner() {
  const t = useTranslations("guest");
  const locale = useLocale();

  return (
    <Card className="overflow-hidden border-blue-300/60 bg-gradient-to-r from-card to-blue-50/30 py-0 shadow-sm dark:from-card dark:to-blue-500/10 dark:border-blue-500/40">
      <CardContent className="flex flex-wrap items-center justify-between gap-4 px-5 py-3.5 lg:flex-nowrap">
        <div className="flex items-start gap-3.5">
          <div className="inline-flex size-11 items-center justify-center rounded-full bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
            <Info className="size-4" aria-hidden="true" />
          </div>
          <div>
            <p className="text-base font-semibold text-foreground">{t("banner.title")}</p>
            <p className="mt-0.5 max-w-[720px] text-sm leading-relaxed text-muted-foreground">{t("banner.desc")}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Badge variant="secondary" className="h-6 px-2.5 text-[11px]">
                {t("banner.badges.demo")}
              </Badge>
              <Badge variant="secondary" className="h-6 px-2.5 text-[11px]">
                {t("banner.badges.scoreOnly")}
              </Badge>
              <Badge variant="secondary" className="h-6 px-2.5 text-[11px]">
                {t("banner.badges.analysisAfterSignup")}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex w-full items-center justify-end gap-4 lg:w-auto">
          <div className="text-right leading-tight">
            <p className="text-[11px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">{t("banner.used")}</p>
            <p className="text-xl font-bold text-blue-600">4</p>
            <p className="text-[11px] text-muted-foreground">{t("banner.available")}</p>
          </div>
          <Button asChild className="h-10 rounded-xl bg-blue-600 px-5 text-sm font-semibold hover:bg-blue-600/90">
            <Link href={`/${locale}/auth`}>{t("banner.signup")}</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

