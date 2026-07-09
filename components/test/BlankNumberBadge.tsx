"use client";

import { cn } from "@/lib/utils";

type BlankNumberBadgeProps = {
  number: number;
  active?: boolean;
};

/**
 * Small question-number label inset into the left edge of a completion-type blank
 * (table/summary/note/form completion inputs). Meant to sit inside a `relative`
 * wrapper alongside an `<Input>` that has left padding to clear it, replacing the
 * older pattern of a separate number chip next to the box.
 */
export function BlankNumberBadge({ number, active = false }: BlankNumberBadgeProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute top-1/2 left-2 -translate-y-1/2 text-[11px] font-semibold select-none",
        active ? "text-blue-600 dark:text-blue-300" : "text-muted-foreground/60"
      )}
    >
      {number}
    </span>
  );
}
