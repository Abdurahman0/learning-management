"use client";

import Link from "next/link";
import {
  BookOpen,
  CheckCircle2,
  ExternalLink,
  Headphones,
  Lock,
  PlayCircle,
  X
} from "lucide-react";
import {useEffect, useMemo, useRef, useState, type ReactNode} from "react";
import {useLocale, useTranslations} from "next-intl";

import {AnimatedNumber} from "@/components/ui/animated-number";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card";
import {Progress} from "@/components/ui/progress";
import {Separator} from "@/components/ui/separator";
import {cn} from "@/lib/utils";
import {studentMarathonService} from "@/src/services/student/marathon.service";
import type {
  StudentMarathonAttempt,
  StudentMarathonAttemptResult,
  StudentMarathonDayContentItem,
  StudentMarathonDayDetail,
  StudentMarathonDaySummary,
  StudentMarathonDetail,
  StudentMarathonLeaderboardEntry,
  StudentMarathonListeningDayItem
} from "@/src/services/student/marathon.types";
import {StudentApiError} from "@/src/services/student/types";

type MarathonDetailClientProps = {
  marathonId: string;
};

type Notice = {
  tone: "info" | "success" | "error";
  text: string;
};

type AttemptPreview =
  | {type: "attempt"; payload: StudentMarathonAttempt}
  | {type: "review"; payload: StudentMarathonAttemptResult};

const JOURNEY_ROW_HEIGHT = 146;
const JOURNEY_SVG_WIDTH = 136;
const JOURNEY_CENTER_X = 68;
const JOURNEY_LEFT_X = 22;
const JOURNEY_RIGHT_X = 136;
const JOURNEY_RENDER_WIDTH = 220;
const JOURNEY_NODE_CENTER_Y = 48;
const JOURNEY_NODE_RADIUS = 28;
const JOURNEY_NODE_X_SHIFT = 26;
const JOURNEY_NODE_Y_SHIFT = -38;
const JOURNEY_TITLE_Y_SHIFT = -32;
const JOURNEY_TITLE_X_SHIFT = 14;

function getJourneyAnchorY(index: number) {
  return index * JOURNEY_ROW_HEIGHT + JOURNEY_NODE_CENTER_Y;
}

function secondsToLabel(value: number) {
  const total = Math.max(0, value);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function buildJourneyDays(detail: StudentMarathonDetail, days: StudentMarathonDaySummary[]) {
  const total = detail.total_days || detail.marathon_days || 0;
  const currentDayNumber = detail.enrollment?.current_day_number ?? 0;
  const byNumber = new Map(days.map((day) => [day.day_number, day]));

  return Array.from({length: total}, (_, index) => {
    const dayNumber = index + 1;
    const existing = byNumber.get(dayNumber);
    if (existing) return existing;

    return {
      id: `placeholder-${dayNumber}`,
      day_number: dayNumber,
      title: `Day ${dayNumber}`,
      difficulty: null,
      estimated_minutes: null,
      is_bonus_day: false,
      is_completable: false,
      is_locked: dayNumber > currentDayNumber,
      is_completed: false,
      external_links_count: 0,
      reading_passages_count: 0,
      listening_parts_count: 0
    } satisfies StudentMarathonDaySummary;
  });
}

function getDayState(day: StudentMarathonDaySummary, currentDayNumber: number) {
  if (day.is_completed) return "completed" as const;
  if (day.day_number === currentDayNumber) return "current" as const;
  if (day.is_locked || day.day_number > currentDayNumber) return "locked" as const;
  return "open" as const;
}

function progressPercent(detail: StudentMarathonDetail) {
  const progress = detail.enrollment?.progress_percentage ?? 0;
  return Math.max(0, Math.min(100, progress));
}

function buildWavePath(totalRows: number) {
  if (totalRows <= 0) return "";

  const firstAnchorY = getJourneyAnchorY(0);
  let path = `M ${JOURNEY_CENTER_X} 28 C ${JOURNEY_CENTER_X} 40 ${JOURNEY_CENTER_X} 52 ${JOURNEY_LEFT_X} ${firstAnchorY}`;

  for (let index = 0; index < totalRows; index += 1) {
    const centerY = getJourneyAnchorY(index);
    const nextCenterY = getJourneyAnchorY(index + 1);
    const currentX = index % 2 === 0 ? JOURNEY_LEFT_X : JOURNEY_RIGHT_X;
    const nextX = (index + 1) % 2 === 0 ? JOURNEY_LEFT_X : JOURNEY_RIGHT_X;

    if (index < totalRows - 1) {
      const controlOutY = centerY + 34;
      const controlInY = nextCenterY - 34;
      path += ` C ${JOURNEY_CENTER_X} ${controlOutY} ${JOURNEY_CENTER_X} ${controlInY} ${nextX} ${nextCenterY}`;
    } else {
      path += ` C ${JOURNEY_CENTER_X} ${centerY + 36} ${JOURNEY_CENTER_X} ${centerY + 64} ${JOURNEY_CENTER_X} ${centerY + 86}`;
    }
  }

  return path;
}

function getRouteTerminalLabel(totalRows: number) {
  if (totalRows <= 0) return null;
  const lastAnchorY = getJourneyAnchorY(totalRows - 1);
  return {
    startX: JOURNEY_CENTER_X,
    startY: 18,
    endX: JOURNEY_CENTER_X,
    endY: lastAnchorY + 92
  };
}

function MetricCard({label, value}: {label: string; value: ReactNode}) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4 dark:border-white/10 dark:bg-slate-950/26">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">{label}</p>
      <div className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">{value}</div>
    </div>
  );
}

