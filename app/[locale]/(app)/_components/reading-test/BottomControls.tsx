"use client";

import { Bookmark, Grid2x2, MoveLeft, MoveRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";

type BottomControlsProps = {
  canGoPrev: boolean;
  canGoNext: boolean;
  isMarked: boolean;
  onPrev: () => void;
  onNext: () => void;
  onMarkedChange: (next: boolean) => void;
  onPaletteOpen: () => void;
  activeQuestionNumber: number;
  totalQuestions: number;
  markLabel: string;
  previousLabel: string;
  nextLabel: string;
  paletteLabel: string;
};

export function BottomControls({
  canGoPrev,
  canGoNext,
  isMarked,
  onPrev,
  onNext,
  onMarkedChange,
  onPaletteOpen,
  activeQuestionNumber,
  totalQuestions,
  markLabel,
  previousLabel,
  nextLabel,
  paletteLabel
}: BottomControlsProps) {
  return (
    <div className="sticky bottom-0 z-20 border-t border-border bg-background/95 px-5 py-3 backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <Button aria-label={previousLabel} variant="ghost" onClick={onPrev} disabled={!canGoPrev} className="h-10 px-4 text-base">
          <MoveLeft className="size-4" />
          {previousLabel}
        </Button>

        <div className="flex items-center gap-2">
          <Toggle
            aria-label={markLabel}
            pressed={isMarked}
            onPressedChange={onMarkedChange}
            variant="outline"
            size="lg"
            className="h-10 px-4 text-base font-semibold"
          >
            <Bookmark className="size-4" />
            {markLabel}
          </Toggle>

          <Button aria-label={paletteLabel} variant="secondary" onClick={onPaletteOpen} className="h-10 px-4 text-base">
            <Grid2x2 className="size-4" />
            {paletteLabel}
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <p className="hidden text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase xl:block">
            Question {activeQuestionNumber} of {totalQuestions}
          </p>
          <Button aria-label={nextLabel} variant="ghost" onClick={onNext} disabled={!canGoNext} className="h-10 px-4 text-base text-blue-700 hover:text-blue-700">
            {nextLabel}
            <MoveRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
