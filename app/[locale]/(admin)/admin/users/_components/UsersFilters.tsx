"use client";

import {FilterX} from "lucide-react";
import {useTranslations} from "next-intl";

import {Button} from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import type {FilterOption, PlanFilterValue, RoleFilterValue, StatusFilterValue} from "@/data/admin-users";

type UsersFiltersProps = {
  statusValue: StatusFilterValue;
  roleValue: RoleFilterValue;
  planValue: PlanFilterValue;
  statusOptions: FilterOption<StatusFilterValue>[];
  roleOptions: FilterOption<RoleFilterValue>[];
  planOptions: FilterOption<PlanFilterValue>[];
  onStatusChange: (value: StatusFilterValue) => void;
  onRoleChange: (value: RoleFilterValue) => void;
  onPlanChange: (value: PlanFilterValue) => void;
  onReset: () => void;
};

function FilterSelect<T extends string>({
  ariaLabel,
  value,
  options,
  onValueChange
}: {
  ariaLabel: string;
  value: T;
  options: FilterOption<T>[];
  onValueChange: (value: T) => void;
}) {
  const t = useTranslations("adminUsers");

  return (
    <Select value={value} onValueChange={(nextValue) => onValueChange(nextValue as T)}>
      <SelectTrigger className="h-10 rounded-xl border-border/70 bg-background/45">
        <SelectValue aria-label={ariaLabel}>{t(options.find((item) => item.value === value)?.labelKey ?? options[0].labelKey)}</SelectValue>
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

export function UsersFilters({
  statusValue,
  roleValue,
  planValue,
  statusOptions,
  roleOptions,
  planOptions,
  onStatusChange,
  onRoleChange,
  onPlanChange,
  onReset
}: UsersFiltersProps) {
  const t = useTranslations("adminUsers");

  return (
    <Card className="rounded-2xl border-border/70 bg-card/70 py-0">
      <CardContent className="px-4 py-4 sm:px-5">
        <div className="grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
          <FilterSelect ariaLabel={t("filters.labels.status")} value={statusValue} options={statusOptions} onValueChange={onStatusChange} />
          <FilterSelect ariaLabel={t("filters.labels.role")} value={roleValue} options={roleOptions} onValueChange={onRoleChange} />
          <FilterSelect ariaLabel={t("filters.labels.plan")} value={planValue} options={planOptions} onValueChange={onPlanChange} />

          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-xl border-border/70 bg-background/45"
            onClick={onReset}
          >
            <FilterX className="size-4" />
            {t("filters.reset")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
