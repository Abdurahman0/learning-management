"use client";

import {useEffect, useMemo, useState} from "react";
import {CalendarDays, ChevronLeft, ChevronRight, X} from "lucide-react";
import {useLocale, useTranslations} from "next-intl";
import {useRouter, useSearchParams} from "next/navigation";

import {Button} from "@/components/ui/button";
import {Card} from "@/components/ui/card";
import {Label} from "@/components/ui/label";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {cn} from "@/lib/utils";
import {BrandIcon} from "@/components/brand/BrandIcon";
import {
  DEFAULT_TARGETS,
  type OnboardingAnswers,
  type OnboardingModule,
  readOnboardingState,
  seedOnboardingPending,
  setOnboardingStatus
} from "@/lib/onboarding-storage";

type StepKey = "examDate" | "targets" | "strongest" | "weakest" | "hours";

const MODULES: Array<{key: OnboardingModule; label: string}> = [
  {key: "listening", label: "Listening"},
  {key: "reading", label: "Reading"},
  {key: "writing", label: "Writing"},
  {key: "speaking", label: "Speaking"}
];

function toIsoDate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getMonthMatrix(view: Date) {
  const year = view.getFullYear();
  const month = view.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startDay = firstOfMonth.getDay(); // 0..6 (Sun..Sat)
  const start = new Date(year, month, 1 - startDay);
  const weeks: Date[][] = [];

  for (let w = 0; w < 6; w += 1) {
    const row: Date[] = [];
    for (let d = 0; d < 7; d += 1) {
      row.push(new Date(start.getFullYear(), start.getMonth(), start.getDate() + w * 7 + d));
    }
    weeks.push(row);
  }

  return {weeks, year, month};
}

