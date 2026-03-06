"use client";

import {SlidersHorizontal} from "lucide-react";
import {useTranslations} from "next-intl";

import {Button} from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import type {
  DifficultyFilterValue,
  ModuleFilterValue,
  StatusFilterValue,
  TestSort
} from "@/data/admin-tests";

type Option<Value extends string> = {
  value: Value;
  labelKey: string;
};

type TestsFiltersProps = {
  moduleValue: ModuleFilterValue;
  difficultyValue: DifficultyFilterValue;
  statusValue: StatusFilterValue;
  sortValue: TestSort;
  moduleOptions: Option<ModuleFilterValue>[];
  difficultyOptions: Option<DifficultyFilterValue>[];
  statusOptions: Option<StatusFilterValue>[];
  sortOptions: Option<TestSort>[];
  onModuleChange: (value: ModuleFilterValue) => void;
  onDifficultyChange: (value: DifficultyFilterValue) => void;
  onStatusChange: (value: StatusFilterValue) => void;
  onSortChange: (value: TestSort) => void;
  onReset: () => void;
};

function FilterSelect<Value extends string>({
  label,
  value,
  options,
  onValueChange
}: {
  label: string;
  value: Value;
  options: Option<Value>[];
  onValueChange: (value: Value) => void;
}) {
  const t = useTranslations("adminTests");

  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-medium tracking-[0.12em] text-muted-foreground uppercase">{label}</p>
      <Select value={value} onValueChange={(nextValue) => onValueChange(nextValue as Value)}>
        <SelectTrigger className="h-10 w-full rounded-xl border-border/70 bg-background/45">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {t(option.labelKey)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function TestsFilters({
  moduleValue,
  difficultyValue,
  statusValue,
  sortValue,
  moduleOptions,
  difficultyOptions,
  statusOptions,
  sortOptions,
  onModuleChange,
  onDifficultyChange,
  onStatusChange,
  onSortChange,
  onReset
}: TestsFiltersProps) {
  const t = useTranslations("adminTests");

  return (
    <Card className="rounded-3xl border-border/70 bg-card/70 py-0">
      <CardContent className="grid gap-3 px-4 py-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1fr_auto] xl:items-end">
        <FilterSelect
          label={t("filters.moduleLabel")}
          value={moduleValue}
          options={moduleOptions}
          onValueChange={onModuleChange}
        />
        <FilterSelect
          label={t("filters.difficultyLabel")}
          value={difficultyValue}
          options={difficultyOptions}
          onValueChange={onDifficultyChange}
        />
        <FilterSelect label={t("filters.statusLabel")} value={statusValue} options={statusOptions} onValueChange={onStatusChange} />
        <FilterSelect label={t("filters.sortLabel")} value={sortValue} options={sortOptions} onValueChange={onSortChange} />

        <div className="flex items-end">
          <Button
            type="button"
            variant="outline"
            className="h-10 w-full rounded-xl border-border/70 bg-background/45 xl:w-11 xl:px-0"
            onClick={onReset}
          >
            <SlidersHorizontal className="size-4" />
            <span className="xl:sr-only">{t("filters.reset")}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
