import {Star, Users} from "lucide-react";
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
          <Card className="border-border bg-card py-0 shadow-sm">
            <CardContent className="p-6 text-center sm:p-7">
              <div className="mb-4 flex items-center justify-center gap-1" aria-hidden="true">
                {Array.from({length: 5}).map((_, index) => (
                  <Star key={index} className="size-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-4xl font-bold tracking-tight text-foreground">4.9/5</p>
              <p className="mt-2 text-sm text-muted-foreground">{t("stats.avgRating")}</p>
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
