"use client";

import {Star} from "lucide-react";
import {useLocale, useTranslations} from "next-intl";
import Link from "next/link";

import {Button} from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card";

export function GuestUpgradeCard() {
  const t = useTranslations("guest");
  const locale = useLocale();

  return (
    <Card className="mt-8 border-dashed border-border bg-card py-0 shadow-sm">
      <CardContent className="px-8 py-8 text-center">
        <div className="mx-auto inline-flex size-11 items-center justify-center rounded-full bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
          <Star className="size-5 fill-current" aria-hidden="true" />
        </div>

        <h3 className="mt-4 text-4xl font-bold tracking-tight text-foreground lg:text-5xl">{t("upgrade.title")}</h3>
        <p className="mx-auto mt-3 max-w-2xl text-lg leading-relaxed text-muted-foreground lg:text-xl">{t("upgrade.desc")}</p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button asChild className="h-11 rounded-xl bg-blue-600 px-7 text-base font-semibold hover:bg-blue-600/90">
            <Link href={`/${locale}/auth`}>{t("upgrade.upgradeNow")}</Link>
          </Button>
          <Button asChild variant="outline" className="h-11 rounded-xl border-border bg-background px-7 text-base font-semibold">
            <Link href={`/${locale}/reviews#pricing`}>{t("upgrade.comparePlans")}</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
