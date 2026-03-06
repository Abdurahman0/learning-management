"use client";

import {Button} from "@/components/ui/button";
import type {ActiveAchievement} from "@/data/admin-achievements";

import {AchievementCard} from "./AchievementCard";

type ActiveAchievementsGridProps = {
  title: string;
  viewLibraryLabel: string;
  items: ActiveAchievement[];
  emptyLabel: string;
  onViewLibrary: () => void;
  onCardAction: (action: "edit" | "duplicate" | "disable", item: ActiveAchievement) => void;
};

export function ActiveAchievementsGrid({
  title,
  viewLibraryLabel,
  items,
  emptyLabel,
  onViewLibrary,
  onCardAction
}: ActiveAchievementsGridProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[1.65rem] leading-tight font-semibold tracking-tight">{title}</h2>
        <Button type="button" variant="link" className="h-8 px-0 text-sm text-primary" onClick={onViewLibrary}>
          {viewLibraryLabel}
        </Button>
      </div>

      {items.length ? (
        <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <AchievementCard key={item.id} item={item} onAction={onCardAction} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border/70 bg-card/40 px-4 py-10 text-center text-sm text-muted-foreground">
          {emptyLabel}
        </div>
      )}
    </section>
  );
}
