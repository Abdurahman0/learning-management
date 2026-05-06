"use client";

import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type QuestionPaletteSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeQuestionNumber: number;
  answeredQuestionNumbers: Set<number>;
  markedQuestionNumbers: Set<number>;
  onQuestionSelect: (questionNumber: number) => void;
  title: string;
  description: string;
};

const RANGES = [
  { label: "Passage 1", from: 1, to: 13 },
  { label: "Passage 2", from: 14, to: 26 },
  { label: "Passage 3", from: 27, to: 40 }
];

export function QuestionPaletteSheet({
  open,
  onOpenChange,
  activeQuestionNumber,
  answeredQuestionNumbers,
  markedQuestionNumbers,
  onQuestionSelect,
  title,
  description
}: QuestionPaletteSheetProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");

    const handleChange = () => setIsMobile(media.matches);

    handleChange();
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, []);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={isMobile ? "bottom" : "right"} className="p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border pb-4">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-9rem)] px-6 pb-6 md:h-[calc(100vh-8rem)]">
          <div className="space-y-6 py-4">
            {RANGES.map((range) => {
              const numbers = Array.from({ length: range.to - range.from + 1 }, (_, index) => range.from + index);

              return (
                <section key={range.label}>
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">{range.label}</p>
                    <Badge variant="outline" className="text-[11px]">
                      {range.from}-{range.to}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-5 gap-2">
                    {numbers.map((questionNumber) => {
                      const isCurrent = questionNumber === activeQuestionNumber;
                      const isAnswered = answeredQuestionNumbers.has(questionNumber);
                      const isMarked = markedQuestionNumbers.has(questionNumber);

                      return (
                        <Button
                          key={questionNumber}
                          type="button"
                          variant="outline"
                          aria-label={`Go to question ${questionNumber}`}
                          onClick={() => {
                            onQuestionSelect(questionNumber);
                            onOpenChange(false);
                          }}
                          className={cn(
                            "relative h-10 rounded-md border text-sm",
                            isCurrent && "border-blue-700 bg-blue-600 text-white shadow-md shadow-blue-500/25 ring-2 ring-blue-300/70 hover:bg-blue-600 dark:border-cyan-300 dark:bg-blue-500 dark:ring-cyan-300/60 dark:shadow-cyan-500/20",
                            !isCurrent && isAnswered && "border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-500/45 dark:bg-emerald-500/20 dark:text-emerald-200",
                            !isCurrent && !isAnswered && "border-dashed border-slate-300 bg-white/70 text-slate-600 hover:border-blue-300 hover:text-blue-700 dark:border-slate-600 dark:bg-slate-900/45 dark:text-slate-300 dark:hover:border-blue-400/70 dark:hover:text-blue-200",
                            isMarked && "ring-2 ring-amber-400 ring-offset-1"
                          )}
                        >
                          {questionNumber}
                          {isMarked ? <span className="absolute top-1 right-1 size-1.5 rounded-full bg-amber-500" aria-hidden="true" /> : null}
                        </Button>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
