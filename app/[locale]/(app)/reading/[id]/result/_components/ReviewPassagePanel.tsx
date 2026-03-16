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
  const t = useTranslations("readingResult");
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
          className="rounded-md bg-blue-100 px-1 py-0.5 text-blue-800 shadow-[inset_0_-1px_0_rgba(59,130,246,0.28)] dark:bg-blue-400/20 dark:text-blue-50"
        >
          {marked}
          <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full border border-blue-300 bg-blue-200 px-1 text-[10px] font-semibold leading-none text-blue-800 align-text-top dark:border-blue-300/50 dark:bg-blue-500/35 dark:text-blue-50">
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
    <Card className="flex h-[64vh] min-h-0 flex-col overflow-hidden rounded-3xl border-slate-200/85 bg-white/95 py-0 shadow-sm shadow-slate-200/50 dark:border-border/75 dark:bg-card/75 dark:shadow-none xl:h-[calc(100vh-14.5rem)]">
      <div className="sticky top-0 z-20 border-b border-slate-200/90 bg-white/95 px-3 py-3 backdrop-blur dark:border-border/70 dark:bg-card/95 sm:px-4">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">{t("passageAnalysis")}</p>
            <p className="text-xs text-muted-foreground">{activePassage.label}</p>
          </div>
          <div className="overflow-x-auto pb-1 [scrollbar-width:thin]">
            <div className="inline-flex gap-2 pr-2">
              {passages.map((passage, index) => (
                <Button
                  key={passage.id}
                  size="sm"
                  variant={passage.id === activePassageId ? "default" : "outline"}
                  className={cn(
                    "h-8 shrink-0 rounded-xl px-3.5",
                    passage.id === activePassageId
                      ? "bg-blue-500 text-blue-50 hover:bg-blue-500/90"
                      : "border-slate-200 bg-white hover:bg-slate-100 dark:border-border/70 dark:bg-background/40 dark:hover:bg-background/60"
                  )}
                  onClick={() => onPassageChange((`p${index + 1}` as "p1" | "p2" | "p3"))}
                >
                  {t("passageLabel", { index: index + 1 })}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div
        ref={passageScrollRef}
        className="min-h-0 flex-1 overflow-y-auto px-4 pb-5 pt-4 [scrollbar-width:thin] sm:px-6"
      >
        <h2 className="mb-5 text-2xl font-semibold tracking-tight sm:text-[2rem]">{activePassage.title}</h2>
        <div className="space-y-4">
          {activePassage.paragraphs.map((paragraph) => {
            const evidenceQs = (paragraph.highlights ?? []).map((item) => item.questionNumber);
            return (
              <article
                id={paragraph.id}
                key={paragraph.id}
                className={cn(
                  "rounded-2xl border border-slate-200 bg-white px-3.5 py-3.5 transition-all duration-300 dark:border-border/55 dark:bg-background/35 sm:px-4 sm:py-4",
                  evidenceQs.length > 0 && "border-blue-300 bg-blue-50/70 dark:border-blue-500/25 dark:bg-blue-500/[0.07]",
                  highlightedParagraphId === paragraph.id &&
                    "border-blue-300 bg-blue-100/70 ring-1 ring-blue-300/70 dark:border-blue-400/60 dark:bg-blue-500/15 dark:ring-blue-400/45"
                )}
              >
                <div className="mb-2.5 flex flex-wrap items-center gap-2">
                  <p className="min-w-6 text-lg leading-none font-semibold text-blue-700 dark:text-blue-300">{paragraph.label}</p>
                  {evidenceQs.length ? (
                    <div className="flex flex-wrap gap-1.5">
                      {evidenceQs.map((questionNumber) => (
                        <Badge
                          key={`${paragraph.id}-${questionNumber}`}
                          variant="outline"
                          className="h-5 rounded-full border-blue-300 bg-blue-100 px-2 text-[11px] text-blue-700 dark:border-blue-400/45 dark:bg-blue-500/15 dark:text-blue-100"
                        >
                          Q{questionNumber}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                </div>
                <p className="whitespace-pre-wrap text-[15px] leading-7 text-foreground/95">
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
