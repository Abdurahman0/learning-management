import {cn} from "@/lib/utils";

import type {ListeningDifficulty} from "@/data/listening-tests";

type DifficultySignalProps = {
  difficulty: ListeningDifficulty;
  className?: string;
};

const ACTIVE_BARS: Record<ListeningDifficulty, number> = {
  easy: 1,
  medium: 2,
  hard: 3
};

const COLOR_BY_DIFFICULTY: Record<ListeningDifficulty, string> = {
  easy: "bg-emerald-500",
  medium: "bg-amber-500",
  hard: "bg-red-500"
};

export function DifficultySignal({difficulty, className}: DifficultySignalProps) {
  return (
    <span className={cn("inline-grid w-4 shrink-0 grid-cols-3 items-end gap-0.5 overflow-hidden", className)} aria-hidden="true">
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className={cn(
            "w-1 rounded-full",
            index === 0 && "h-2.5",
            index === 1 && "h-3.5",
            index === 2 && "h-4.5",
            index < ACTIVE_BARS[difficulty] ? COLOR_BY_DIFFICULTY[difficulty] : "bg-muted-foreground/25"
          )}
        />
      ))}
    </span>
  );
}
