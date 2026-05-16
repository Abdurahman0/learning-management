"use client";

import {useEffect, useMemo, useState} from "react";
import Link from "next/link";
import {MessageSquareQuote} from "lucide-react";
import {useLocale, useTranslations} from "next-intl";

import {Avatar, AvatarFallback} from "@/components/ui/avatar";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card";
import {publicFeedbackService, type FeedbackRecord} from "@/src/services/feedback.service";

import {Container} from "./Container";

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "EL";
}

function formatDate(dateIso: string) {
  const date = new Date(dateIso);
  if (Number.isNaN(date.getTime())) return dateIso || "";
  return new Intl.DateTimeFormat("en-US", {month: "short", day: "2-digit", year: "numeric"}).format(date);
}

export function ReviewsSection() {
  const locale = useLocale();
  const t = useTranslations();
  const [feedback, setFeedback] = useState<FeedbackRecord[]>([]);

  useEffect(() => {
    let active = true;

    publicFeedbackService
      .list()
      .then((response) => {
        if (!active) return;
        setFeedback(response.results);
      })
      .catch(() => {
        if (!active) return;
        setFeedback([]);
      });

    return () => {
      active = false;
    };
  }, []);

  const reviews = useMemo(() => feedback.slice(0, 6), [feedback]);
  const shouldUseMarquee = reviews.length >= 4;

  const renderReviewCard = (review: FeedbackRecord, keyPrefix = "static") => {
    const name = review.userFullName.trim() || t("reviews.anonymousStudent");

    return (
      <li key={`${keyPrefix}-${review.id}`}>
        <Card
          tabIndex={0}
          className="w-[320px] border-border bg-card py-0 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:w-87.5"
        >
          <CardContent className="relative p-5">
            <div className="absolute top-5 right-5 inline-flex size-8 items-center justify-center rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-300">
              <MessageSquareQuote className="size-4" aria-hidden="true" />
            </div>

            <div className="mb-4 flex items-center gap-3 pr-10">
              <Avatar className="size-10">
                <AvatarFallback className="bg-blue-100 font-semibold text-blue-700">{getInitials(name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{name}</p>
                <p className="text-xs text-muted-foreground">{formatDate(review.createdAt)}</p>
              </div>
            </div>

            <p className="line-clamp-5 text-sm leading-relaxed text-muted-foreground">{review.feedbackText}</p>
          </CardContent>
        </Card>
      </li>
    );
  };

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

        {reviews.length > 0 ? (
          shouldUseMarquee ? (
            <div className="reviews-marquee mt-10 overflow-hidden">
              <div className="reviews-track flex w-max">
                {[0, 1].map((copyIndex) => (
                  <ul key={copyIndex} className="flex shrink-0 gap-4 pr-4 sm:gap-5 sm:pr-5" aria-hidden={copyIndex === 1}>
                    {reviews.map((review) => renderReviewCard(review, String(copyIndex)))}
                  </ul>
                ))}
              </div>
            </div>
          ) : (
            <ul className="mt-10 flex flex-wrap justify-center gap-4 sm:gap-5">
              {reviews.map((review) => renderReviewCard(review))}
            </ul>
          )
        ) : (
          <div className="mx-auto mt-10 max-w-2xl rounded-2xl border border-dashed border-border/80 bg-card/70 p-6 text-center text-sm text-muted-foreground">
            {t("reviews.empty.noFeedback")}
          </div>
        )}

        <div className="mt-8 flex justify-center sm:mt-10">
          <Button asChild variant="outline" className="rounded-lg border-border bg-background px-6">
            <Link href={`/${locale}/reviews`}>{t("reviews.actions.moreReviews")}</Link>
          </Button>
        </div>
      </Container>
    </section>
  );
}
