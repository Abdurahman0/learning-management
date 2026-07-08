import {CheckCircle2, Crown, ExternalLink, Star} from "lucide-react";
import {useTranslations} from "next-intl";

import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card";

import {Container} from "./Container";

const TELEGRAM_URL = "https://t.me/+U1YftX0MkDgzOGNi";

const SILVER_FEATURES = [
  "Barcha REAL exam reading testlar",
  "Barcha REAL exam listening testlar (tez orada)",
  "Ustuvor qo'llab-quvvatlash",
  "Cheksiz AI tahlil",
];

const GOLD_EXTRA_FEATURES = [
  "Barcha marathonlarga kirish",
  "Online Reading kursi sovg'aga",
];

export function Comparison() {
  const t = useTranslations("comparison");

  return (
    <section className="bg-muted/30 py-16 sm:py-20" id="pricing">
      <Container>
        <div data-reveal-item className="mx-auto max-w-3xl text-center">
          <h2 className="text-4xl font-bold text-foreground">{t("title")}</h2>
          <p className="mt-3 text-muted-foreground">{t("subtitle")}</p>
        </div>

        <div className="mx-auto mt-10 grid w-full max-w-4xl gap-6 sm:grid-cols-2">
          {/* Silver */}
          <Card data-reveal-item className="hover:scale-103 transition duration-300 border-border bg-card py-0 shadow-sm">
            <CardContent className="flex h-full flex-col px-7 py-8">
              <div className="flex items-center gap-2">
                <Star className="size-5 text-slate-400" aria-hidden="true" />
                <p className="text-base font-bold tracking-wide text-slate-500 dark:text-slate-400">{t("silverName")}</p>
              </div>

              <div className="mt-4">
                <span className="text-4xl font-extrabold tracking-tight">60 000</span>
                <span className="ml-1.5 text-base font-semibold text-muted-foreground">so&apos;m</span>
                <p className="mt-1 text-sm text-muted-foreground">har {t("perMonth")} uchun</p>
              </div>

              <ul className="mt-6 flex-1 space-y-3">
                {SILVER_FEATURES.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-foreground/80">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" aria-hidden="true" />
                    {feature}
                  </li>
                ))}
              </ul>

              <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer" className="mt-8 block">
                <Button variant="outline" size="lg" className="w-full rounded-xl">
                  <ExternalLink className="size-4" />
                  {t("telegramCta")}
                </Button>
              </a>
            </CardContent>
          </Card>

          {/* Gold */}
          <Card data-reveal-item className="relative hover:scale-103 transition duration-300 border-amber-500/40 bg-card py-0 shadow-md">
            <Badge className="absolute top-3 right-3 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-amber-600 uppercase dark:text-amber-400">
              {t("recommended")}
            </Badge>

            <CardContent className="flex h-full flex-col px-7 py-8">
              <div className="flex items-center gap-2">
                <Crown className="size-5 text-amber-500" aria-hidden="true" />
                <p className="text-base font-bold tracking-wide text-amber-600 dark:text-amber-400">{t("goldName")}</p>
              </div>

              <div className="mt-4">
                <span className="text-4xl font-extrabold tracking-tight">99 000</span>
                <span className="ml-1.5 text-base font-semibold text-muted-foreground">so&apos;m</span>
                <p className="mt-1 text-sm text-muted-foreground">har {t("perMonth")} uchun</p>
              </div>

              <ul className="mt-6 flex-1 space-y-3">
                {SILVER_FEATURES.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-foreground/80">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" aria-hidden="true" />
                    {feature}
                  </li>
                ))}
                {GOLD_EXTRA_FEATURES.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm font-medium text-foreground">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-amber-500" aria-hidden="true" />
                    {feature}
                  </li>
                ))}
              </ul>

              <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer" className="mt-8 block">
                <Button size="lg" className="w-full rounded-xl bg-amber-500 font-bold text-white hover:bg-amber-500/90 dark:bg-amber-500 dark:hover:bg-amber-500/90">
                  <ExternalLink className="size-4" />
                  {t("telegramCta")}
                </Button>
              </a>
            </CardContent>
          </Card>
        </div>
      </Container>
    </section>
  );
}
