"use client";

import {Search} from "lucide-react";
import {useTranslations} from "next-intl";

import {Input} from "@/components/ui/input";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {
  type TeacherStudentsProgressFilter,
  type TeacherStudentsSortBy,
  type TeacherStudentsStatusFilter,
  type TeacherStudentsTargetFilter
} from "@/data/teacher/selectors";

type TeacherStudentsFiltersProps = {
  searchQuery: string;
  progressFilter: TeacherStudentsProgressFilter;
  targetFilter: TeacherStudentsTargetFilter;
  statusFilter: TeacherStudentsStatusFilter;
  sortBy: TeacherStudentsSortBy;
  onSearchQueryChange: (value: string) => void;
  onProgressFilterChange: (value: TeacherStudentsProgressFilter) => void;
  onTargetFilterChange: (value: TeacherStudentsTargetFilter) => void;
  onStatusFilterChange: (value: TeacherStudentsStatusFilter) => void;
  onSortByChange: (value: TeacherStudentsSortBy) => void;
};

type Option<T extends string> = {
  value: T;
  labelKey: string;
};

function FilterSelect<T extends string>({
  value,
  options,
  ariaLabel,
  onChange
}: {
  value: T;
  options: Option<T>[];
  ariaLabel: string;
  onChange: (value: T) => void;
}) {
  const t = useTranslations("teacherStudents");

  return (
    <Select value={value} onValueChange={(nextValue) => onChange(nextValue as T)}>
      <SelectTrigger className="h-11 rounded-xl border-border/70 bg-background/45">
        <SelectValue aria-label={ariaLabel}>{t(options.find((option) => option.value === value)?.labelKey ?? options[0].labelKey)}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {t(option.labelKey)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

const progressOptions: Option<TeacherStudentsProgressFilter>[] = [
  {value: "all", labelKey: "filters.progressOptions.all"},
  {value: "improving", labelKey: "filters.progressOptions.improving"},
  {value: "stable", labelKey: "filters.progressOptions.stable"},
  {value: "needs_help", labelKey: "filters.progressOptions.needsHelp"}
];

const targetOptions: Option<TeacherStudentsTargetFilter>[] = [
  {value: "all", labelKey: "filters.targetOptions.all"},
  {value: "6_plus", labelKey: "filters.targetOptions.6plus"},
  {value: "6_5_plus", labelKey: "filters.targetOptions.6_5plus"},
  {value: "7_plus", labelKey: "filters.targetOptions.7plus"},
  {value: "7_5_plus", labelKey: "filters.targetOptions.7_5plus"}
];

const statusOptions: Option<TeacherStudentsStatusFilter>[] = [
  {value: "all", labelKey: "filters.statusOptions.all"},
  {value: "active", labelKey: "filters.statusOptions.active"},
  {value: "inactive", labelKey: "filters.statusOptions.inactive"},
  {value: "at_risk", labelKey: "filters.statusOptions.atRisk"}
];

const sortOptions: Option<TeacherStudentsSortBy>[] = [
  {value: "recent_activity", labelKey: "filters.sortOptions.recentActivity"},
  {value: "name", labelKey: "filters.sortOptions.name"},
  {value: "highest_band", labelKey: "filters.sortOptions.highestBand"},
  {value: "lowest_band", labelKey: "filters.sortOptions.lowestBand"},
  {value: "most_pending", labelKey: "filters.sortOptions.mostPending"}
];

export function TeacherStudentsFilters({
  searchQuery,
  progressFilter,
  targetFilter,
  statusFilter,
  sortBy,
  onSearchQueryChange,
  onProgressFilterChange,
  onTargetFilterChange,
  onStatusFilterChange,
  onSortByChange
}: TeacherStudentsFiltersProps) {
  const t = useTranslations("teacherStudents");

  return (
    <section className="rounded-2xl border border-border/70 bg-card/70 p-3.5 sm:p-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            placeholder={t("searchPlaceholder")}
            className="h-11 rounded-xl border-border/70 bg-background/45 pl-9"
          />
        </div>

        <FilterSelect
          value={progressFilter}
          options={progressOptions}
          ariaLabel={t("progressFilter")}
          onChange={onProgressFilterChange}
        />
        <FilterSelect value={targetFilter} options={targetOptions} ariaLabel={t("targetFilter")} onChange={onTargetFilterChange} />
        <FilterSelect value={statusFilter} options={statusOptions} ariaLabel={t("statusFilter")} onChange={onStatusFilterChange} />
        <FilterSelect value={sortBy} options={sortOptions} ariaLabel={t("sortBy")} onChange={onSortByChange} />
      </div>
    </section>
  );
}
