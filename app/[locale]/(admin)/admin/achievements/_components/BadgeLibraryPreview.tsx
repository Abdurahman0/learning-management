"use client";

import type {LucideIcon} from "lucide-react";
import {Headphones, Mic, PenLine, Plus, Rocket, Star} from "lucide-react";
import {useTranslations} from "next-intl";

import {Card, CardContent} from "@/components/ui/card";
import type {BadgeLibraryIcon, BadgeLibraryItem} from "@/data/admin-achievements";
import {cn} from "@/lib/utils";

const iconMap: Record<BadgeLibraryIcon, LucideIcon> = {
  star: Star,
  rocket: Rocket,
  pen: PenLine,
  mic: Mic,
  headphones: Headphones,
  plus: Plus
};

type BadgeLibraryPreviewProps = {
  items: BadgeLibraryItem[];
  onNewBadge: () => void;
};

export function BadgeLibraryPreview({items, onNewBadge}: BadgeLibraryPreviewProps) {
  const t = useTranslations("adminAchievements");

  return (
    <section id="achievement-badge-library" className="space-y-3">
      <h2 className="text-[1.65rem] leading-tight font-semibold tracking-tight">{t("badgeLibraryPreview")}</h2>

      {items.length ? (
        <div className="grid min-w-0 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {items.map((badge) => {
            const Icon = iconMap[badge.icon];
            const isNewBadge = badge.icon === "plus";

            return (
              <button
                key={badge.id}
                type="button"
                onClick={isNewBadge ? onNewBadge : undefined}
                className={cn(
                  "group rounded-2xl border border-border/70 bg-card/70 px-3 py-3.5 text-left transition-colors",
                  isNewBadge ? "hover:border-primary/50 hover:bg-primary/10" : "hover:bg-muted/45"
                )}
              >
                <Card className="gap-3 rounded-none border-none bg-transparent py-0 shadow-none">
                  <CardContent className="flex flex-col items-center gap-2 px-0 py-0">
                    <span
                      className={cn(
                        "inline-flex size-10 items-center justify-center rounded-full border border-border/70 bg-background/55",
                        isNewBadge ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                      )}
                    >
                      <Icon className="size-4.5" />
                    </span>
                    <span className={cn("text-sm font-medium", isNewBadge ? "text-primary" : "text-foreground")}>
                      {badge.icon === "plus" ? t("newBadge") : badge.label}
                    </span>
                  </CardContent>
                </Card>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border/70 bg-card/40 px-4 py-8 text-center text-sm text-muted-foreground">
          {t("empty.badges")}
        </div>
      )}
    </section>
  );
}
