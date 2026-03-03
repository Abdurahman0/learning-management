"use client";

import {Search} from "lucide-react";
import {useTranslations} from "next-intl";

import {Button} from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

type GuestTab = "all" | "free" | "premium";
type DifficultyFilter = "all" | "easy" | "medium" | "hard";
type SortFilter = "newest" | "popular" | "highest";

type GuestFiltersProps = {
  tab: GuestTab;
  onTabChange: (tab: GuestTab) => void;
  search: string;
  onSearchChange: (value: string) => void;
  difficulty: DifficultyFilter;
  onDifficultyChange: (value: DifficultyFilter) => void;
  sort: SortFilter;
  onSortChange: (value: SortFilter) => void;
};

export function GuestFilters({
  tab,
  onTabChange,
  search,
  onSearchChange,
  difficulty,
  onDifficultyChange,
  sort,
  onSortChange
}: GuestFiltersProps) {
  const t = useTranslations("guest");

  return (
    <div className="mt-5 space-y-4">
      <div className="inline-flex items-center gap-1 rounded-xl bg-muted p-1">
        <Button
          type="button"
          size="sm"
          variant={tab === "all" ? "default" : "ghost"}
          className="h-9 rounded-lg px-4 text-sm"
          onClick={() => onTabChange("all")}
        >
          {t("tabs.all")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant={tab === "free" ? "default" : "ghost"}
          className="h-9 rounded-lg px-4 text-sm"
          onClick={() => onTabChange("free")}
        >
          {t("tabs.free")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant={tab === "premium" ? "default" : "ghost"}
          className="h-9 rounded-lg px-4 text-sm"
          onClick={() => onTabChange("premium")}
        >
          {t("tabs.premium")}
        </Button>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_160px_160px]">
        <label className="relative block">
          <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={t("filters.searchPlaceholder")}
            className="h-11 w-full rounded-xl border border-border bg-card pr-4 pl-12 text-sm text-foreground shadow-xs outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-blue-500"
          />
        </label>

        <Select value={difficulty} onValueChange={(value: DifficultyFilter) => onDifficultyChange(value)}>
          <SelectTrigger className="h-11 w-full rounded-xl border-border bg-card px-3.5 text-sm">
            <SelectValue placeholder={t("filters.difficulty")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("filters.difficultyAll")}</SelectItem>
            <SelectItem value="easy">{t("filters.easy")}</SelectItem>
            <SelectItem value="medium">{t("filters.medium")}</SelectItem>
            <SelectItem value="hard">{t("filters.hard")}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sort} onValueChange={(value: SortFilter) => onSortChange(value)}>
          <SelectTrigger className="h-11 w-full rounded-xl border-border bg-card px-3.5 text-sm">
            <SelectValue placeholder={t("filters.sort")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">{t("filters.sortNewest")}</SelectItem>
            <SelectItem value="popular">{t("filters.sortPopular")}</SelectItem>
            <SelectItem value="highest">{t("filters.sortHighest")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
