"use client";

import {useEffect, useMemo, useState} from "react";
import {CalendarDays, Check, ChevronLeft, ChevronRight, X} from "lucide-react";
import {useLocale, useTranslations} from "next-intl";
import {useRouter, useSearchParams} from "next/navigation";

import {Button} from "@/components/ui/button";
import {Card} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {cn} from "@/lib/utils";
import {BrandIcon} from "@/components/brand/BrandIcon";
import {studentProfileService} from "@/src/services/student/profile.service";
import {StudentApiError} from "@/src/services/student/types";
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

const BACKEND_SECTIONS = ["LISTENING", "READING", "WRITING", "SPEAKING"] as const;
type BackendSection = (typeof BACKEND_SECTIONS)[number];

function toIsoDate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function toIsoTime(date: Date) {
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function toBackendSection(value?: OnboardingModule): BackendSection | null {
  if (!value) return null;
  const upper = value.toUpperCase();
  return (BACKEND_SECTIONS as readonly string[]).includes(upper) ? (upper as BackendSection) : null;
}

function fromBackendSection(value?: string | null): OnboardingModule | undefined {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (normalized === "listening") return "listening";
  if (normalized === "reading") return "reading";
  if (normalized === "writing") return "writing";
  if (normalized === "speaking") return "speaking";
  return undefined;
}

function toBandString(value: number) {
  // Backend accepts string values and validates half-band steps.
  return Number(value).toFixed(1);
}

function buildExamDateTimeIso(dateIso?: string, timeIso?: string) {
  if (!dateIso) return null;
  const [y, m, d] = dateIso.split("-").map((item) => Number(item));
  if (!y || !m || !d) return null;

  const [hhRaw, mmRaw] = String(timeIso || "09:00").split(":");
  const hh = Number(hhRaw);
  const mm = Number(mmRaw);
  const safeH = Number.isFinite(hh) ? Math.min(23, Math.max(0, hh)) : 9;
  const safeM = Number.isFinite(mm) ? Math.min(59, Math.max(0, mm)) : 0;

  // Interpret as local time and send ISO-8601 in UTC.
  return new Date(y, m - 1, d, safeH, safeM, 0).toISOString();
}

function normalizeUzbekPhoneNumber(value?: string) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const normalized = `+${raw.replace(/[^\d]/g, "")}`;
  return normalized === "+" ? null : normalized;
}

function isValidUzbekPhoneNumber(value?: string) {
  const normalized = normalizeUzbekPhoneNumber(value);
  return normalized == null || /^\+998\d{9}$/.test(normalized);
}

function getTomorrowIso() {
  const now = new Date();
  return toIsoDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1));
}

