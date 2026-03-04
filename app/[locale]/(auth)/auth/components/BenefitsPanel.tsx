"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Card } from "@/components/ui/card";

import type { AuthMode } from "./AuthShell";

type BenefitsPanelProps = {
  mode: AuthMode;
};

export function BenefitsPanel({ mode }: BenefitsPanelProps) {
  const t = useTranslations("auth");
  const locale = useLocale();

  if (mode === "signin") {
    return (
      <div className="min-w-0 space-y-6">
        <div className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">{t("signinMarketing.title")}</h1>
          <p className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">{t("signinMarketing.description")}</p>
        </div>

        <Card className="gap-3 rounded-2xl border-blue-200/60 bg-blue-50/60 p-6 dark:border-blue-500/30 dark:bg-blue-500/10">
          <p className="text-xs font-bold tracking-[0.14em] text-blue-700 uppercase dark:text-blue-300">{t("signinMarketing.proTip")}</p>
          <p className="text-base leading-relaxed text-foreground/90">
            {t("signinMarketing.proTipText")}{" "}
            <Link href={`/${locale}/reading`} className="font-semibold text-blue-700 underline-offset-4 hover:underline dark:text-blue-300">
              {t("signinMarketing.guestLink")}
            </Link>
          </p>
        </Card>

        <div className="flex items-center gap-3 text-muted-foreground">
          <div className="flex -space-x-2">
            {["A", "S", "M"].map((letter, index) => (
              <span
                key={letter}
                className="flex size-9 items-center justify-center rounded-full border-2 border-background bg-gradient-to-br from-amber-100 to-orange-200 text-xs font-semibold text-amber-800"
                style={{ zIndex: 10 - index }}
              >
                {letter}
              </span>
            ))}
          </div>
          <p className="text-lg font-medium">{t("signinMarketing.socialProof")}</p>
        </div>
      </div>
    );
  }

  const bullets = [
    { title: t("signupMarketing.bullets.unlimited.title"), desc: t("signupMarketing.bullets.unlimited.desc") },
    { title: t("signupMarketing.bullets.history.title"), desc: t("signupMarketing.bullets.history.desc") },
    { title: t("signupMarketing.bullets.analysis.title"), desc: t("signupMarketing.bullets.analysis.desc") },
    { title: t("signupMarketing.bullets.ai.title"), desc: t("signupMarketing.bullets.ai.desc") },
  ];

  return (
    <div className="min-w-0 space-y-7">
      <div className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">{t("signupMarketing.title")}</h1>
        <p className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">{t("signupMarketing.description")}</p>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
        {bullets.map((bullet) => (
          <div key={bullet.title} className="flex min-w-0 items-start gap-3 rounded-xl p-1">
            <span className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
              <Check className="size-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-lg font-semibold leading-tight text-foreground sm:text-xl">{bullet.title}</p>
              <p className="mt-1 break-words text-sm text-muted-foreground sm:text-base">{bullet.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 border-t border-border pt-6 text-muted-foreground">
        <div className="flex -space-x-2">
          {["A", "S", "M"].map((letter, index) => (
            <span
              key={`trust-${letter}-${index}`}
              className="flex size-9 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-semibold"
              style={{ zIndex: 10 - index }}
            >
              {letter}
            </span>
          ))}
        </div>
        <p className="text-base font-medium sm:text-lg">{t("signupMarketing.trustLine")}</p>
      </div>
    </div>
  );
}
