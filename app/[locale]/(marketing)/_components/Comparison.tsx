import {CheckCircle2, CircleX} from "lucide-react";
import {useTranslations} from "next-intl";

import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card";

import {Container} from "./Container";

const withoutKeys = ["one", "two", "three", "four"] as const;
const withKeys = ["one", "two", "three", "four", "five"] as const;

export function Comparison() {
  const t = useTranslations();

  return (
    <section className="bg-muted/30 py-16 sm:py-20" id="pricing">
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-4xl font-bold text-foreground">{t("comparison.title")}</h2>
          <p className="mt-3 text-muted-foreground">{t("comparison.subtitle")}</p>
        </div>

        <div className="mx-auto mt-10 grid w-full max-w-6xl gap-6 lg:grid-cols-2">
          <Card className="min-h-[420px] hover:scale-103 transition duration-300 border-border bg-card py-0 shadow-sm">
            <CardContent className="h-full px-7 py-8">
              <p className="text-sm font-semibold tracking-[0.16em] text-muted-foreground uppercase">{t("comparison.withoutLabel")}</p>
              <ul className="mt-6 space-y-4" aria-label={t("comparison.withoutLabel")}>
                {withoutKeys.map((key) => (
                  <li key={key} className="flex items-start gap-3 text-muted-foreground">
                    <CircleX className="mt-0.5 size-4 shrink-0 text-red-500" aria-hidden="true" />
                    <span>{t(`comparison.without.${key}`)}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="relative min-h-[420px] hover:scale-103 transition duration-300 border-blue-600 bg-card py-0 shadow-md">
            <Badge className="absolute top-3 right-3 rounded-full bg-blue-600 px-2.5 py-1 text-[10px] tracking-wide uppercase">
              {t("comparison.recommended")}
            </Badge>

            <CardContent className="flex h-full flex-col px-7 py-8">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold tracking-[0.16em] text-blue-700 uppercase">{t("comparison.withLabel")}</p>
                <Badge variant="secondary" className="rounded-full bg-muted text-[10px] text-muted-foreground uppercase">
                  {t("comparison.freeForever")}
                </Badge>
              </div>

              <ul className="mt-6 space-y-4" aria-label={t("comparison.withLabel")}>
                {withKeys.map((key) => (
                  <li key={key} className="flex items-start gap-3 text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" aria-hidden="true" />
                    <span>{t(`comparison.with.${key}`)}</span>
                  </li>
                ))}
              </ul>

              <Button className="mt-auto w-full rounded-lg" size="lg">
                {t("comparison.cta")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </Container>
    </section>
  );
}
