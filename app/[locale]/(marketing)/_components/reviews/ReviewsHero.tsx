import {MessageSquareQuote, Users} from "lucide-react";
import {useTranslations} from "next-intl";

import {Badge} from "@/components/ui/badge";
import {Card, CardContent} from "@/components/ui/card";

import {Container} from "../Container";

export function ReviewsHero() {
  const t = useTranslations("reviews");

  return (
    <section className="bg-background pt-14 pb-10 sm:pt-16 sm:pb-12">
      <Container>
        <header className="mx-auto max-w-4xl text-center">
           <Badge
            variant="secondary"
            className="mb-4 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700"
          >
            {t("page.badge")}
          </Badge>

          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            {t("page.title")}
          </h1>

          <p className="mx-auto mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {t("page.subtitle")}
          </p>
        </header>

        <div className="mx-auto mt-8 grid max-w-3xl gap-4 sm:mt-10 sm:grid-cols-2">
          <Card className="overflow-hidden border-blue-500/20 bg-gradient-to-br from-blue-500/12 via-card to-cyan-500/10 py-0 shadow-sm">
            <CardContent className="relative p-6 text-center sm:p-7">
              <div className="absolute top-4 right-4 h-16 w-16 rounded-full bg-blue-500/10 blur-2xl" aria-hidden="true" />
              <div className="mb-4 inline-flex size-10 items-center justify-center rounded-2xl border border-blue-500/20 bg-background/80 text-blue-600 shadow-sm dark:text-blue-300">
                <MessageSquareQuote className="size-4.5" aria-hidden="true" />
              </div>
              <p className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{t("stats.studentFeedbackValue")}</p>
              <p className="mx-auto mt-2 max-w-52 text-sm leading-relaxed text-muted-foreground">{t("stats.avgRating")}</p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card py-0 shadow-sm">
            <CardContent className="p-6 text-center sm:p-7">
              <div className="mb-4 inline-flex size-9 items-center justify-center rounded-full bg-muted text-blue-600">
                <Users className="size-4.5" aria-hidden="true" />
              </div>
              <p className="text-4xl font-bold tracking-tight text-foreground">10,000+</p>
              <p className="mt-2 text-sm text-muted-foreground">{t("stats.activeLearners")}</p>
            </CardContent>
          </Card>
        </div>
      </Container>
    </section>
  );
}
