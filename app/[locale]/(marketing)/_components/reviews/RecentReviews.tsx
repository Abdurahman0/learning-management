/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import {useEffect, useMemo, useState} from "react";
import {Star} from "lucide-react";
import {useTranslations} from "next-intl";

import {REVIEWS, type Review} from "@/data/reviews";
import {Avatar, AvatarFallback} from "@/components/ui/avatar";
import {Button} from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

import {Container} from "../Container";

type SortMode = "highest" | "lowest" | "recent";

const PAGE_SIZE = 6;

const SORT_OPTIONS: {value: SortMode}[] = [
  {value: "highest"},
  {value: "lowest"},
  {value: "recent"}
];

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function formatDate(dateIso: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "2-digit",
    year: "numeric"
  }).format(new Date(dateIso));
}

export function RecentReviews() {
  const t = useTranslations("reviews");
  const [sortMode, setSortMode] = useState<SortMode>("highest");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filteredAndSortedReviews = useMemo(() => {
    const withMeta = REVIEWS.map((review, index) => ({
      review,
      index,
      timestamp: new Date(review.createdAt).getTime()
    }));

    withMeta.sort((a, b) => {
      if (sortMode === "recent") {
        if (b.timestamp !== a.timestamp) {
          return b.timestamp - a.timestamp;
        }
        return a.index - b.index;
      }

      const ratingDiff =
        sortMode === "highest" ? b.review.rating - a.review.rating : a.review.rating - b.review.rating;

      if (ratingDiff !== 0) {
        return ratingDiff;
      }

      if (b.timestamp !== a.timestamp) {
        return b.timestamp - a.timestamp;
      }

      return a.index - b.index;
    });

    return withMeta.map(({review}) => review);
  }, [sortMode]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [sortMode]);

  const visibleReviews = filteredAndSortedReviews.slice(0, visibleCount);
  const canLoadMore = visibleCount < filteredAndSortedReviews.length;

  return (
    <section className="bg-background py-10 sm:py-12">
      <Container>
        <Card className="border-border bg-card py-0 shadow-sm">
          <CardContent className="p-5 sm:p-7 lg:p-8">
            <header className="mb-6 flex flex-col gap-4 lg:mb-8 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground">{t("sections.recent")}</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("helpers.showing", {visible: visibleReviews.length, total: filteredAndSortedReviews.length})}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{t("filters.ratingLabel")}:</span>
                  <Select value={sortMode} onValueChange={(value: SortMode) => setSortMode(value)}>
                    <SelectTrigger className="h-7 rounded-full border-border bg-background px-3 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SORT_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {t(`filters.sort.${option.value}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </header>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {visibleReviews.map((review: Review) => (
                <Card key={review.id} className="border-border bg-background py-0 shadow-none">
                  <CardContent className="p-4 sm:p-5">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-9 border border-border">
                          <AvatarFallback className="bg-muted text-xs font-semibold text-foreground">
                            {getInitials(review.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{review.name}</p>
                          <p className="text-xs text-muted-foreground">{review.city}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-0.5" aria-label={`${review.rating} out of 5 stars`}>
                        {Array.from({length: 5}).map((_, index) => (
                          <Star
                            key={index}
                            className={
                              index < review.rating ? "size-3.5 fill-amber-400 text-amber-400" : "size-3.5 text-border"
                            }
                            aria-hidden="true"
                          />
                        ))}
                      </div>
                    </div>

                    <p className="min-h-20 text-sm leading-relaxed text-muted-foreground">&quot;{review.text}&quot;</p>
                    <p className="mt-3 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                      {formatDate(review.createdAt)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

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
