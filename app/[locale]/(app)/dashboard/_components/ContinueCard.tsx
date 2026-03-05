"use client";

import Link from "next/link";
import {BookOpenText} from "lucide-react";
import {useLocale, useTranslations} from "next-intl";

import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card";
import {Progress} from "@/components/ui/progress";
import type {ContinueTest} from "@/data/dashboard-demo";

type ContinueCardProps = {
  test: ContinueTest;
};

export function ContinueCard({test}: ContinueCardProps) {
  const t = useTranslations("dashboard");
  const locale = useLocale();
  const progressPct = Math.round((test.progressQuestions / test.totalQuestions) * 100);

  return (
    <Card className="overflow-hidden rounded-2xl border-border/70 bg-card/70">
      <CardContent className="grid min-w-0 p-0 lg:grid-cols-[260px_minmax(0,1fr)]">
        <div className="relative min-h-[170px] overflow-hidden border-b border-border/60 bg-gradient-to-br from-blue-600/30 via-indigo-600/20 to-cyan-500/20 p-5 lg:border-r lg:border-b-0">
          <div className="flex h-full flex-col justify-between rounded-xl border border-blue-400/20 bg-background/40 p-4">
            <BookOpenText className="size-6 text-blue-300" />
            <Badge className="w-fit rounded-full bg-blue-600 text-[10px]">{t("resumePractice")}</Badge>
          </div>
        </div>

        <div className="min-w-0 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="truncate text-xl font-semibold tracking-tight sm:text-2xl">{test.title}</h2>
            <Badge variant="secondary" className="truncate">
              {test.module}
            </Badge>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{t("lastActive", {time: test.lastActiveLabel})}</p>
          <div className="mt-3 flex items-center justify-between text-sm">
            <p>{t("progressMeta", {done: test.progressQuestions, total: test.totalQuestions})}</p>
            <p className="font-medium text-blue-400">{progressPct}%</p>
          </div>
          <Progress className="mt-2" value={progressPct} />
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild>
              <Link href={`/${locale}/reading/demo`}>{t("continueTest")}</Link>
            </Button>
            <Button variant="outline">{t("reviewDetails")}</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
