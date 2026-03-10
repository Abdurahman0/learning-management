"use client";

import { type ReactNode, type RefObject } from "react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ReviewPassage } from "@/data/review-reading";

type ReviewPassagePanelProps = {
  passages: ReviewPassage[];
  activePassageId: string;
  highlightedParagraphId: string | null;
  passageScrollRef: RefObject<HTMLDivElement | null>;
  onPassageChange: (passageId: "p1" | "p2" | "p3") => void;
};

export function ReviewPassagePanel({
  passages,
  activePassageId,
  highlightedParagraphId,
  passageScrollRef,
  onPassageChange,
}: ReviewPassagePanelProps) {
  const t = useTranslations("readingReview");
  const activePassage = passages.find((passage) => passage.id === activePassageId) ?? passages[0];

  const renderParagraphText = (text: string, highlights?: Array<{ questionNumber: number; text: string }>) => {
    if (!highlights?.length) return text;

    const lowerText = text.toLowerCase();
    const ranges = highlights
      .map((item) => {
        const phrase = item.text.trim();
        if (!phrase) return null;
        const start = lowerText.indexOf(phrase.toLowerCase());
        if (start < 0) return null;
        return {
          start,
          end: start + phrase.length,
          questionNumber: item.questionNumber,
        };
      })
      .filter((value): value is { start: number; end: number; questionNumber: number } => Boolean(value))
      .sort((a, b) => a.start - b.start);

    if (!ranges.length) return text;

    const merged: Array<{ start: number; end: number; questionNumber: number }> = [];
    for (const range of ranges) {
      const last = merged[merged.length - 1];
      if (last && range.start < last.end) {
        continue;
      }
      merged.push(range);
    }

    const chunks: ReactNode[] = [];
    let cursor = 0;
    merged.forEach((range, index) => {
      if (range.start > cursor) {
        chunks.push(
          <span key={`plain-${range.start}-${range.end}`}>{text.slice(cursor, range.start)}</span>
        );
      }

      const marked = text.slice(range.start, range.end);
      chunks.push(
        <span
          key={`highlight-${range.start}-${range.end}-${index}`}
          className="rounded-sm bg-blue-500/20 px-0.5 text-blue-100 shadow-[inset_0_-1px_0_rgba(96,165,250,0.45)]"
        >
          {marked}
          <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full border border-blue-300/60 bg-blue-500/35 px-1 text-[10px] font-semibold leading-none text-blue-50 align-text-top">
            {range.questionNumber}
          </span>
        </span>
      );
      cursor = range.end;
    });

    if (cursor < text.length) {
      chunks.push(<span key={`tail-${cursor}`}>{text.slice(cursor)}</span>);
    }

    return chunks;
  };

  if (!activePassage) return null;

  return (
    <Card className="min-h-0 overflow-hidden border-border/80 bg-card/70 py-0">
      <div className="sticky top-0 z-20 border-b border-border/70 bg-card/95 px-3 py-2 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            {passages.map((passage, index) => (
              <Button
                key={passage.id}
                size="sm"
                variant={passage.id === activePassageId ? "default" : "outline"}
                className={cn("rounded-md", passage.id !== activePassageId && "bg-background/50")}
                onClick={() => onPassageChange((`p${index + 1}` as "p1" | "p2" | "p3"))}
              >
                {t("passageLabel", { index: index + 1 })}
              </Button>
            ))}
          </div>
          <p className="text-[11px] tracking-[0.14em] text-muted-foreground uppercase">{t("passageReview")}</p>
        </div>
      </div>

      <div ref={passageScrollRef} className="h-[68vh] overflow-y-auto px-4 py-4 sm:px-6">
        <h2 className="mb-4 text-2xl font-semibold tracking-tight">{activePassage.title}</h2>
        <div className="space-y-5">
          {activePassage.paragraphs.map((paragraph) => {
            const evidenceQs = (paragraph.highlights ?? []).map((item) => item.questionNumber);
            return (
              <article
                id={paragraph.id}
                key={paragraph.id}
                className={cn(
                  "rounded-xl border border-transparent px-2 py-2 transition-all duration-300",
                  evidenceQs.length > 0 && "bg-blue-500/5",
                  highlightedParagraphId === paragraph.id &&
                    "border-blue-400/70 bg-blue-500/12 ring-2 ring-blue-400/30"
                )}
              >
                <div className="mb-1.5 flex items-start gap-2">
                  <p className="min-w-6 pt-0.5 text-lg font-semibold text-blue-400">{paragraph.label}</p>
                  {evidenceQs.length ? (
                    <div className="flex flex-wrap gap-1">
                      {evidenceQs.map((questionNumber) => (
                        <Badge
                          key={`${paragraph.id}-${questionNumber}`}
                          variant="secondary"
                          className="h-5 rounded-full border border-blue-400/50 bg-blue-500/15 px-2 text-[11px] text-blue-100"
                        >
                          Q{questionNumber}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                </div>
                <p className="whitespace-pre-wrap text-base leading-relaxed text-foreground/90">
                  {renderParagraphText(paragraph.text, paragraph.highlights)}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
