"use client";

import {Download, Gauge, TriangleAlert, Zap} from "lucide-react";
import {useTranslations} from "next-intl";

import {Button} from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card";
import type {PlatformInsights} from "@/data/admin-dashboard";

type AdminInsightsProps = {
  insights: PlatformInsights;
};

export function AdminInsights({insights}: AdminInsightsProps) {
  const t = useTranslations("adminDashboard");

  return (
    <section className="space-y-4">
      <h2 className="px-1 text-xl font-semibold tracking-tight">{t("insights.title")}</h2>

      <Card className="rounded-2xl border-border/70 bg-card/75 py-0">
        <CardContent className="flex items-start gap-3.5 px-5 py-[1.125rem]">
          <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl border border-amber-500/18 bg-amber-500/14 text-amber-300">
            <TriangleAlert className="size-4.5" />
          </span>
          <div className="min-w-0 space-y-1">
            <p className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">{t("insights.mostDifficult.label")}</p>
            <p className="text-xl font-semibold leading-tight">{insights.mostDifficult.topic}</p>
            <p className="text-sm text-muted-foreground">{t("insights.mostDifficult.score", {score: insights.mostDifficult.averageScore})}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border/70 bg-card/75 py-0">
        <CardContent className="flex items-start gap-3.5 px-5 py-[1.125rem]">
          <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl border border-sky-500/18 bg-sky-500/14 text-sky-300">
            <Gauge className="size-4.5" />
          </span>
          <div className="min-w-0 space-y-1">
            <p className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">{t("insights.averageScore.label")}</p>
            <p className="text-xl font-semibold leading-tight">
              {insights.averageScore.band.toFixed(1)} {t("insights.averageScore.bandSuffix")}
            </p>
            <p className="text-sm text-muted-foreground">{t("insights.averageScore.basedOn", {count: insights.averageScore.sampleSize.toLocaleString()})}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-primary/30 bg-gradient-to-br from-primary/35 via-primary/16 to-card py-0 shadow-[0_10px_34px_-24px_hsl(var(--primary)_/_0.9)]">
        <CardContent className="px-5 py-[1.375rem]">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-medium tracking-[0.2em] text-primary-foreground/90 uppercase">{t("insights.quickAction.kicker")}</p>
            <Zap className="size-4 text-primary-foreground/95" />
          </div>
          <h3 className="mt-3.5 text-[1.65rem] leading-tight font-semibold tracking-tight">{t("insights.quickAction.title")}</h3>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t("insights.quickAction.description")}</p>

          <Button className="mt-[1.375rem] h-[2.625rem] w-full rounded-xl bg-primary/92 text-primary-foreground shadow-sm hover:bg-primary">
            <Download className="size-4" />
            {t("insights.quickAction.download")}
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}
