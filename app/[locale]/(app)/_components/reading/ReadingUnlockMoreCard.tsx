"use client";

import Link from "next/link";
import {useLocale, useTranslations} from "next-intl";

import {Button} from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card";

export function ReadingUnlockMoreCard() {
  const locale = useLocale();
  const t = useTranslations("guest");

  return (
    <Card className="border-dashed border-border bg-card/90 py-0 shadow-sm">
      <CardContent className="px-4 py-6 text-center sm:px-6">
        <h3 className="text-xl font-semibold text-foreground">{t("reading.upgradeTitle")}</h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{t("reading.upgradeDesc")}</p>

        <div className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
          <Button asChild className="h-10 rounded-xl bg-blue-600 px-5 text-sm font-semibold hover:bg-blue-600/90">
            <Link href={`/${locale}/auth`}>{t("sidebar.createAccount")}</Link>
          </Button>
          <Button asChild variant="outline" className="h-10 rounded-xl border-border bg-background px-5 text-sm font-semibold">
            <Link href={`/${locale}#pricing`}>{t("reading.seePlans")}</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
