"use client";

import {ListFilter, Search} from "lucide-react";
import {useTranslations} from "next-intl";

import {Button} from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import type {TeacherReviewsStatusFilter, TeacherReviewsTypeFilter} from "@/data/teacher/selectors";

type TeacherReviewsFiltersProps = {
  search: string;
  typeFilter: TeacherReviewsTypeFilter;
  statusFilter: TeacherReviewsStatusFilter;
  descending: boolean;
  onSearchChange: (value: string) => void;
  onTypeChange: (value: TeacherReviewsTypeFilter) => void;
  onStatusChange: (value: TeacherReviewsStatusFilter) => void;
  onToggleSort: () => void;
};

export function TeacherReviewsFilters({
  search,
  typeFilter,
  statusFilter,
  descending,
  onSearchChange,
  onTypeChange,
  onStatusChange,
  onToggleSort
}: TeacherReviewsFiltersProps) {
  const t = useTranslations("teacherReviews");

  return (
    <Card className="rounded-2xl border-border/70 bg-card/75 py-0">
      <CardContent className="p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <label className="relative min-w-60 flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={t("searchPlaceholder")}
              className="h-11 w-full rounded-xl border border-border/70 bg-background/45 pl-9 pr-3 text-sm outline-none transition-colors focus:border-primary/55"
            />
          </label>

          <Select value={typeFilter} onValueChange={(value) => onTypeChange(value as TeacherReviewsTypeFilter)}>
            <SelectTrigger className="h-11 w-42.5 rounded-xl border-border/70 bg-background/45">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("typeOptions.all")}</SelectItem>
              <SelectItem value="writing">{t("typeOptions.writing")}</SelectItem>
              <SelectItem value="speaking">{t("typeOptions.speaking")}</SelectItem>
              <SelectItem value="reading_practice">{t("typeOptions.reading_practice")}</SelectItem>
              <SelectItem value="listening_practice">{t("typeOptions.listening_practice")}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(value) => onStatusChange(value as TeacherReviewsStatusFilter)}>
            <SelectTrigger className="h-11 w-37.5 rounded-xl border-border/70 bg-background/45">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("statusOptions.all")}</SelectItem>
              <SelectItem value="pending">{t("statusOptions.pending")}</SelectItem>
              <SelectItem value="reviewed">{t("statusOptions.reviewed")}</SelectItem>
              <SelectItem value="overdue">{t("statusOptions.overdue")}</SelectItem>
            </SelectContent>
          </Select>

          <Button
            type="button"
            variant="outline"
            className="h-11 rounded-xl border-border/70 bg-background/45 px-3.5"
            onClick={onToggleSort}
          >
            <ListFilter className="size-4" />
            <span className="ml-1 text-xs">{descending ? t("sort.latest") : t("sort.oldest")}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