function TaskCard({
  title,
  subtitle,
  meta,
  href,
  buttonLabel,
  icon
}: {
  title: string;
  subtitle: string;
  meta: string;
  href: string;
  buttonLabel: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-950/28">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <span className="mb-3 inline-flex size-10 items-center justify-center rounded-2xl border border-sky-100 bg-sky-50 text-sky-700 dark:border-white/10 dark:bg-white/8 dark:text-cyan-100">
            {icon}
          </span>
          <p className="truncate text-lg font-semibold text-slate-950 dark:text-white">{title}</p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{subtitle}</p>
          <p className="mt-3 text-xs uppercase tracking-[0.18em] text-slate-500">{meta}</p>
        </div>
        <Button asChild className="rounded-2xl bg-slate-950 text-white hover:bg-slate-800 dark:bg-white/10 dark:hover:bg-white/15">
          <Link href={href}>{buttonLabel}</Link>
        </Button>
      </div>
    </div>
  );
}

function Overlay({
  title,
  subtitle,
  onClose,
  children
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-sm" onMouseDown={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-5xl overflow-auto rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_40px_100px_rgba(15,23,42,0.18)] dark:border-white/10 dark:bg-[#0b1424] dark:shadow-[0_36px_120px_rgba(0,0,0,0.5)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">{title}</h3>
            {subtitle ? <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{subtitle}</p> : null}
          </div>
          <Button variant="ghost" className="rounded-2xl text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function MarathonDetailClient({marathonId}: MarathonDetailClientProps) {
  const locale = useLocale();
  const t = useTranslations("marathon");
  const [detail, setDetail] = useState<StudentMarathonDetail | null>(null);
  const [days, setDays] = useState<StudentMarathonDaySummary[]>([]);
  const [selectedDayNumber, setSelectedDayNumber] = useState<number | null>(null);
  const [selectedDay, setSelectedDay] = useState<StudentMarathonDayDetail | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [completeLoading, setCompleteLoading] = useState(false);
  const [attemptPreview, setAttemptPreview] = useState<AttemptPreview | null>(null);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);
  const savedNoteRef = useRef("");
  const routeSelectionRef = useRef<HTMLDivElement | null>(null);

  const loadDay = async (dayNumber: number) => {
    const day = await studentMarathonService.getDay(marathonId, dayNumber);
    setSelectedDayNumber(dayNumber);
    setSelectedDay(day);
    setNoteDraft(day.note?.note_text ?? "");
    savedNoteRef.current = day.note?.note_text ?? "";
  };

  const loadDetail = async (preserveSelection = true) => {
    setLoading(true);
    setNotice(null);
    try {
      const nextDetail = await studentMarathonService.getById(marathonId);
      setDetail(nextDetail);

      if (nextDetail.enrollment) {
        const [nextEnrollment, nextDays] = await Promise.all([
          studentMarathonService.getEnrollment(marathonId),
          studentMarathonService.listDays(marathonId)
        ]);

        setDetail((prev) => (prev ? {...prev, enrollment: nextEnrollment} : prev));
        setDays(nextDays);

        const fallbackDay =
          selectedDayNumber && preserveSelection
            ? selectedDayNumber
            : nextEnrollment?.current_day_number || nextDays[nextDays.length - 1]?.day_number || 1;

        await loadDay(fallbackDay);
      } else {
        setDays([]);
        setSelectedDay(null);
        setSelectedDayNumber(null);
      }
    } catch (cause) {
      setNotice({tone: "error", text: cause instanceof StudentApiError ? cause.message : t("errors.load")});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDetail(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marathonId]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 3200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (!selectedDayNumber || workspaceOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (target.closest("[data-marathon-day-interactive='true']")) return;
      if (routeSelectionRef.current?.contains(target)) return;

      setSelectedDayNumber(null);
      setSelectedDay(null);
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [selectedDayNumber, workspaceOpen]);

  const handleEnroll = async () => {
    try {
      setEnrollLoading(true);
      await studentMarathonService.enroll(marathonId);
      await loadDetail(false);
      setNotice({tone: "success", text: t("detail.enrolled")});
    } catch (cause) {
      setNotice({tone: "error", text: cause instanceof StudentApiError ? cause.message : t("errors.enroll")});
    } finally {
      setEnrollLoading(false);
    }
  };

  const handleSaveNote = async () => {
    if (!detail?.enrollment || !selectedDayNumber) return;
    if (noteDraft === savedNoteRef.current) return;

    try {
      setNoteSaving(true);
      const note = await studentMarathonService.updateNote(marathonId, selectedDayNumber, noteDraft);
      savedNoteRef.current = note?.note_text ?? "";
      setSelectedDay((prev) => (prev ? {...prev, note} : prev));
      setNotice({tone: "success", text: t("detail.noteSaved")});
    } catch (cause) {
      setNotice({tone: "error", text: cause instanceof StudentApiError ? cause.message : t("errors.note")});
    } finally {
      setNoteSaving(false);
    }
  };

  const handleCompleteDay = async () => {
    if (!selectedDayNumber) return;
    try {
      setCompleteLoading(true);
      const response = await studentMarathonService.completeDay(marathonId, selectedDayNumber);
      setNotice({
        tone: response.is_completed ? "success" : "info",
        text: response.incomplete.length
          ? `${response.detail} ${response.incomplete.map((item) => item.title).join(", ")}`
          : response.detail
      });
      await loadDetail(true);
    } catch (cause) {
      setNotice({tone: "error", text: cause instanceof StudentApiError ? cause.message : t("errors.complete")});
    } finally {
      setCompleteLoading(false);
    }
  };

  const handlePreviewAttempt = async (
    item: StudentMarathonDayContentItem | StudentMarathonListeningDayItem,
    type: "reading" | "listening"
  ) => {
    if (!selectedDayNumber) return;
    try {
      if (item.attempt_status === "COMPLETED" && item.attempt_id) {
        const review = await studentMarathonService.reviewAttempt(marathonId, selectedDayNumber, item.attempt_id);
        setAttemptPreview({type: "review", payload: review});
        return;
      }

      const attempt = item.attempt_id
        ? await studentMarathonService.getAttempt(marathonId, selectedDayNumber, item.attempt_id)
        : await studentMarathonService.startAttempt(
            marathonId,
            selectedDayNumber,
            type === "reading" ? {passage_id: item.id} : {part_id: item.id}
          );

      setAttemptPreview({type: "attempt", payload: attempt});
      setNotice({tone: "info", text: item.attempt_id ? t("detail.attemptLoaded") : t("detail.attemptStarted")});
      await loadDetail(true);
    } catch (cause) {
      setNotice({tone: "error", text: cause instanceof StudentApiError ? cause.message : t("errors.attempt")});
    }
  };

  const buildMarathonTaskHref = (
    route: "reading" | "listening",
    item: StudentMarathonDayContentItem | StudentMarathonListeningDayItem,
  ) => {
    if (!selectedDay) return "#";
    const query = new URLSearchParams({
      mode: "practice",
      marathonId,
      dayNumber: String(selectedDay.day_number),
      returnTo: `/${locale}/marathons/${marathonId}/days/${selectedDay.day_number}`,
      returnLabel: "Back to marathon day",
    });
    if (item.attempt_status === "COMPLETED" && item.attempt_id) {
      query.set("review", "1");
      query.set("attempt", item.attempt_id);
    }
    return `/${locale}/${route}/${item.id}?${query.toString()}`;
  };

  const handleToggleDay = async (dayNumber: number, canOpen: boolean) => {
    if (!canOpen) return;

    if (selectedDayNumber === dayNumber) {
      setSelectedDayNumber(null);
      setSelectedDay(null);
      setWorkspaceOpen(false);
      return;
    }

    await loadDay(dayNumber);
  };

  const enrollment = detail?.enrollment ?? null;
  const journeyDays = detail ? buildJourneyDays(detail, days) : [];
  const currentDayNumber = enrollment?.current_day_number ?? 0;

  const journeySvgHeight = useMemo(
    () => Math.max(260, journeyDays.length * JOURNEY_ROW_HEIGHT + 144),
    [journeyDays.length]
  );

  const wavePath = useMemo(() => buildWavePath(journeyDays.length), [journeyDays.length]);
  const routeTerminalLabel = useMemo(() => getRouteTerminalLabel(journeyDays.length), [journeyDays.length]);

  if (loading || !detail) {
    return (
      <div className="mx-auto max-w-5xl space-y-5">
        <div className="h-[1200px] rounded-[32px] border border-slate-200 bg-white/80 dark:border-white/10 dark:bg-white/6" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {notice ? (
        <Card
          className={cn(
            "rounded-[22px] border",
            notice.tone === "success"
              ? "border-emerald-200 bg-emerald-50 dark:border-emerald-300/20 dark:bg-emerald-400/10"
              : notice.tone === "error"
                ? "border-rose-200 bg-rose-50 dark:border-rose-300/20 dark:bg-rose-500/10"
                : "border-sky-200 bg-sky-50 dark:border-cyan-300/20 dark:bg-cyan-400/10"
          )}
        >
          <CardContent className="p-4 text-sm text-slate-700 dark:text-slate-200">{notice.text}</CardContent>
        </Card>
      ) : null}

      <div className="mx-auto max-w-5xl space-y-6">
        {enrollment ? (
          <section id="journey">
            <Card className="overflow-hidden rounded-[34px] border border-slate-200 bg-white/94 shadow-[0_24px_80px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/7 dark:shadow-[0_24px_80px_rgba(0,0,0,0.26)]">
              <CardContent className="p-0">
                <div className="relative px-4 py-8 sm:px-8">
                  <svg
                    aria-hidden="true"
                    className="pointer-events-none absolute left-1/2 top-0 hidden -translate-x-1/2 lg:block"
                    width="220"
                    height={journeySvgHeight}
                    viewBox={`0 0 ${JOURNEY_SVG_WIDTH} ${journeySvgHeight}`}
                    preserveAspectRatio="none"
                  >
                    {routeTerminalLabel ? (
                      <>
                        <text
                          x={routeTerminalLabel.startX}
                          y={routeTerminalLabel.startY}
                          textAnchor="middle"
                          fill="currentColor"
                          fontSize="10"
                          fontWeight="700"
                          letterSpacing="0.08em"
                          className="text-slate-400 dark:text-slate-500"
                        >
                          Start
                        </text>
                        <text
                          x={routeTerminalLabel.endX}
                          y={routeTerminalLabel.endY}
                          textAnchor="middle"
                          fill="currentColor"
                          fontSize="10"
                          fontWeight="700"
                          letterSpacing="0.08em"
                          className="text-slate-400 dark:text-slate-500"
                        >
                          Finish
                        </text>
                      </>
                    ) : null}
                    <path
                      d={wavePath}
                      fill="none"
                      stroke="rgba(148,163,184,0.32)"
                      strokeWidth="1.7"
                      strokeDasharray="5 7"
                      strokeLinecap="round"
                    />
                  </svg>

                  <div className="relative space-y-4 pb-[180px]">
                    {journeyDays.map((day, index) => {
                      const state = getDayState(day, currentDayNumber);
                      const isSelected = selectedDayNumber === day.day_number;
                      const canOpen = state !== "locked";
                      const showExpanded = isSelected || (!selectedDayNumber && state === "current");
                      const title = day.title || `Day ${day.day_number}`;
                      const isLeftAnchor = index % 2 === 0;
                      const anchorX = isLeftAnchor ? JOURNEY_LEFT_X : JOURNEY_RIGHT_X;
                      const anchorOffsetPx = (anchorX / JOURNEY_SVG_WIDTH) * JOURNEY_RENDER_WIDTH - JOURNEY_RENDER_WIDTH / 2;
                      const nodeOffsetPx = anchorOffsetPx;
                      return (
                        <div key={day.id} className="relative">
                          <div className="relative min-h-[132px] w-full">
                            <div
                              className="absolute w-[156px]"
                              style={{
                                  left: `calc(50% + ${nodeOffsetPx}px)`,
                                  top: "0px",
                                  transform: "translateX(-50%)"
                                }}
                            >
                              <p
                                className="mx-auto max-w-[156px] text-center text-sm font-semibold leading-5 text-slate-950 dark:text-white line-clamp-2"
                                style={{transform: `translate(${JOURNEY_TITLE_X_SHIFT}px, ${JOURNEY_TITLE_Y_SHIFT}px)`}}
                              >
                                {title}
                              </p>
                              <div
                                className="mx-auto mt-2 flex w-14 flex-col items-center"
                                style={{transform: `translate(${JOURNEY_NODE_X_SHIFT}px, ${JOURNEY_NODE_Y_SHIFT}px)`}}
                              >
                                <button
                                  type="button"
                                  onClick={() => void handleToggleDay(day.day_number, canOpen)}
                                  disabled={!canOpen}
                                  data-marathon-day-interactive="true"
                                  className={cn(
                                    "inline-flex size-14 cursor-pointer items-center justify-center rounded-full border text-sm font-semibold transition",
                                    state === "completed" && "border-emerald-200 bg-emerald-50 text-emerald-700",
                                    state === "current" &&
                                      "border-sky-300 bg-linear-to-br from-sky-500 to-blue-600 text-white shadow-[0_0_0_6px_rgba(224,242,254,0.95),0_0_40px_rgba(59,130,246,0.30)] dark:border-cyan-300/60 dark:shadow-[0_0_0_3px_rgba(8,16,28,0.94),0_0_16px_rgba(34,211,238,0.18)]",
                                    state === "open" && "border-slate-300 bg-white text-slate-950 hover:border-sky-200 dark:border-white/12 dark:bg-white/8 dark:text-white",
                                    state === "locked" && "border-slate-200 bg-slate-100 text-slate-400 dark:border-white/8 dark:bg-slate-950/48 dark:text-slate-500"
                                  )}
                                >
                                  {state === "completed" ? (
                                    <CheckCircle2 className="size-4.5" />
                                  ) : state === "locked" ? (
                                    <Lock className="size-4" />
                                  ) : (
                                    day.day_number
                                  )}
                                </button>
                                <span
                                  className={cn(
                                    "mt-2 block w-14 text-center text-[10px] font-semibold uppercase tracking-[0.18em]",
                                    state === "current"
                                      ? "text-sky-700"
                                      : state === "completed"
                                        ? "text-emerald-700"
                                        : "text-slate-500"
                                  )}
                                >
                                  {day.reading_passages_count + day.listening_parts_count} tasks
                                </span>
                              </div>
                            </div>
                          </div>

                          {showExpanded && selectedDay ? (
                            <div
                              ref={routeSelectionRef}
                              data-marathon-day-interactive="true"
                              className="pointer-events-none absolute left-0 right-0 top-[132px] z-20 w-full"
                            >
                              <div
                                className="pointer-events-auto w-full max-w-[390px] rounded-[28px] border border-sky-200 bg-white px-5 py-5 text-center shadow-[0_24px_50px_rgba(59,130,246,0.10)] dark:border-cyan-300/20 dark:bg-[#0b1424]"
                                style={{marginLeft: `calc(50% + ${nodeOffsetPx + JOURNEY_NODE_X_SHIFT}px - 195px)`}}
                              >
                                <h4 className="text-xl font-semibold text-slate-950 dark:text-white">{selectedDay.title || `Day ${selectedDay.day_number}`}</h4>
                                <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                                  {selectedDay.content
                                    ? selectedDay.content.split(/\n+/)[0]
                                    : "Open this checkpoint to read the lesson and work through the tasks for today."}
                                </p>
                                <div className="mt-5 flex flex-wrap justify-center gap-3">
                                  <Button
                                    asChild
                                    className="rounded-2xl bg-slate-950 px-5 text-white hover:bg-slate-800 dark:bg-white/10 dark:hover:bg-white/15"
                                  >
                                    <Link href={`/${locale}/marathons/${marathonId}/days/${selectedDay.day_number}`}>Open day</Link>
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => void handleCompleteDay()}
                                    disabled={completeLoading || !selectedDay.is_completable}
                                    className="rounded-2xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-950 dark:border-white/12 dark:bg-white/8 dark:text-slate-200 dark:hover:bg-white/10 dark:hover:text-white"
                                  >
                                    {completeLoading ? "Updating..." : t("detail.markComplete")}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        ) : (
          <Card className="rounded-[30px] border border-slate-200 bg-white/92 dark:border-white/10 dark:bg-white/7">
            <CardContent className="space-y-5 p-6">
              <div className="flex items-center gap-3">
                <span className="inline-flex size-12 items-center justify-center rounded-2xl border border-sky-100 bg-sky-50 text-sky-700 dark:border-white/10 dark:bg-white/8 dark:text-cyan-100">
                  <PlayCircle className="size-5" />
                </span>
                <div>
                  <p className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">Join to unlock the route</p>
                  <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                    This marathon opens one day at a time, so enrollment is required before the route becomes available.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                onClick={() => void handleEnroll()}
                disabled={enrollLoading}
                className="h-12 rounded-2xl bg-slate-950 px-5 text-base font-semibold text-white hover:bg-slate-800 dark:bg-white/10 dark:hover:bg-white/15"
              >
                {enrollLoading ? t("detail.enrolling") : t("detail.enroll")}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {workspaceOpen && selectedDay ? (
        <Overlay
          title={selectedDay.title || `Day ${selectedDay.day_number}`}
          subtitle="Lesson, notes, resources, and practice for the selected checkpoint."
          onClose={() => setWorkspaceOpen(false)}
        >
          <div className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-3">
              <MetricCard label={t("detail.estimatedTime")} value={selectedDay.estimated_minutes ?? "-"} />
              <MetricCard label={t("detail.readingPassages")} value={selectedDay.reading_passages.length} />
              <MetricCard label={t("detail.listeningParts")} value={selectedDay.listening_parts.length} />
            </div>

            {selectedDay.content ? (
              <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-slate-950/26">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Lesson</p>
                <div className="space-y-4 text-sm leading-8 text-slate-700 dark:text-slate-300">
                  {selectedDay.content.split(/\n{2,}/).map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="space-y-4">
              {selectedDay.reading_passages.map((item) => (
                <TaskCard
                  key={item.id}
                  title={item.title}
                  subtitle={t("detail.readingPassageCard", {questions: item.max_questions})}
                  meta={`${item.difficulty_level ?? "-"} - ${item.estimated_time_minutes ?? 0}m`}
                  icon={<BookOpen className="size-4" />}
                  buttonLabel={
                    item.attempt_status === "COMPLETED"
                      ? t("detail.reviewAttempt")
                      : item.attempt_status === "IN_PROGRESS"
                        ? t("detail.continueAttempt")
                        : t("detail.startAttempt")
                  }
                  href={buildMarathonTaskHref("reading", item)}
                />
              ))}

              {selectedDay.listening_parts.map((item) => (
                <TaskCard
                  key={item.id}
                  title={item.title}
                  subtitle={t("detail.listeningPartCard", {questions: item.max_questions})}
                  meta={`${item.difficulty_level ?? "-"} - ${item.estimated_time_minutes ?? 0}m`}
                  icon={<Headphones className="size-4" />}
                  buttonLabel={
                    item.attempt_status === "COMPLETED"
                      ? t("detail.reviewAttempt")
                      : item.attempt_status === "IN_PROGRESS"
                        ? t("detail.continueAttempt")
                        : t("detail.startAttempt")
                  }
                  href={buildMarathonTaskHref("listening", item)}
                />
              ))}
            </div>

            {selectedDay.external_links.length ? (
              <>
                <Separator className="bg-slate-200" />
                <div className="space-y-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                    {t("detail.resourcesLabel")}
                  </p>
                  <div className="grid gap-3">
                    {selectedDay.external_links.map((link) => (
                      <a
                        key={link.id}
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between gap-3 rounded-[22px] border border-slate-200 bg-slate-50 p-4 transition hover:border-sky-200 hover:bg-sky-50 dark:border-white/10 dark:bg-slate-950/26 dark:hover:border-cyan-300/22 dark:hover:bg-white/8"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-base font-semibold text-slate-950 dark:text-white">{link.title}</p>
                          <p className="mt-1 truncate text-sm text-slate-500 dark:text-slate-400">{link.url}</p>
                        </div>
                        <ExternalLink className="size-4 shrink-0 text-sky-700 dark:text-cyan-100" />
                      </a>
                    ))}
                  </div>
                </div>
              </>
            ) : null}

            <Separator className="bg-slate-200" />

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                    {t("detail.notesLabel")}
                  </p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{t("detail.notesTitle")}</p>
                </div>
                {noteSaving ? <span className="text-xs text-sky-700 dark:text-cyan-100">{t("detail.saving")}</span> : null}
              </div>

              <textarea
                value={noteDraft}
                onChange={(event) => setNoteDraft(event.target.value)}
                onBlur={() => void handleSaveNote()}
                placeholder={t("detail.notesPlaceholder")}
                className="min-h-36 w-full resize-y rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-8 text-slate-900 outline-none placeholder:text-slate-400 focus:border-sky-200 focus:bg-white dark:border-white/10 dark:bg-slate-950/26 dark:text-white dark:placeholder:text-slate-400 dark:focus:border-cyan-300/28 dark:focus:bg-[#0f1a30]"
              />
            </div>
          </div>
        </Overlay>
      ) : null}

      {attemptPreview ? (
        <Overlay
          title={attemptPreview.type === "attempt" ? "Current attempt state" : "Latest result snapshot"}
          subtitle={attemptPreview.type === "attempt" ? "This attempt is already attached to the selected marathon day." : "Latest result snapshot for the selected task."}
          onClose={() => setAttemptPreview(null)}
        >
          {attemptPreview.type === "attempt" ? (
            <div className="space-y-5">
              <div className="grid gap-3 md:grid-cols-4">
                <MetricCard label={t("detail.status")} value={attemptPreview.payload.status} />
                <MetricCard
                  label={t("detail.answered")}
                  value={`${attemptPreview.payload.questions_answered} / ${attemptPreview.payload.total_questions}`}
                />
                <MetricCard label={t("detail.timeUsed")} value={secondsToLabel(attemptPreview.payload.time_used_seconds)} />
                <MetricCard label={t("detail.band")} value={attemptPreview.payload.band_score ?? "-"} />
              </div>
                <div className="rounded-[24px] border border-sky-200 bg-sky-50 p-4 text-sm leading-7 text-slate-700 dark:border-cyan-300/18 dark:bg-cyan-400/10 dark:text-slate-200">
                  This attempt is correctly linked to the marathon day. The next step is opening the full runner directly from this state.
                </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="grid gap-3 md:grid-cols-4">
                <MetricCard label={t("detail.score")} value={attemptPreview.payload.score ?? 0} />
                <MetricCard label={t("detail.band")} value={attemptPreview.payload.band_score ?? "-"} />
                <MetricCard label={t("detail.correct")} value={attemptPreview.payload.correct_count} />
                <MetricCard label={t("detail.skipped")} value={attemptPreview.payload.skipped_count} />
              </div>
              <div className="space-y-3">
                {attemptPreview.payload.answers.map((answer) => (
                    <div key={answer.id} className="rounded-[22px] border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-950/25">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-950 dark:text-white">
                            {t("detail.questionLabel", {number: answer.question_number})}
                          </p>
                          <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{answer.question_text}</p>
                        </div>
                      <Badge
                        className={cn(
                          "rounded-full border px-3 py-1",
                          answer.is_correct
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-rose-200 bg-rose-50 text-rose-700"
                        )}
                      >
                        {answer.is_correct ? t("detail.correct") : t("detail.incorrect")}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Overlay>
      ) : null}
    </div>
  );
}
