import {BookOpenText, HeartHandshake, Lock, Sparkles, Target} from "lucide-react";
import {useTranslations} from "next-intl";

import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card";

import {Container} from "./Container";

type Feature = {
  key: "authentic" | "instructor" | "results" | "expert";
  icon: typeof BookOpenText;
  comingSoon: boolean;
};

const features: Feature[] = [
  {
    key: "authentic",
    icon: BookOpenText,
    comingSoon: false
  },
  {
    key: "instructor",
    icon: Target,
    comingSoon: false
  },
  {
    key: "results",
    icon: Sparkles,
    comingSoon: false
  },
  {
    key: "expert",
    icon: HeartHandshake,
    comingSoon: true
  }
];

export function FeaturesSection() {
  const t = useTranslations();

  return (
    <section id="features" className="scroll-mt-24 bg-muted/30 py-16 sm:py-20">
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <Badge
            variant="secondary"
            className="mb-4 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700"
          >
            {t("features.badge")}
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{t("features.title")}</h2>
          <p className="mt-3 text-muted-foreground sm:text-lg">{t("features.subtitle")}</p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {features.map((feature) => {
            const isComingSoon = feature.comingSoon;

            return (
              <Card
                key={feature.key}
                className={`border-border py-0 shadow-sm transition duration-300 ${
                  isComingSoon
                    ? "relative overflow-hidden rounded-2xl bg-linear-to-b from-card to-muted/40 ring-1 ring-border/50 dark:to-muted/20 cursor-default hover:scale-100"
                    : "bg-card hover:scale-103"
                }`}
              >
                {isComingSoon && (
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-6 top-0 h-px bg-linear-to-r from-transparent via-foreground/20 to-transparent"
                  />
                )}
                <CardContent className="p-6 sm:p-7">
                  <div
                    className={`mb-4 inline-flex size-10 items-center justify-center rounded-xl ${
                      isComingSoon ? "bg-muted text-muted-foreground" : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    <feature.icon className="size-5" aria-hidden="true" />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-xl font-semibold text-foreground">{t(`features.items.${feature.key}.title`)}</h3>
                    {isComingSoon && (
                      <Badge
                        variant="outline"
                        className="rounded-full border-border bg-linear-to-r from-muted to-background px-2 py-0.5 text-xs text-muted-foreground"
                      >
                        <Lock className="mr-1 size-3" aria-hidden="true" />
                        {t("features.comingSoon")}
                      </Badge>
                    )}
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
                    {t(`features.items.${feature.key}.description`)}
                  </p>
                  {isComingSoon && (
                    <>
                      <p className="mt-2 text-sm text-muted-foreground">{t("features.helper")}</p>
                      <div className="mt-4 flex items-center gap-3">
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          disabled
                          aria-disabled="true"
                          className="cursor-not-allowed border border-border bg-muted text-muted-foreground"
                        >
                          {t("features.joinWaitlist")}
                        </Button>
                        <span className="text-xs text-muted-foreground">{t("features.availableSoon")}</span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="mt-6 border-dashed border-border bg-muted/30 py-0 shadow-sm">
          <CardContent className="flex flex-col items-start gap-2 p-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground sm:text-base">{t("features.bottomNote")}</p>
            <Badge variant="outline" className="rounded-full border-border bg-muted text-muted-foreground">
              {t("features.comingSoon")}
            </Badge>
          </CardContent>
        </Card>
      </Container>
    </section>
  );
}

