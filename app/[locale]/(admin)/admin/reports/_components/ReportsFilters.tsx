"use client";

import {FilterX} from "lucide-react";
import {useTranslations} from "next-intl";

import {Button} from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import type {
  ReportModuleFilterValue,
  ReportSeverityFilterValue,
  ReportSortValue,
  ReportStatusFilterValue,
  ReportTypeFilterValue
} from "@/data/admin-reports";

type Option<Value extends string> = {
  value: Value;
  labelKey: string;
};

type ReportsFiltersProps = {
  statusValue: ReportStatusFilterValue;
  typeValue: ReportTypeFilterValue;
  moduleValue: ReportModuleFilterValue;
  severityValue: ReportSeverityFilterValue;
  sortValue: ReportSortValue;
  statusOptions: Option<ReportStatusFilterValue>[];
  typeOptions: Option<ReportTypeFilterValue>[];
  moduleOptions: Option<ReportModuleFilterValue>[];
  severityOptions: Option<ReportSeverityFilterValue>[];
  sortOptions: Option<ReportSortValue>[];
  onStatusChange: (value: ReportStatusFilterValue) => void;
  onTypeChange: (value: ReportTypeFilterValue) => void;
  onModuleChange: (value: ReportModuleFilterValue) => void;
  onSeverityChange: (value: ReportSeverityFilterValue) => void;
  onSortChange: (value: ReportSortValue) => void;
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
  const t = useTranslations("adminReports");

  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-medium tracking-[0.11em] text-muted-foreground uppercase">{label}</p>
      <Select value={value} onValueChange={(nextValue) => onValueChange(nextValue as Value)}>
        <SelectTrigger className="h-10 rounded-xl border-border/70 bg-background/45">
          <SelectValue>{t(options.find((item) => item.value === value)?.labelKey ?? options[0].labelKey)}</SelectValue>
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

export function ReportsFilters({
  statusValue,
  typeValue,
  moduleValue,
  severityValue,
  sortValue,
  statusOptions,
  typeOptions,
  moduleOptions,
  severityOptions,
  sortOptions,
  onStatusChange,
  onTypeChange,
  onModuleChange,
  onSeverityChange,
  onSortChange,
  onReset
}: ReportsFiltersProps) {
  const t = useTranslations("adminReports");

  return (
    <Card className="rounded-2xl border-border/70 bg-card/70 py-0">
      <CardContent className="grid gap-3 px-4 py-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1fr_1fr_auto] xl:items-end">
        <FilterSelect label={t("filters.statusLabel")} value={statusValue} options={statusOptions} onValueChange={onStatusChange} />
        <FilterSelect label={t("filters.typeLabel")} value={typeValue} options={typeOptions} onValueChange={onTypeChange} />
        <FilterSelect label={t("filters.moduleLabel")} value={moduleValue} options={moduleOptions} onValueChange={onModuleChange} />
        <FilterSelect label={t("filters.severityLabel")} value={severityValue} options={severityOptions} onValueChange={onSeverityChange} />
        <FilterSelect label={t("filters.sortLabel")} value={sortValue} options={sortOptions} onValueChange={onSortChange} />

        <div className="flex items-end">
          <Button type="button" variant="outline" className="h-10 w-full rounded-xl border-border/70 bg-background/45 xl:w-11 xl:px-0" onClick={onReset}>
            <FilterX className="size-4" />
            <span className="xl:sr-only">{t("filters.reset")}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
