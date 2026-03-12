"use client";

import {useMemo, useState} from "react";
import {CalendarIcon} from "lucide-react";
import {useTranslations} from "next-intl";

import {Button} from "@/components/ui/button";
import {Calendar} from "@/components/ui/calendar";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";

type TeacherAssignmentDueDateInputProps = {
  value: string;
  onChange: (value: string) => void;
};

function formatMmDdYyyy(value: Date) {
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  const year = value.getFullYear();

  return `${month}/${day}/${year}`;
}

function parseDate(value: string): Date | undefined {
  const normalized = value.trim();
  const slashMatch = normalized.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

  if (slashMatch) {
    const [, mm, dd, yyyy] = slashMatch;
    const month = Number(mm);
    const day = Number(dd);
    const year = Number(yyyy);
    const parsed = new Date(year, month - 1, day);

    if (Number.isNaN(parsed.getTime())) {
      return undefined;
    }

    if (parsed.getFullYear() !== year || parsed.getMonth() !== month - 1 || parsed.getDate() !== day) {
      return undefined;
    }

    return parsed;
  }

  const isoMatch = normalized.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    const [, yyyy, mm, dd] = isoMatch;
    const year = Number(yyyy);
    const month = Number(mm);
    const day = Number(dd);
    const parsed = new Date(year, month - 1, day);

    if (Number.isNaN(parsed.getTime())) {
      return undefined;
    }

    if (parsed.getFullYear() !== year || parsed.getMonth() !== month - 1 || parsed.getDate() !== day) {
      return undefined;
    }

    return parsed;
  }

  return undefined;
}

export function TeacherAssignmentDueDateInput({value, onChange}: TeacherAssignmentDueDateInputProps) {
  const t = useTranslations("teacherAssignments");
  const selectedDate = useMemo(() => parseDate(value), [value]);
  const [month, setMonth] = useState<Date>(selectedDate ?? new Date());

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={t("dueDatePlaceholder")}
        inputMode="numeric"
        autoComplete="off"
        className="h-11 w-full rounded-xl border border-border/70 bg-background/45 px-3 pr-11 text-sm outline-none transition-colors focus:border-primary/55"
      />

      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute top-1/2 right-1.5 size-8 -translate-y-1/2 rounded-lg text-muted-foreground hover:bg-muted/45"
          >
            <CalendarIcon className="size-4" />
            <span className="sr-only">{t("openCalendar")}</span>
          </Button>
        </PopoverTrigger>

        <PopoverContent align="end" className="w-auto border-none bg-transparent p-0">
          <Calendar
            selected={selectedDate}
            onSelect={(date) => {
              onChange(formatMmDdYyyy(date));
              setMonth(new Date(date.getFullYear(), date.getMonth(), 1));
            }}
            month={month}
            onMonthChange={setMonth}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