function BandSelect({
  value,
  onChange,
  ariaLabel
}: {
  value: number;
  onChange: (value: number) => void;
  ariaLabel: string;
}) {
  const options = useMemo(() => {
    const result: number[] = [];
    for (let v = 0; v <= 9; v += 0.5) result.push(Number(v.toFixed(1)));
    return result;
  }, []);

  return (
    <Select value={String(value)} onValueChange={(next) => onChange(Number(next))}>
      <SelectTrigger className="h-11 rounded-xl border-border/70 bg-background/60" aria-label={ariaLabel}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="max-h-72">
        {options.map((opt) => (
          <SelectItem key={opt} value={String(opt)}>
            {opt.toFixed(1)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function HandmadeDatePicker({
  value,
  onChange,
  label,
  labels
}: {
  value?: string;
  onChange: (iso?: string) => void;
  label: string;
  labels: {
    prevMonth: string;
    nextMonth: string;
    clear: string;
    today: string;
  };
}) {
  const locale = useLocale();
  const selectedDate = value ? new Date(`${value}T00:00:00`) : null;
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<Date>(() => (selectedDate && !Number.isNaN(selectedDate.getTime()) ? selectedDate : new Date()));

  const formatDateLabel = (iso?: string) => {
    if (!iso) return "";
    const date = new Date(`${iso}T00:00:00`);
    if (Number.isNaN(date.getTime())) return iso;
    return new Intl.DateTimeFormat(locale, {month: "short", day: "2-digit", year: "numeric"}).format(date);
  };

  useEffect(() => {
    if (!open) return;
    if (selectedDate && !Number.isNaN(selectedDate.getTime())) {
      setView(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
    }
  }, [open]); // intentionally not depending on selectedDate to avoid jitter while selecting

  const {weeks, year, month} = useMemo(() => getMonthMatrix(view), [view]);
  const monthLabel = useMemo(
    () => new Intl.DateTimeFormat(locale, {month: "long", year: "numeric"}).format(new Date(year, month, 1)),
    [locale, month, year]
  );
  const weekdayLabels = useMemo(() => {
    // We render weeks Sunday -> Saturday, so build labels in that order.
    const baseSunday = new Date(2023, 0, 1); // 2023-01-01 is a Sunday
    const fmt = new Intl.DateTimeFormat(locale, {weekday: "narrow"});
    return Array.from({length: 7}, (_, i) => fmt.format(new Date(baseSunday.getFullYear(), baseSunday.getMonth(), baseSunday.getDate() + i)));
  }, [locale]);
  const todayIso = toIsoDate(new Date());
  const selectedIso = value;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-11 w-full items-center justify-between rounded-xl border border-border/70 bg-background/60 px-3 text-left text-sm",
            value ? "text-foreground" : "text-muted-foreground"
          )}
          aria-label={label}
        >
          <span className="truncate">{value ? formatDateLabel(value) : label}</span>
          <CalendarDays className="size-4 opacity-70" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[322px] rounded-2xl border-border/70 bg-background p-0">
        <div className="border-b border-border/70 p-3">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              className="inline-flex size-9 items-center justify-center rounded-xl border border-border/70 hover:bg-muted"
              onClick={() => setView((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
              aria-label={labels.prevMonth}
            >
              <ChevronLeft className="size-4" />
            </button>
            <p className="text-sm font-semibold">{monthLabel}</p>
            <button
              type="button"
              className="inline-flex size-9 items-center justify-center rounded-xl border border-border/70 hover:bg-muted"
              onClick={() => setView((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
              aria-label={labels.nextMonth}
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
          <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-muted-foreground">
            {weekdayLabels.map((d) => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>
        </div>
        <div className="p-3">
          <div className="grid grid-cols-7 gap-1">
            {weeks.flat().map((date) => {
              const iso = toIsoDate(date);
              const inMonth = date.getMonth() === month;
              const isSelected = selectedIso === iso;
              const isToday = todayIso === iso;
              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => {
                    onChange(iso);
                    setOpen(false);
                  }}
                  className={cn(
                    "h-9 rounded-xl text-sm transition-colors",
                    inMonth ? "text-foreground" : "text-muted-foreground/60",
                    isSelected ? "bg-blue-600 text-white hover:bg-blue-600/90" : "hover:bg-muted",
                    !isSelected && isToday ? "ring-1 ring-blue-500/50" : ""
                  )}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="ghost"
              className="h-9 rounded-xl"
              onClick={() => {
                onChange(undefined);
                setOpen(false);
              }}
            >
              {labels.clear}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-9 rounded-xl border-border/70"
              onClick={() => {
                const now = new Date();
                onChange(toIsoDate(now));
                setOpen(false);
              }}
            >
              {labels.today}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function OnboardingWizard() {
  const t = useTranslations("auth.onboarding");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnToParam = (searchParams.get("returnTo") ?? "").trim();
  const returnTo = returnToParam.startsWith("/") && !returnToParam.startsWith("//") ? returnToParam : "";

  const [stepIndex, setStepIndex] = useState(0);
  const steps: Array<{key: StepKey; title: string; subtitle: string}> = useMemo(
    () => [
      {key: "examDate", title: t("steps.examDate.title"), subtitle: t("steps.examDate.subtitle")},
      {key: "targets", title: t("steps.targets.title"), subtitle: t("steps.targets.subtitle")},
      {key: "strongest", title: t("steps.strongest.title"), subtitle: t("steps.strongest.subtitle")},
      {key: "weakest", title: t("steps.weakest.title"), subtitle: t("steps.weakest.subtitle")},
      {key: "hours", title: t("steps.hours.title"), subtitle: t("steps.hours.subtitle")}
    ],
    [t]
  );

  const [answers, setAnswers] = useState<OnboardingAnswers>({
    targets: DEFAULT_TARGETS
  });

  useEffect(() => {
    // When users existed before onboarding was introduced, we still want this page to work.
    // Seed a pending state and then read it back.
    seedOnboardingPending();
    const state = readOnboardingState();
    if (state) {
      setAnswers(state.answers);
    }
  }, []);

  const activeStep = steps[stepIndex];

  const canGoBack = stepIndex > 0;
  const canGoNext = stepIndex < steps.length - 1;

  const closeAndPersist = (status: "skipped" | "completed") => {
    setOnboardingStatus(status, answers);
    router.replace(`/${locale}${returnTo || "/dashboard"}`);
  };

  return (
    <div className="mx-auto w-full max-w-[1040px] py-4 sm:py-8">
      <div className="relative mb-6 overflow-hidden rounded-3xl border border-border/70 bg-linear-to-br from-blue-600/12 via-card/70 to-card/60 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
        <div className="pointer-events-none absolute -top-24 -right-28 h-72 w-72 rounded-full bg-blue-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 -left-28 h-80 w-80 rounded-full bg-indigo-500/15 blur-3xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <BrandIcon size={36} className="shadow-none" />
            <div className="min-w-0">
              <p className="truncate text-base font-semibold tracking-tight">{t("title")}</p>
              <p className="truncate text-sm text-muted-foreground">{t("subtitle")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-border/70 bg-background/60 px-3 py-1 text-xs text-muted-foreground">
              {t("progress", {current: stepIndex + 1, total: steps.length})}
            </span>
            <Button
              type="button"
              variant="outline"
              className="h-10 cursor-pointer rounded-xl border-border/70"
              onClick={() => closeAndPersist("skipped")}
            >
              {t("actions.skip")}
            </Button>
          </div>
        </div>
      </div>

      <Card className="w-full overflow-hidden rounded-3xl border-border/70 bg-card/95 shadow-xl shadow-slate-950/10 animate-in fade-in duration-300">
        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr]">
          <div className="relative hidden border-b border-border/70 bg-linear-to-b from-blue-500/10 via-card/70 to-card/60 p-5 md:block md:border-b-0 md:border-r">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <BrandIcon size={40} />
                <div>
                  <p className="text-sm font-semibold">{t("title")}</p>
                  <p className="text-xs text-muted-foreground">{t("subtitle")}</p>
                </div>
              </div>
              <button
                type="button"
                className="inline-flex size-10 cursor-pointer items-center justify-center rounded-2xl border border-border/70 hover:bg-muted"
                onClick={() => closeAndPersist("skipped")}
                aria-label={t("actions.skip")}
                title={t("actions.skip")}
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-6 space-y-2">
              {steps.map((step, index) => {
                const active = index === stepIndex;
                const done = index < stepIndex;
                return (
                  <button
                    key={step.key}
                    type="button"
                    onClick={() => setStepIndex(index)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition-colors",
                      active
                        ? "border-blue-500/40 bg-blue-500/10"
                        : "border-border/60 hover:bg-muted"
                    )}
                  >
                    <span
                      className={cn(
                        "inline-flex size-8 shrink-0 items-center justify-center rounded-xl text-xs font-semibold",
                        done
                          ? "bg-emerald-500/15 text-emerald-500"
                          : active
                            ? "bg-blue-600 text-white"
                            : "bg-muted text-muted-foreground"
                      )}
                    >
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className={cn("truncate text-sm font-medium", active ? "text-foreground" : "text-muted-foreground")}>
                        {step.title}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{step.subtitle}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 rounded-2xl border border-border/60 bg-background/50 p-3">
              <p className="text-xs text-muted-foreground">{t("hint")}</p>
            </div>
          </div>

          <div className="p-5 sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-2xl font-semibold tracking-tight">{activeStep.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{activeStep.subtitle}</p>
              </div>
            </div>

            <div className="mt-6">
              {activeStep.key === "examDate" ? (
                <div className="space-y-2">
                  <Label>{t("fields.examDate.label")}</Label>
                  <HandmadeDatePicker
                    value={answers.examDate}
                    onChange={(iso) => setAnswers((prev) => ({...prev, examDate: iso}))}
                    label={t("fields.examDate.placeholder")}
                    labels={{
                      prevMonth: t("datePicker.prevMonth"),
                      nextMonth: t("datePicker.nextMonth"),
                      clear: t("datePicker.clear"),
                      today: t("datePicker.today")
                    }}
                  />
                  <p className="text-xs text-muted-foreground">{t("fields.examDate.help")}</p>
                </div>
              ) : null}

              {activeStep.key === "targets" ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">{t("fields.targets.help")}</p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {MODULES.map((mod) => (
                      <div key={mod.key} className="rounded-2xl border border-border/70 bg-background/50 p-4">
                        <p className="text-sm font-semibold">{t(`modules.${mod.key}` as const)}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{t("fields.targets.bandHint")}</p>
                        <div className="mt-3">
                          <BandSelect
                            value={answers.targets[mod.key] ?? DEFAULT_TARGETS[mod.key]}
                            onChange={(value) =>
                              setAnswers((prev) => ({
                                ...prev,
                                targets: {...prev.targets, [mod.key]: value}
                              }))
                            }
                            ariaLabel={`${mod.label} target band`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {activeStep.key === "strongest" ? (
                <div className="space-y-2">
                  <Label>{t("fields.strongest.label")}</Label>
                  <Select
                    value={answers.strongest ?? ""}
                    onValueChange={(value) => setAnswers((prev) => ({...prev, strongest: value as OnboardingModule}))}
                  >
                    <SelectTrigger className="h-11 rounded-xl border-border/70 bg-background/60">
                      <SelectValue placeholder={t("fields.strongest.placeholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      {MODULES.map((mod) => (
                        <SelectItem key={mod.key} value={mod.key}>
                          {t(`modules.${mod.key}` as const)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}

              {activeStep.key === "weakest" ? (
                <div className="space-y-2">
                  <Label>{t("fields.weakest.label")}</Label>
                  <Select
                    value={answers.weakest ?? ""}
                    onValueChange={(value) => setAnswers((prev) => ({...prev, weakest: value as OnboardingModule}))}
                  >
                    <SelectTrigger className="h-11 rounded-xl border-border/70 bg-background/60">
                      <SelectValue placeholder={t("fields.weakest.placeholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      {MODULES.map((mod) => (
                        <SelectItem key={mod.key} value={mod.key}>
                          {t(`modules.${mod.key}` as const)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}

              {activeStep.key === "hours" ? (
                <div className="space-y-4">
                  <div className="rounded-3xl border border-border/70 bg-background/50 p-4">
                    <div className="flex items-baseline justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">{t("fields.hours.label")}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{t("fields.hours.help")}</p>
                      </div>
                      <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-right">
                        <p className="text-xl font-semibold text-blue-600 dark:text-blue-300">
                          {(answers.hoursPerDay ?? 2).toFixed(1)}
                        </p>
                        <p className="text-[11px] text-muted-foreground">{t("fields.hours.unit")}</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <input
                        type="range"
                        min={0}
                        max={8}
                        step={0.5}
                        value={answers.hoursPerDay ?? 2}
                        onChange={(event) => setAnswers((prev) => ({...prev, hoursPerDay: Number(event.target.value)}))}
                        className="w-full accent-blue-600"
                        aria-label={t("fields.hours.label")}
                      />
                      <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
                        <span>0h</span>
                        <span>2h</span>
                        <span>4h</span>
                        <span>6h</span>
                        <span>8h</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 rounded-xl border-border/70"
                  disabled={!canGoBack}
                  onClick={() => setStepIndex((current) => Math.max(0, current - 1))}
                >
                  {t("actions.back")}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-11 rounded-xl"
                  onClick={() => closeAndPersist("skipped")}
                >
                  {t("actions.skip")}
                </Button>
              </div>

              {canGoNext ? (
                <Button
                  type="button"
                  className="h-11 rounded-xl bg-blue-600 px-6 text-base font-semibold text-white hover:bg-blue-600/90"
                  onClick={() => setStepIndex((current) => Math.min(steps.length - 1, current + 1))}
                >
                  {t("actions.next")}
                </Button>
              ) : (
                <Button
                  type="button"
                  className="h-11 rounded-xl bg-blue-600 px-6 text-base font-semibold text-white hover:bg-blue-600/90"
                  onClick={() => closeAndPersist("completed")}
                >
                  {t("actions.finish")}
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
