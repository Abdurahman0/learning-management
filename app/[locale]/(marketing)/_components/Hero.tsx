import {ArrowRight, Play} from "lucide-react";
import {useTranslations} from "next-intl";

import {Avatar, AvatarFallback} from "@/components/ui/avatar";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card} from "@/components/ui/card";

import {Container} from "./Container";

export function Hero() {
  const t = useTranslations();

  return (
    <section className="bg-background py-14 dark:bg-linear-to-b dark:from-background dark:to-muted/20 sm:py-16 lg:py-20">
      <Container>
        <div className="grid items-center gap-10 lg:grid-cols-[1.2fr_1fr] lg:gap-12">
          <div>
            <Badge className="mb-5 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold tracking-wide text-blue-700 uppercase hover:bg-blue-100">
              {t("hero.badge")}
            </Badge>

            <h1 className="max-w-2xl text-4xl leading-[1.05] font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-[62px]">
              {t("hero.title")} <span className="text-blue-600">{t("hero.titleAccent")}</span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">{t("hero.description")}</p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button size="lg" className="rounded-lg px-6">
                {t("hero.startReading")}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-lg border-border bg-card px-6 text-foreground hover:bg-muted/50"
              >
                {t("hero.startListening")}
              </Button>
            </div>

            <div className="mt-8 flex items-center gap-4">
              <div className="flex -space-x-2">
                <Avatar className="size-8 border-2 border-card">
                  <AvatarFallback className="bg-amber-200 text-[10px] font-semibold text-amber-900">AN</AvatarFallback>
                </Avatar>
                <Avatar className="size-8 border-2 border-card">
                  <AvatarFallback className="bg-emerald-200 text-[10px] font-semibold text-emerald-900">LU</AvatarFallback>
                </Avatar>
                <Avatar className="size-8 border-2 border-card">
                  <AvatarFallback className="bg-sky-200 text-[10px] font-semibold text-sky-900">MO</AvatarFallback>
                </Avatar>
              </div>
              <p className="text-sm text-muted-foreground">{t("hero.socialProof")}</p>
            </div>
          </div>

          <Card className="overflow-hidden border-border bg-linear-to-br from-emerald-300 via-teal-500 to-cyan-700 p-0 shadow-sm dark:shadow-black/20">
            <div className="relative flex min-h-70 items-center justify-center sm:min-h-90">
              <button
                type="button"
                aria-label={t("hero.watchDemoAria")}
                className="inline-flex size-16 cursor-pointer items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-transform hover:scale-103"
              >
                <Play className="size-7 fill-white" aria-hidden="true" />
              </button>

              <span className="absolute top-[58%] text-lg font-semibold text-white drop-shadow-sm">{t("hero.watchDemo")}</span>

              <div className="absolute inset-x-10 bottom-3 h-14 rounded-md border border-border/40 bg-muted/50 backdrop-blur-sm" />
            </div>
          </Card>
        </div>
      </Container>
    </section>
  );
}

