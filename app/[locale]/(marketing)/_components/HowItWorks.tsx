import {CheckSquare, ClipboardList, SearchCheck, Trophy} from "lucide-react";
import {useTranslations} from "next-intl";

import {Card, CardContent} from "@/components/ui/card";

import {Container} from "./Container";

const icons = [SearchCheck, ClipboardList, CheckSquare, Trophy] as const;
const stepKeys = ["choose", "complete", "score", "improve"] as const;

export function HowItWorks() {
  const t = useTranslations();

  return (
    <section className="bg-muted/30 py-16 sm:py-20">
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-foreground">{t("how.title")}</h2>
          <div className="mx-auto mt-3 h-1 w-14 rounded-full bg-blue-600" />
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-4">
          {stepKeys.map((stepKey, index) => {
            const Icon = icons[index];

            return (
              <Card
                key={stepKey}
                className="hover:scale-103 transition duration-300 border-border bg-card py-0 shadow-sm"
              >
                <CardContent className="px-6 py-8 text-center">
                  <div className="mx-auto flex size-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                    <Icon className="size-5" aria-hidden="true" />
                  </div>
                  <h3 className="mt-5 text-xl font-semibold text-foreground">
                    {index + 1}. {t(`how.steps.${stepKey}.title`)}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {t(`how.steps.${stepKey}.description`)}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

