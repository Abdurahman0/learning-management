import {Star} from "lucide-react";
import Link from "next/link";
import {useLocale, useTranslations} from "next-intl";

import {Avatar, AvatarFallback} from "@/components/ui/avatar";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card";

import {Container} from "./Container";

const reviews = [
  {key: "one", initials: "DK", rating: 5},
  {key: "two", initials: "MI", rating: 5},
  {key: "three", initials: "RG", rating: 4},
  {key: "four", initials: "ST", rating: 5},
  {key: "five", initials: "AR", rating: 5},
  {key: "six", initials: "AR", rating: 4}
] as const;

export function ReviewsSection() {
  const locale = useLocale();
  const t = useTranslations();

  return (
    <section id="reviews" className="scroll-mt-24 bg-muted/30 py-16 sm:py-20">
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <Badge className="mb-4 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100">
            {t("reviews.badge")}
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{t("reviews.title")}</h2>
          <p className="mt-3 text-muted-foreground sm:text-lg">{t("reviews.subtitle")}</p>
        </div>

        <div className="reviews-marquee mt-10 overflow-hidden">
          <div className="reviews-track flex w-max">
            {[0, 1].map((copyIndex) => (
              <ul key={copyIndex} className="flex shrink-0 gap-4 pr-4 sm:gap-5 sm:pr-5" aria-hidden={copyIndex === 1}>
                {reviews.map((review) => {
                  const reviewName = t(`reviews.items.${review.key}.name`);
                  const reviewLocation = t(`reviews.items.${review.key}.location`);

                  return (
                    <li key={`${copyIndex}-${review.key}`}>
                      <Card
                        tabIndex={0}
                        className="w-[320px] border-border bg-card py-0 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:w-87.5"
                      >
                        <CardContent className="p-5">
                          <div className="mb-4 flex items-center gap-3">
                            <Avatar className="size-10">
                              <AvatarFallback className="bg-blue-100 font-semibold text-blue-700">{review.initials}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-semibold text-foreground">{reviewName}</p>
                              <p className="text-xs text-muted-foreground">{reviewLocation}</p>
                            </div>
                          </div>

                          <div className="mb-3 flex items-center gap-1" aria-label={t("reviews.ratingLabel", {rating: review.rating})}>
                            {Array.from({length: 5}).map((_, index) => (
                              <Star
                                key={index}
                                className={
                                  index < review.rating ? "size-4 fill-amber-400 text-amber-400" : "size-4 text-border"
                                }
                                aria-hidden="true"
                              />
                            ))}
                          </div>

                          <p className="text-sm leading-relaxed text-muted-foreground">{t(`reviews.items.${review.key}.text`)}</p>
                        </CardContent>
                      </Card>
                    </li>
                  );
                })}
              </ul>
            ))}
          </div>
        </div>

        <div className="mt-8 flex justify-center sm:mt-10">
          <Button asChild variant="outline" className="rounded-lg border-border bg-background px-6">
            <Link href={`/${locale}/reviews`}>{t("reviews.actions.moreReviews")}</Link>
          </Button>
        </div>
      </Container>
    </section>
  );
}
