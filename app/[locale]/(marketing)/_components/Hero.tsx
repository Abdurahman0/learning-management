import Link from "next/link";
import {ArrowRight, Lock} from "lucide-react";
import {useLocale, useTranslations} from "next-intl";

import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card} from "@/components/ui/card";

import {Container} from "./Container";

export function Hero() {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <section className="bg-background py-14 dark:bg-linear-to-b dark:from-background dark:to-muted/20 sm:py-16 lg:py-20">
      <Container>
        <div className="grid items-center gap-10 lg:grid-cols-[1.2fr_1fr] lg:gap-12">
          <div data-reveal-item>
            <Badge className="mb-5 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold tracking-wide text-blue-700 uppercase hover:bg-blue-100">
              {t("hero.badge")}
            </Badge>

            <h1 className="max-w-2xl text-4xl leading-[1.05] font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-[62px]">
              {t("hero.title")}
            </h1>

            <div className="mt-4 inline-flex max-w-2xl flex-wrap items-center gap-2 text-lg font-semibold tracking-tight text-blue-600 sm:gap-3 sm:text-xl lg:text-2xl">
              <span>{t("hero.flow.practice")}</span>
              <span className="text-[0.72em] text-blue-500" aria-hidden="true">-&gt;</span>
              <span>{t("hero.flow.analyze")}</span>
              <span className="text-[0.72em] text-blue-500" aria-hidden="true">-&gt;</span>
              <span>{t("hero.flow.improve")}</span>
              <span className="text-[0.72em] text-blue-500" aria-hidden="true">-&gt;</span>
              <span>{t("hero.flow.repeat")}</span>
            </div>

            <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">{t("hero.description")}</p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="landing-reading-cta rounded-lg px-6">
                <Link href={`/${locale}/reading`}>
                  {t("hero.startReading")}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                disabled
                className="cursor-not-allowed rounded-lg border-border bg-card px-6 text-muted-foreground"
              >
                <Lock className="size-4" aria-hidden="true" />
                {t("hero.startListening")}
              </Button>
            </div>

          </div>

          <Card data-reveal-item className="overflow-hidden border-border bg-linear-to-br from-emerald-300 via-teal-500 to-cyan-700 p-0 shadow-sm dark:shadow-black/20">
            <div className="relative aspect-video min-h-70 sm:min-h-90">
              <iframe
                className="absolute inset-0 h-full w-full"
                src="https://www.youtube.com/embed/hL3bGECH5MY?rel=0"
                title={t("hero.watchDemo")}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
          </Card>
        </div>
      </Container>
    </section>
  );
}