function clampExamDateToTomorrow(iso?: string) {
  const value = typeof iso === "string" ? iso.trim() : "";
  if (!value) return undefined;
  // YYYY-MM-DD string compare works lexicographically.
  return value >= getTomorrowIso() ? value : undefined;
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
  const minSelectableIso = useMemo(() => getTomorrowIso(), []);
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
              const isDisabled = iso < minSelectableIso;
              return (
                <button
                  key={iso}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => {
                    if (isDisabled) return;
                    onChange(iso);
                    setOpen(false);
                  }}
                  className={cn(
                    "h-9 rounded-xl text-sm transition-colors",
                    inMonth ? "text-foreground" : "text-muted-foreground/60",
                    isSelected ? "bg-blue-600 text-white hover:bg-blue-600/90" : "hover:bg-muted",
                    !isSelected && isToday ? "ring-1 ring-blue-500/50" : "",
                    isDisabled ? "cursor-not-allowed opacity-35 hover:bg-transparent" : ""
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
                // Minimum is tomorrow (exam date cannot be today or in the past).
                onChange(minSelectableIso);
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
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
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
    if (state)
      setAnswers((prev) => ({
        ...prev,
        ...state.answers,
        examDate: clampExamDateToTomorrow(state.answers.examDate) ?? prev.examDate,
        targets: {...DEFAULT_TARGETS, ...state.answers.targets}
      }));

    let active = true;
    setIsLoadingProfile(true);
    setApiError(null);

    studentProfileService
      .getProfile()
      .then((profile) => {
        if (!active) return;

        const nextExamDate = profile.exam_datetime ? toIsoDate(new Date(profile.exam_datetime)) : undefined;
        const nextExamTime = profile.exam_datetime ? toIsoTime(new Date(profile.exam_datetime)) : undefined;

        setAnswers((prev) => ({
          ...prev,
          examDate: clampExamDateToTomorrow(nextExamDate) ?? clampExamDateToTomorrow(prev.examDate),
          examTime: nextExamTime ?? prev.examTime,
          phoneNumber: profile.phone_number ?? prev.phoneNumber,
          targets: {
            listening: profile.target_listening_band ?? prev.targets.listening ?? DEFAULT_TARGETS.listening,
            reading: profile.target_reading_band ?? prev.targets.reading ?? DEFAULT_TARGETS.reading,
            writing: profile.target_writing_band ?? prev.targets.writing ?? DEFAULT_TARGETS.writing,
            speaking: profile.target_speaking_band ?? prev.targets.speaking ?? DEFAULT_TARGETS.speaking
          },
          strongest: fromBackendSection(profile.strongest_section ?? undefined) ?? prev.strongest,
          weakest: fromBackendSection(profile.weakest_section ?? undefined) ?? prev.weakest,
          hoursPerDay: typeof profile.study_hours_available === "number" ? profile.study_hours_available : prev.hoursPerDay
        }));
      })
      .catch((error) => {
        if (!active) return;
        const message = error instanceof StudentApiError ? error.message : t("errors.profileLoad");
        setApiError(message);
      })
      .finally(() => {
        if (!active) return;
        setIsLoadingProfile(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const activeStep = steps[stepIndex];

  const canGoBack = stepIndex > 0;
  const canGoNext = stepIndex < steps.length - 1;

  const closeAndPersist = (status: "skipped" | "completed") => {
    setOnboardingStatus(status, answers);
    router.replace(`/${locale}${returnTo || "/dashboard"}`);
  };

  const progressPercent = steps.length > 0 ? Math.round(((stepIndex + 1) / steps.length) * 100) : 0;

  const selectModule = (key: "strongest" | "weakest", value: OnboardingModule) => {
    setAnswers((prev) => ({...prev, [key]: value}));
  };

  const submitAnswers = async () => {
    const normalizedPhoneNumber = normalizeUzbekPhoneNumber(answers.phoneNumber);
    if (!isValidUzbekPhoneNumber(answers.phoneNumber)) {
      setApiError(t("errors.phoneNumber"));
      return;
    }

    const payload = {
      phone_number: normalizedPhoneNumber,
      exam_datetime: buildExamDateTimeIso(answers.examDate, answers.examTime),
      target_listening_band: toBandString(answers.targets.listening ?? DEFAULT_TARGETS.listening),
      target_reading_band: toBandString(answers.targets.reading ?? DEFAULT_TARGETS.reading),
      target_writing_band: toBandString(answers.targets.writing ?? DEFAULT_TARGETS.writing),
      target_speaking_band: toBandString(answers.targets.speaking ?? DEFAULT_TARGETS.speaking),
      strongest_section: toBackendSection(answers.strongest),
      weakest_section: toBackendSection(answers.weakest),
      study_hours_available: typeof answers.hoursPerDay === "number" ? Math.round(answers.hoursPerDay) : null
    } as const;

    try {
      await studentProfileService.updateProfile(payload);
      closeAndPersist("completed");
    } catch (error) {
      if (error instanceof StudentApiError) {
        const phoneNumberError = error.fieldErrors.phone_number?.[0];
        setApiError(phoneNumberError ?? error.message);
        return;
      }
      setApiError(t("errors.profileSave"));
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1100px] py-4 sm:py-8">
      <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-linear-to-br from-blue-600/10 via-card/70 to-card/60 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] animate-in fade-in duration-500">
        <div className="pointer-events-none absolute -top-28 -right-36 h-80 w-80 rounded-full bg-blue-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 -left-36 h-96 w-96 rounded-full bg-indigo-500/15 blur-3xl" />

        <header className="relative flex items-center justify-between gap-3">
          <button
            type="button"
            disabled={!canGoBack}
            onClick={() => setStepIndex((current) => Math.max(0, current - 1))}
            className={cn(
              "inline-flex size-11 items-center justify-center rounded-2xl border border-border/70 bg-background/50 text-foreground transition",
              canGoBack ? "cursor-pointer hover:bg-muted/40" : "cursor-not-allowed opacity-50"
            )}
            aria-label={t("actions.back")}
            title={t("actions.back")}
          >
            <ChevronLeft className="size-5" />
          </button>

          <div className="flex min-w-0 flex-1 flex-col items-center gap-3">
            <div className="flex items-center gap-3">
              <BrandIcon size={36} className="shadow-none" />
              <div className="min-w-0 text-center">
                <p className="truncate text-sm font-semibold tracking-tight text-foreground">{t("title")}</p>
                <p className="truncate text-xs text-muted-foreground">{t("progress", {current: stepIndex + 1, total: steps.length})}</p>
              </div>
            </div>

            <div className="relative w-full max-w-[760px]">
              <div className="h-3 w-full overflow-hidden rounded-full bg-muted/35">
                <div
                  className="h-full rounded-full bg-linear-to-r from-blue-600 via-indigo-500 to-violet-500 transition-[width] duration-700"
                  style={{width: `${progressPercent}%`}}
                />
              </div>
              <div
                className="absolute -top-4 transition-[left] duration-700"
                style={{left: `calc(${progressPercent}% - 18px)`}}
                aria-hidden="true"
              >
                <span className="inline-flex size-9 items-center justify-center rounded-2xl border border-border/70 bg-background/80 shadow-sm shadow-slate-950/5">
                  <BrandIcon size={22} />
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-2xl border border-border/70 bg-background/50 px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/25 disabled:opacity-60"
            disabled={isSaving}
            onClick={() => closeAndPersist("skipped")}
          >
            <X className="size-4" />
            {t("actions.skip")}
          </button>
        </header>

        <main className="relative mt-8 grid gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-center">
          <div className="flex flex-col items-center justify-center gap-5 text-center">
            <div className="rounded-3xl border border-border/70 bg-background/55 p-4 shadow-sm shadow-slate-950/5 animate-in fade-in zoom-in-95 duration-500">
              <BrandIcon size={72} className="shadow-none" />
            </div>

            <div className="relative w-full max-w-[520px] rounded-3xl border border-blue-500/35 bg-blue-500/10 px-5 py-4 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="pointer-events-none absolute -left-2 top-8 size-4 rotate-45 border-l border-b border-blue-500/35 bg-blue-500/10" />
              <p className="text-base font-semibold tracking-tight text-foreground sm:text-lg">{activeStep.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{activeStep.subtitle}</p>
            </div>

            <p className="max-w-[520px] text-xs text-muted-foreground">{t("hint")}</p>
          </div>

          <Card className="w-full overflow-hidden rounded-3xl border-border/70 bg-card/95 shadow-xl shadow-slate-950/10 animate-in fade-in duration-500">
            <div className="p-5 sm:p-7">
              {apiError ? (
                <div className="mb-4 rounded-2xl border border-rose-400/35 bg-rose-500/10 p-3 text-sm text-rose-700 dark:text-rose-200">
                  {apiError}
                </div>
              ) : null}

              {isLoadingProfile ? (
                <div className="mb-4 rounded-2xl border border-border/70 bg-background/50 p-3 text-sm text-muted-foreground">
                  {t("loading.profile")}
                </div>
              ) : null}

              {activeStep.key === "examDate" ? (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>{t("fields.phoneNumber.label")}</Label>
                    <Input
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      value={answers.phoneNumber ?? ""}
                      onChange={(event) => setAnswers((prev) => ({...prev, phoneNumber: event.target.value}))}
                      placeholder={t("fields.phoneNumber.placeholder")}
                      className="h-11 rounded-xl border-border/70 bg-background/60"
                    />
                    <p className="text-xs text-muted-foreground">{t("fields.phoneNumber.help")}</p>
                  </div>

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
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">{t("fields.examDate.timeLabel")}</Label>
                      <Select
                        value={answers.examTime ?? "09:00"}
                        onValueChange={(value) => setAnswers((prev) => ({...prev, examTime: value}))}
                      >
                        <SelectTrigger className="h-11 rounded-xl border-border/70 bg-background/60">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-72">
                          {Array.from({length: 48}, (_, index) => index).map((slot) => {
                            const minutes = slot * 30;
                            const h = Math.floor(minutes / 60);
                            const m = minutes % 60;
                            const value = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
                            return (
                              <SelectItem key={value} value={value}>
                                {value}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">{t("fields.examDate.timeZoneLabel")}</Label>
                      <div className="flex h-11 items-center rounded-xl border border-border/70 bg-background/50 px-3 text-sm text-muted-foreground">
                        {t("fields.examDate.timeZoneValue")}
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">{t("fields.examDate.help")}</p>
                </div>
              ) : null}

              {activeStep.key === "targets" ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">{t("fields.targets.help")}</p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {MODULES.map((mod) => (
                      <div
                        key={mod.key}
                        className="rounded-2xl border border-border/70 bg-background/50 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                      >
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
                <div className="space-y-3">
                  <Label className="text-sm">{t("fields.strongest.label")}</Label>
                  <div className="grid grid-cols-1 gap-3">
                    {MODULES.map((mod) => {
                      const selected = answers.strongest === mod.key;
                      return (
                        <button
                          key={mod.key}
                          type="button"
                          disabled={isSaving}
                          onClick={() => selectModule("strongest", mod.key)}
                          className={cn(
                            "flex h-12 items-center justify-between rounded-2xl border px-4 text-left text-sm font-semibold transition disabled:opacity-60",
                            selected
                              ? "border-blue-500/55 bg-linear-to-r from-blue-600/14 via-blue-500/10 to-indigo-500/10 text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                              : "border-border/70 bg-background/50 hover:bg-muted/35"
                          )}
                        >
                          <span>{t(`modules.${mod.key}` as const)}</span>
                          {selected ? <Check className="size-4 text-blue-500" /> : <ChevronRight className="size-4 text-muted-foreground" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {activeStep.key === "weakest" ? (
                <div className="space-y-3">
                  <Label className="text-sm">{t("fields.weakest.label")}</Label>
                  <div className="grid grid-cols-1 gap-3">
                    {MODULES.map((mod) => {
                      const selected = answers.weakest === mod.key;
                      return (
                        <button
                          key={mod.key}
                          type="button"
                          disabled={isSaving}
                          onClick={() => selectModule("weakest", mod.key)}
                          className={cn(
                            "flex h-12 items-center justify-between rounded-2xl border px-4 text-left text-sm font-semibold transition disabled:opacity-60",
                            selected
                              ? "border-blue-500/55 bg-linear-to-r from-blue-600/14 via-blue-500/10 to-indigo-500/10 text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                              : "border-border/70 bg-background/50 hover:bg-muted/35"
                          )}
                        >
                          <span>{t(`modules.${mod.key}` as const)}</span>
                          {selected ? <Check className="size-4 text-blue-500" /> : <ChevronRight className="size-4 text-muted-foreground" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {activeStep.key === "hours" ? (
                <div className="space-y-4">
                  <div className="rounded-3xl border border-border/70 bg-background/50 p-5 text-center">
                    <p className="text-sm font-semibold tracking-tight">{t("fields.hours.label")}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{t("fields.hours.help")}</p>

                    <div className="mt-5 flex items-center justify-center">
                      <div className="relative rounded-3xl border border-border/70 bg-background/80 px-6 py-4 shadow-sm shadow-slate-950/5">
                        <div className="pointer-events-none absolute -bottom-2 left-1/2 size-4 -translate-x-1/2 rotate-45 border-r border-b border-border/70 bg-background/80" />
                        <p className="text-4xl font-semibold tracking-tight text-foreground">
                          {Math.round(answers.hoursPerDay ?? 2)}
                          <span className="ml-2 text-base font-medium text-muted-foreground">{t("fields.hours.unit")}</span>
                        </p>
                      </div>
                    </div>

                    <div className="mt-6">
                      <input
                        type="range"
                        min={0}
                        max={8}
                        step={1}
                        value={Math.round(answers.hoursPerDay ?? 2)}
                        onChange={(event) => setAnswers((prev) => ({...prev, hoursPerDay: Number(event.target.value)}))}
                        className="w-full accent-blue-600"
                        aria-label={t("fields.hours.label")}
                      />
                      <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
                        <span>0</span>
                        <span>2</span>
                        <span>4</span>
                        <span>6</span>
                        <span>8</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="mt-7 flex items-center justify-center">
                {canGoNext ? (
                  <Button
                    type="button"
                    className="h-12 w-full max-w-[360px] rounded-2xl bg-blue-600 px-8 text-base font-semibold text-white shadow-sm shadow-blue-950/10 hover:bg-blue-600/90"
                    onClick={() => setStepIndex((current) => Math.min(steps.length - 1, current + 1))}
                    disabled={isSaving}
                  >
                    {stepIndex === 0 && t.has("actions.letsGo") ? t("actions.letsGo") : t("actions.next")}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    className="h-12 w-full max-w-[360px] rounded-2xl bg-blue-600 px-8 text-base font-semibold text-white shadow-sm shadow-blue-950/10 hover:bg-blue-600/90"
                    disabled={isSaving}
                    onClick={async () => {
                      if (isSaving) return;
                      setIsSaving(true);
                      setApiError(null);
                      try {
                        await submitAnswers();
                      } finally {
                        setIsSaving(false);
                      }
                    }}
                  >
                    {isSaving ? t("loading.saving") : t("actions.finish")}
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </main>
      </div>
    </div>
  );

  /*
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
              disabled={isSaving}
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
              {apiError ? (
                <div className="mb-4 rounded-2xl border border-rose-400/35 bg-rose-500/10 p-3 text-sm text-rose-700 dark:text-rose-200">
                  {apiError}
                </div>
              ) : null}

              {isLoadingProfile ? (
                <div className="mb-4 rounded-2xl border border-border/70 bg-background/50 p-3 text-sm text-muted-foreground">
                  {t("loading.profile")}
                </div>
              ) : null}

              {activeStep.key === "examDate" ? (
                <div className="space-y-2">
                  <div className="space-y-2">
                    <Label>{t("fields.phoneNumber.label")}</Label>
                    <Input
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      value={answers.phoneNumber ?? ""}
                      onChange={(event) => setAnswers((prev) => ({...prev, phoneNumber: event.target.value}))}
                      placeholder={t("fields.phoneNumber.placeholder")}
                      className="h-11 rounded-xl border-border/70 bg-background/60"
                    />
                    <p className="text-xs text-muted-foreground">{t("fields.phoneNumber.help")}</p>
                  </div>

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
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">{t("fields.examDate.timeLabel")}</Label>
                      <Select
                        value={answers.examTime ?? "09:00"}
                        onValueChange={(value) => setAnswers((prev) => ({...prev, examTime: value}))}
                      >
                        <SelectTrigger className="h-11 rounded-xl border-border/70 bg-background/60">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-72">
                          {Array.from({length: 48}, (_, index) => index).map((slot) => {
                            const minutes = slot * 30;
                            const h = Math.floor(minutes / 60);
                            const m = minutes % 60;
                            const value = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
                            return (
                              <SelectItem key={value} value={value}>
                                {value}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">{t("fields.examDate.timeZoneLabel")}</Label>
                      <div className="flex h-11 items-center rounded-xl border border-border/70 bg-background/50 px-3 text-sm text-muted-foreground">
                        {t("fields.examDate.timeZoneValue")}
                      </div>
                    </div>
                  </div>
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
                          {Math.round(answers.hoursPerDay ?? 2)}
                        </p>
                        <p className="text-[11px] text-muted-foreground">{t("fields.hours.unit")}</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <input
                        type="range"
                        min={0}
                        max={8}
                        step={1}
                        value={Math.round(answers.hoursPerDay ?? 2)}
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
                  disabled={isSaving}
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
                  disabled={isSaving}
                >
                  {t("actions.next")}
                </Button>
              ) : (
                <Button
                  type="button"
                  className="h-11 rounded-xl bg-blue-600 px-6 text-base font-semibold text-white hover:bg-blue-600/90"
                  disabled={isSaving}
                  onClick={async () => {
                    if (isSaving) return;
                    setIsSaving(true);
                    setApiError(null);
                    try {
                      await submitAnswers();
                    } finally {
                      setIsSaving(false);
                    }
                  }}
                >
                  {isSaving ? t("loading.saving") : t("actions.finish")}
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
  */
}
