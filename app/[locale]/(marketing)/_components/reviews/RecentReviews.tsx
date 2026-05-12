/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import {useEffect, useMemo, useState} from "react";
import {MessageSquareQuote} from "lucide-react";
import {useTranslations} from "next-intl";

import {Avatar, AvatarFallback} from "@/components/ui/avatar";
import {Button} from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card";
import {publicFeedbackService, type FeedbackRecord} from "@/src/services/feedback.service";

import {Container} from "../Container";

const PAGE_SIZE = 6;

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

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "2-digit",
    year: "numeric"
  }).format(date);
}

function getFeedbackName(feedback: FeedbackRecord, fallback: string) {
  return feedback.userFullName.trim() || fallback;
}

export function RecentReviews() {
  const t = useTranslations("reviews");
  const [reviews, setReviews] = useState<FeedbackRecord[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let active = true;

    const loadFeedback = async () => {
      setIsLoading(true);
      setLoadError(false);
      try {
        const response = await publicFeedbackService.list();
        if (!active) return;
        setReviews(response.results);
      } catch {
        if (!active) return;
        setReviews([]);
        setLoadError(true);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void loadFeedback();

    return () => {
      active = false;
    };
  }, []);

  const sortedReviews = useMemo(() => {
    return [...reviews].sort((a, b) => {
      const bTime = new Date(b.createdAt).getTime();
      const aTime = new Date(a.createdAt).getTime();
      return (Number.isFinite(bTime) ? bTime : 0) - (Number.isFinite(aTime) ? aTime : 0);
    });
  }, [reviews]);

  const visibleReviews = sortedReviews.slice(0, visibleCount);
  const canLoadMore = visibleCount < sortedReviews.length;

  return (
    <section className="bg-background py-10 sm:py-12">
      <Container>
        <Card className="border-border bg-card py-0 shadow-sm">
          <CardContent className="p-5 sm:p-7 lg:p-8">
            <header className="mb-6 flex flex-col gap-2 lg:mb-8">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">{t("sections.recent")}</h2>
              <p className="text-xs text-muted-foreground">
                {t("helpers.showing", {visible: visibleReviews.length, total: sortedReviews.length})}
              </p>
            </header>

            {isLoading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({length: 6}).map((_, index) => (
                  <div key={index} className="h-44 animate-pulse rounded-2xl border border-border bg-muted/40" />
                ))}
              </div>
            ) : loadError ? (
              <div className="rounded-2xl border border-dashed border-border/80 bg-background/60 p-6 text-sm text-muted-foreground">
                {t("empty.loadFailed")}
              </div>
            ) : visibleReviews.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/80 bg-background/60 p-6 text-sm text-muted-foreground">
                {t("empty.noFeedback")}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {visibleReviews.map((review) => {
                  const name = getFeedbackName(review, t("anonymousStudent"));
                  return (
                    <Card key={review.id} className="border-border bg-background py-0 shadow-none">
                      <CardContent className="flex h-full flex-col p-4 sm:p-5">
                        <div className="mb-4 flex items-center gap-3">
                          <Avatar className="size-10 border border-border">
                            <AvatarFallback className="bg-blue-500/12 text-xs font-semibold text-blue-700 dark:text-blue-200">
                              {getInitials(name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-foreground">{name}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(review.createdAt)}</p>
                          </div>
                        </div>

                        <div className="mb-3 inline-flex size-8 items-center justify-center rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-300">
                          <MessageSquareQuote className="size-4" aria-hidden="true" />
                        </div>
                        <p className="text-sm leading-relaxed text-muted-foreground">&quot;{review.feedbackText}&quot;</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {canLoadMore && (
              <div className="mt-8 flex justify-center">
                <Button
                  variant="outline"
                  className="rounded-lg border-border bg-background px-6"
                  onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                >
                  {t("actions.loadMore")}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </Container>
    </section>
  );
}
