"use client";

import {Lock, Search} from "lucide-react";
import {useTranslations} from "next-intl";

import {Button} from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import type {Difficulty, PracticeSource} from "../tests/types";

type ReadingTab = "all" | "free" | "premium";
type ReadingKindFilter = "full" | "passages";
type DifficultyFilter = "all" | Difficulty;
type SourceFilter = "all" | PracticeSource;
type SortFilter = "newest" | "az";

type ReadingFiltersProps = {
  tab: ReadingTab;
  onTabChange: (value: ReadingTab) => void;
  kind: ReadingKindFilter;
  onKindChange: (value: ReadingKindFilter) => void;
  source: SourceFilter;
  onSourceChange: (value: SourceFilter) => void;
  search: string;
  onSearchChange: (value: string) => void;
  difficulty: DifficultyFilter;
  onDifficultyChange: (value: DifficultyFilter) => void;
  sort: SortFilter;
  onSortChange: (value: SortFilter) => void;
};

export function ReadingFilters({
  tab,
  onTabChange,
  kind,
  onKindChange,
  source,
  onSourceChange,
  search,
  onSearchChange,
  difficulty,
  onDifficultyChange,
  sort,
  onSortChange
}: ReadingFiltersProps) {
  const t = useTranslations("guest");

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex w-full items-center gap-1 rounded-xl bg-muted p-1 sm:w-auto">
          <Button type="button" size="sm" variant={tab === "all" ? "default" : "ghost"} className="h-9 flex-1 rounded-lg px-3 text-sm sm:flex-none" onClick={() => onTabChange("all")}>{t("tabs.all")}</Button>
          <Button type="button" size="sm" variant={tab === "free" ? "default" : "ghost"} className="h-9 flex-1 rounded-lg px-3 text-sm sm:flex-none" onClick={() => onTabChange("free")}>{t("tabs.free")}</Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-9 flex-1 rounded-lg px-3 text-sm sm:flex-none disabled:cursor-not-allowed disabled:opacity-60"
            disabled
            aria-disabled="true"
            onClick={() => onTabChange("premium")}
          >
            <span className="inline-flex items-center gap-1.5">{t("tabs.premium")}<Lock className="size-3.5" aria-hidden="true" /></span>
          </Button>
        </div>

        <div className="inline-flex w-full items-center gap-1 rounded-xl bg-muted p-1 sm:w-auto" aria-label={t("filters.source")}>
          <Button type="button" size="sm" variant={source === "all" ? "default" : "ghost"} className="h-9 flex-1 rounded-lg px-3 text-sm sm:flex-none" onClick={() => onSourceChange("all")}>{t("filters.sourceAll")}</Button>
          <Button type="button" size="sm" variant={source === "cambridge" ? "default" : "ghost"} className="h-9 flex-1 rounded-lg px-3 text-sm sm:flex-none" onClick={() => onSourceChange("cambridge")}>{t("filters.sourceCambridge")}</Button>
          <Button type="button" size="sm" variant={source === "real" ? "default" : "ghost"} className="h-9 flex-1 rounded-lg px-3 text-sm sm:flex-none" onClick={() => onSourceChange("real")}>{t("filters.sourceReal")}</Button>
        </div>

        <div className="inline-flex w-full items-center gap-1 rounded-xl bg-muted p-1 sm:w-auto" aria-label={t("reading.practiceType")}>
          <Button type="button" size="sm" variant={kind === "full" ? "default" : "ghost"} className="h-9 flex-1 rounded-lg px-3 text-sm sm:flex-none" onClick={() => onKindChange("full")}>{t("reading.fullTestsTitle")}</Button>
          <Button type="button" size="sm" variant={kind === "passages" ? "default" : "ghost"} className="h-9 flex-1 rounded-lg px-3 text-sm sm:flex-none" onClick={() => onKindChange("passages")}>{t("reading.passagesTitle")}</Button>
        </div>
      </div>

      <label className="relative block">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={t("filters.searchPlaceholder")}
          className="h-10 w-full rounded-xl border border-border bg-card pr-3.5 pl-10 text-sm text-foreground shadow-xs outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-blue-500"
        />
      </label>

      <div className="grid grid-cols-2 gap-2.5 sm:max-w-[360px]">
        <Select value={difficulty} onValueChange={(value: DifficultyFilter) => onDifficultyChange(value)}>
          <SelectTrigger className="h-10 rounded-xl border-border bg-card px-3 text-sm">
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
          <SelectTrigger className="h-10 rounded-xl border-border bg-card px-3 text-sm">
            <SelectValue placeholder={t("filters.sort")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">{t("filters.sortNewest")}</SelectItem>
            <SelectItem value="az">{t("filters.sortHighest")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
