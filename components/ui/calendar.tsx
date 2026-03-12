"use client";

import * as React from "react";
import {ChevronLeft, ChevronRight} from "lucide-react";

import {Button} from "@/components/ui/button";
import {cn} from "@/lib/utils";

type CalendarProps = {
  selected?: Date;
  onSelect?: (date: Date) => void;
  month?: Date;
  onMonthChange?: (month: Date) => void;
  className?: string;
  yearRange?: {
    from: number;
    to: number;
  };
};

const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const;
const MONTH_LABELS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
] as const;

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function daysInMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function isSameDate(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate()
  );
}

function buildCalendarMatrix(month: Date) {
  const first = startOfMonth(month);
  const startWeekday = first.getDay();
  const total = daysInMonth(month);
  const cells: Array<Date | null> = [];

  for (let i = 0; i < startWeekday; i += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= total; day += 1) {
    cells.push(new Date(month.getFullYear(), month.getMonth(), day));
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

export function Calendar({
  selected,
  onSelect,
  month,
  onMonthChange,
  className,
  yearRange
}: CalendarProps) {
  const [internalMonth, setInternalMonth] = React.useState<Date>(() => startOfMonth(month ?? selected ?? new Date()));

  React.useEffect(() => {
    if (!month) {
      return;
    }

    setInternalMonth(startOfMonth(month));
  }, [month]);

  const activeMonth = month ? startOfMonth(month) : internalMonth;
  const cells = buildCalendarMatrix(activeMonth);
  const activeYear = activeMonth.getFullYear();
  const rangeFrom = yearRange?.from ?? activeYear - 12;
  const rangeTo = yearRange?.to ?? activeYear + 12;
  const yearOptions = Array.from({length: Math.max(1, rangeTo - rangeFrom + 1)}, (_, index) => rangeFrom + index);

  const changeMonth = (offset: number) => {
    const next = new Date(activeMonth.getFullYear(), activeMonth.getMonth() + offset, 1);

    if (onMonthChange) {
      onMonthChange(next);
      return;
    }

    setInternalMonth(next);
  };

  return (
    <div className={cn("rounded-xl border border-border/70 bg-background/90 p-3", className)}>
      <div className="mb-3 flex items-center justify-between">
        <Button type="button" variant="ghost" size="icon" className="size-8 rounded-lg" onClick={() => changeMonth(-1)}>
          <ChevronLeft className="size-4" />
          <span className="sr-only">Previous month</span>
        </Button>

        <div className="flex items-center gap-2">
          <select
            value={activeMonth.getMonth()}
            onChange={(event) => {
              const monthIndex = Number(event.target.value);
              const next = new Date(activeYear, monthIndex, 1);
              if (onMonthChange) {
                onMonthChange(next);
                return;
              }
              setInternalMonth(next);
            }}
            className="h-8 rounded-md border border-border/70 bg-background/70 px-2 text-xs"
          >
            {MONTH_LABELS.map((label, index) => (
              <option key={label} value={index}>
                {label}
              </option>
            ))}
          </select>

          <select
            value={activeYear}
            onChange={(event) => {
              const year = Number(event.target.value);
              const next = new Date(year, activeMonth.getMonth(), 1);
              if (onMonthChange) {
                onMonthChange(next);
                return;
              }
              setInternalMonth(next);
            }}
            className="h-8 rounded-md border border-border/70 bg-background/70 px-2 text-xs"
          >
            {yearOptions.map((yearValue) => (
              <option key={yearValue} value={yearValue}>
                {yearValue}
              </option>
            ))}
          </select>
        </div>

        <Button type="button" variant="ghost" size="icon" className="size-8 rounded-lg" onClick={() => changeMonth(1)}>
          <ChevronRight className="size-4" />
          <span className="sr-only">Next month</span>
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="pb-1 text-center text-[11px] font-medium text-muted-foreground">
            {label}
          </div>
        ))}

        {cells.map((cell, index) => {
          if (!cell) {
            return <div key={`empty-${index}`} className="h-8" />;
          }

          const active = selected ? isSameDate(cell, selected) : false;

          return (
            <button
              key={`${cell.toISOString()}-${index}`}
              type="button"
              onClick={() => onSelect?.(cell)}
              className={cn(
                "h-8 rounded-md text-sm transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-muted"
              )}
            >
              {cell.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
