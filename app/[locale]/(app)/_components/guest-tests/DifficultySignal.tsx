"use client";

import {cn} from "@/lib/utils";

type Difficulty = "easy" | "medium" | "hard";

type DifficultySignalProps = {
  difficulty: Difficulty;
  className?: string;
};

const difficultyColor = {
  easy: "bg-emerald-500",
  medium: "bg-amber-500",
  hard: "bg-red-500"
} as const;

const activeBars = {
  easy: 1,
  medium: 2,
  hard: 3
} as const;

export function DifficultySignal({difficulty, className}: DifficultySignalProps) {
  return (
    <span className={cn("inline-flex items-end gap-0.5", className)} aria-hidden="true">
      {Array.from({length: 3}).map((_, index) => (
        <span
          key={index}
          className={cn(
            "w-1 rounded-full",
            index === 0 && "h-2.5",
            index === 1 && "h-3.5",
            index === 2 && "h-4.5",
            index < activeBars[difficulty] ? difficultyColor[difficulty] : "bg-muted-foreground/25"
          )}
        />
      ))}
    </span>
  );
}

