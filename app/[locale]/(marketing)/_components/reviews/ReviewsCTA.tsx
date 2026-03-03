import {Button} from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card";
import {useTranslations} from "next-intl";

import {Container} from "../Container";

export function ReviewsCTA() {
  const t = useTranslations("reviews");

  return (
    <section className="bg-background py-10 sm:py-12">
      <Container>
        <Card className="overflow-hidden border-border py-0 shadow-lg">
          <CardContent className="rounded-2xl bg-linear-to-br from-blue-600 via-indigo-600 to-blue-700 px-6 py-14 text-center text-white dark:from-blue-700 dark:via-indigo-700 dark:to-blue-800 sm:px-10">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("cta.title")}</h2>
            <p className="mx-auto mt-4 max-w-2xl text-blue-100 sm:text-lg">
              {t("cta.subtitle")}
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button
                size="lg"
                className="rounded-lg border border-blue-100/30 bg-white px-8 text-blue-700 hover:bg-blue-50"
              >
                {t("actions.getStarted")}
              </Button>
              <Button
                size="lg"
                variant="secondary"
                className="rounded-lg border border-blue-100/40 bg-transparent px-8 text-white hover:bg-white/10"
              >
                {t("actions.tryMock")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </Container>
    </section>
  );
}
