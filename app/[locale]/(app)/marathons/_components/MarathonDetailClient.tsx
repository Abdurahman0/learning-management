"use client";

import Link from "next/link";
import {
  BookOpen,
  CheckCircle2,
  ExternalLink,
  Flame,
  Headphones,
  Lock,
  PlayCircle,
  Timer,
  Trophy,
  X,
  Zap,
} from "lucide-react";
import {useEffect, useMemo, useRef, useState} from "react";
import {useLocale, useTranslations} from "next-intl";

import {Button} from "@/components/ui/button";
import {SiteToast} from "@/components/ui/site-toast";
import {cn} from "@/lib/utils";
import {studentMarathonService} from "@/src/services/student/marathon.service";
import type {
  StudentMarathonDayDetail,
  StudentMarathonDaySummary,
  StudentMarathonDetail,
} from "@/src/services/student/marathon.types";
import {StudentApiError} from "@/src/services/student/types";

// ── URL helpers ───────────────────────────────────────────────────────────────
function normalizeHttpUrl(value: string | null | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url;
  } catch {
    return null;
  }
}

function getYoutubeVideoId(url: URL | null) {
  if (!url) return null;
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  if (host === "youtube.com" || host === "m.youtube.com") {
    if (url.pathname === "/watch") return url.searchParams.get("v")?.trim() || null;
    if (url.pathname.startsWith("/embed/")) return url.pathname.split("/")[2]?.trim() || null;
    if (url.pathname.startsWith("/shorts/")) return url.pathname.split("/")[2]?.trim() || null;
  }
  if (host === "youtu.be") return url.pathname.replace(/^\/+/, "").trim() || null;
  return null;
}

function buildYoutubeEmbedUrl(videoId: string | null) {
  if (!videoId || !/^[A-Za-z0-9_-]{6,}$/.test(videoId)) return null;
  return `https://www.youtube-nocookie.com/embed/${videoId}`;
}

// ── Journey constants ─────────────────────────────────────────────────────────
const JOURNEY_ROW_HEIGHT = 146;
const JOURNEY_SVG_WIDTH = 136;
const JOURNEY_CENTER_X = 68;
const JOURNEY_LEFT_X = 22;
const JOURNEY_RIGHT_X = 136;
const JOURNEY_RENDER_WIDTH = 220;
const JOURNEY_NODE_CENTER_Y = 48;
const JOURNEY_MARKER_CIRCLE_CENTER_OFFSET = 100;
const JOURNEY_FINISH_Y_OFFSET = 92;
const JOURNEY_NODE_X_SHIFT = 14;

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
  const highestReturnedDayNumber = days.reduce((max, day) => Math.max(max, day.day_number), 0);
  const total = Math.max(detail.total_days || 0, detail.marathon_days || 0, highestReturnedDayNumber);
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
      listening_parts_count: 0,
    } satisfies StudentMarathonDaySummary;
  });
}

function getDayState(
  day: StudentMarathonDaySummary,
  currentDayNumber: number,
  prevDay: StudentMarathonDaySummary | null,
) {
  if (day.is_completed) return "completed" as const;
  if (day.day_number === currentDayNumber) return "current" as const;
  if (day.is_locked || day.day_number > currentDayNumber) return "locked" as const;
  if (prevDay !== null && !prevDay.is_completed) return "locked" as const;
  return "open" as const;
}

function buildWavePath(totalRows: number) {
  if (totalRows <= 0) return "";
  const firstAnchorY = getJourneyAnchorY(0);
  let path = `M ${JOURNEY_CENTER_X} 28 C ${JOURNEY_CENTER_X} 40 ${JOURNEY_CENTER_X} 52 ${JOURNEY_LEFT_X} ${firstAnchorY}`;
  for (let index = 0; index < totalRows; index += 1) {
    const centerY = getJourneyAnchorY(index);
    const nextCenterY = getJourneyAnchorY(index + 1);
    const nextX = (index + 1) % 2 === 0 ? JOURNEY_LEFT_X : JOURNEY_RIGHT_X;
    if (index < totalRows - 1) {
      path += ` C ${JOURNEY_CENTER_X} ${centerY + 34} ${JOURNEY_CENTER_X} ${nextCenterY - 34} ${nextX} ${nextCenterY}`;
    } else {
      path += ` C ${JOURNEY_CENTER_X} ${centerY + 36} ${JOURNEY_CENTER_X} ${centerY + 72} ${JOURNEY_CENTER_X} ${centerY + JOURNEY_FINISH_Y_OFFSET}`;
    }
  }
  return path;
}

function getRouteTerminalLabel(totalRows: number) {
  if (totalRows <= 0) return null;
  return {
    startX: JOURNEY_CENTER_X,
    startY: 18,
    endX: JOURNEY_CENTER_X,
    endY: getJourneyAnchorY(totalRows - 1) + JOURNEY_FINISH_Y_OFFSET,
  };
}

// Edit these quotes freely — they appear evenly spaced along the path
const MOTIVATIONAL_QUOTES = [
  "The pain of discipline is far less than the pain of regret.",
  "Small steps every day lead to big results.",
  "Consistency is the bridge between goals and accomplishment.",
];

type Notice = {tone: "info" | "success" | "error"; text: string};

export function MarathonDetailClient({marathonId}: {marathonId: string}) {
  const locale = useLocale();
  const t = useTranslations("marathon");
  const [detail, setDetail] = useState<StudentMarathonDetail | null>(null);
  const [days, setDays] = useState<StudentMarathonDaySummary[]>([]);
  const [selectedDayNumber, setSelectedDayNumber] = useState<number | null>(null);
  const [selectedDay, setSelectedDay] = useState<StudentMarathonDayDetail | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrollLoading, setEnrollLoading] = useState(false);
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
    if (day.is_completable && !day.is_completed) {
      try {
        await studentMarathonService.completeDay(marathonId, dayNumber);
        setSelectedDay((prev) => (prev ? {...prev, is_completed: true} : prev));
      } catch {
        // silent
      }
    }
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
          studentMarathonService.listDays(marathonId),
        ]);
        setDetail((prev) => (prev ? {...prev, enrollment: nextEnrollment} : prev));
        setDays(nextDays);
        if (selectedDayNumber && preserveSelection) {
          await loadDay(selectedDayNumber);
        } else {
          setSelectedDayNumber(null);
          setSelectedDay(null);
        }
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
    if (!selectedDayNumber) return;
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
  }, [selectedDayNumber]);

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
    } catch {
      // silent
    } finally {
      setNoteSaving(false);
    }
  };

  const handleToggleDay = async (dayNumber: number, canOpen: boolean) => {
    if (!canOpen) return;
    if (selectedDayNumber === dayNumber) {
      setSelectedDayNumber(null);
      setSelectedDay(null);
      return;
    }
    await loadDay(dayNumber);
  };

  const enrollment = detail?.enrollment ?? null;
  const journeyDays = detail ? buildJourneyDays(detail, days) : [];
  const currentDayNumber = enrollment?.current_day_number ?? 0;
  const progress = enrollment ? Math.max(0, Math.min(100, enrollment.progress_percentage)) : 0;

  const marathonExternalUrl = useMemo(() => normalizeHttpUrl(detail?.external_link), [detail?.external_link]);
  const marathonYoutubeVideoId = useMemo(() => getYoutubeVideoId(marathonExternalUrl), [marathonExternalUrl]);
  const marathonYoutubeEmbedUrl = useMemo(() => buildYoutubeEmbedUrl(marathonYoutubeVideoId), [marathonYoutubeVideoId]);
  const marathonExternalTitle = detail?.external_link_title?.trim() || "Marathon resource";

  const journeySvgHeight = useMemo(
    () => Math.max(260, journeyDays.length * JOURNEY_ROW_HEIGHT + 144),
    [journeyDays.length],
  );
  const wavePath = useMemo(() => buildWavePath(journeyDays.length), [journeyDays.length]);
  const routeTerminalLabel = useMemo(() => getRouteTerminalLabel(journeyDays.length), [journeyDays.length]);

  const quotePositions = useMemo(() => {
    if (journeyDays.length < 3) return [];
    return MOTIVATIONAL_QUOTES.map((quote, i) => ({
      quote,
      afterIndex: Math.floor(journeyDays.length * (i + 1) / (MOTIVATIONAL_QUOTES.length + 1)),
    })).filter(({afterIndex}) => afterIndex < journeyDays.length - 1);
  }, [journeyDays.length]);

  if (loading || !detail) {
    return (
      <>
        <SiteToast notice={notice ? {title: notice.text, tone: notice.tone} : null} />
        <div className="space-y-4">
          <div className="h-12 animate-pulse rounded-2xl bg-slate-200 dark:bg-white/4" />
          <div className="h-[900px] animate-pulse rounded-[32px] bg-slate-100 dark:bg-white/3" />
        </div>
      </>
    );
  }

  return (
    <div className="space-y-5">
      <SiteToast notice={notice ? {title: notice.text, tone: notice.tone} : null} />

      {enrollment ? (
        <>
          {/* Stats row */}
          <div className="flex flex-wrap gap-2">
            {/* Progress */}
            <div className="flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-4 py-2 dark:border-teal-500/20 dark:bg-teal-500/5">
              <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 transition-[width] duration-700"
                  style={{width: `${progress}%`}}
                />
              </div>
              <span className="text-sm font-bold text-teal-700 dark:text-teal-300">{progress}%</span>
              <span className="hidden text-xs text-slate-500 sm:inline">complete</span>
            </div>
            {/* Streak */}
            <div className="flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-4 py-2 dark:border-orange-500/20 dark:bg-orange-500/5">
              <Flame className="size-3.5 text-orange-500 dark:text-orange-400" />
              <span className="text-sm font-bold text-orange-700 dark:text-orange-300">{enrollment.current_streak}</span>
              <span className="hidden text-xs text-slate-500 sm:inline">day streak</span>
            </div>
            {/* Days done */}
            <div className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 dark:border-white/10 dark:bg-white/5">
              <CheckCircle2 className="size-3.5 text-teal-500 dark:text-teal-400" />
              <span className="text-sm font-bold text-slate-800 dark:text-white">{enrollment.days_completed}</span>
              <span className="text-xs text-slate-500">/ {journeyDays.length} days</span>
            </div>
            {/* Time */}
            {enrollment.total_time_seconds > 0 ? (
              <div className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 dark:border-white/10 dark:bg-white/5">
                <Timer className="size-3.5 text-slate-400" />
                <span className="text-sm font-bold text-slate-800 dark:text-white">{secondsToLabel(enrollment.total_time_seconds)}</span>
                <span className="hidden text-xs text-slate-500 sm:inline">total time</span>
              </div>
            ) : null}
          </div>

          {/* Video / external link */}
          {marathonExternalUrl ? (
            marathonYoutubeEmbedUrl ? (
              <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white dark:border-white/10 dark:bg-[#0a1525]">
                <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 dark:border-white/8">
                  <span className="inline-flex size-8 items-center justify-center rounded-xl bg-red-100 text-red-500 dark:bg-red-500/15 dark:text-red-400">
                    <PlayCircle className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Marathon intro</p>
                    <p className="line-clamp-1 text-sm font-semibold text-slate-900 dark:text-white">{marathonExternalTitle}</p>
                  </div>
                </div>
                <div className="aspect-video bg-slate-950">
                  <iframe
                    src={marathonYoutubeEmbedUrl}
                    title={marathonExternalTitle}
                    className="h-full w-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                </div>
              </div>
            ) : (
              <a
                href={marathonExternalUrl.toString()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-3 rounded-[20px] border border-slate-200 bg-white px-4 py-3 transition hover:border-teal-200 hover:bg-teal-50/50 dark:border-white/10 dark:bg-[#0a1525] dark:hover:border-teal-500/25 dark:hover:bg-teal-500/5"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400">
                    <BookOpen className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="line-clamp-1 text-sm font-semibold text-slate-900 dark:text-white">{marathonExternalTitle}</p>
                    <p className="truncate text-xs text-slate-500">{marathonExternalUrl.toString()}</p>
                  </div>
                </div>
                <ExternalLink className="size-4 shrink-0 text-slate-400 dark:text-slate-600" />
              </a>
            )
          ) : null}

          {/* Journey map */}
          <div className="relative overflow-hidden rounded-[32px] border border-slate-200/80 bg-slate-50/60 dark:border-teal-500/10 dark:bg-[#060d18]">
            {/* Grid overlay */}
            <div className="pointer-events-none absolute inset-0 [background-image:linear-gradient(rgba(0,178,178,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(0,178,178,0.06)_1px,transparent_1px)] [background-size:36px_36px] dark:[background-image:linear-gradient(rgba(0,178,178,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(0,178,178,0.025)_1px,transparent_1px)]" />
            {/* Ambient glow — visible in both modes, subtle in light */}
            <div className="pointer-events-none absolute left-1/2 top-1/4 size-[500px] -translate-x-1/2 rounded-full bg-teal-400/4 blur-3xl dark:bg-teal-500/4" />

            <div className="relative px-4 py-10 sm:px-8">
              {/* Desktop wave SVG */}
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
                      className="fill-teal-500/60 dark:fill-teal-400/40"
                      fontSize="7"
                      fontWeight="700"
                      letterSpacing="0.14em"
                    >
                      START
                    </text>
                    <text
                      x={routeTerminalLabel.endX}
                      y={routeTerminalLabel.endY}
                      textAnchor="middle"
                      className="fill-orange-500/60 dark:fill-orange-400/55"
                      fontSize="7"
                      fontWeight="700"
                      letterSpacing="0.14em"
                    >
                      FINISH
                    </text>
                  </>
                ) : null}
                {/* Base path */}
                <path
                  d={wavePath}
                  className="stroke-slate-300/70 dark:stroke-white/4"
                  fill="none"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                {/* Animated dashes */}
                <path
                  d={wavePath}
                  className="stroke-teal-400/50 dark:stroke-teal-400/30"
                  fill="none"
                  strokeWidth="1.5"
                  strokeDasharray="6 12"
                  strokeLinecap="round"
                >
                  <animate attributeName="stroke-dashoffset" from="72" to="0" dur="2s" repeatCount="indefinite" />
                </path>
              </svg>

              {/* Mobile vertical line */}
              <div className="pointer-events-none absolute bottom-0 left-1/2 top-0 w-px -translate-x-1/2 bg-gradient-to-b from-teal-400/25 via-teal-300/12 to-transparent dark:from-teal-500/20 dark:via-teal-500/10 lg:hidden" />

              <div className="relative pb-4">
                {quotePositions.map(({quote, afterIndex}, qi) => (
                  <div
                    key={qi}
                    className="pointer-events-none absolute hidden -translate-y-1/2 lg:block"
                    style={{
                      top: `${(afterIndex + 0.5) * JOURNEY_ROW_HEIGHT}px`,
                      ...(qi % 2 === 0 ? {left: "8%"} : {right: "8%"}),
                    }}
                  >
                    <p className="max-w-[130px] text-center font-mono text-[10px] italic leading-4 text-slate-400/60 dark:text-slate-600/70">
                      &#8220;{quote}&#8221;
                    </p>
                  </div>
                ))}
                {journeyDays.map((day, index) => {
                  const state = getDayState(day, currentDayNumber, journeyDays[index - 1] ?? null);
                  const isSelected = selectedDayNumber === day.day_number;
                  const canOpen = state !== "locked";
                  const isFinal = index === journeyDays.length - 1;
                  const title = day.title || `Day ${day.day_number}`;
                  const isLeftAnchor = index % 2 === 0;
                  const anchorX = isLeftAnchor ? JOURNEY_LEFT_X : JOURNEY_RIGHT_X;
                  const anchorOffsetPx =
                    (anchorX / JOURNEY_SVG_WIDTH) * JOURNEY_RENDER_WIDTH - JOURNEY_RENDER_WIDTH / 2;
                  const nodeOffsetPx = anchorOffsetPx + JOURNEY_NODE_X_SHIFT;
                  const taskCount = day.reading_passages_count + day.listening_parts_count;

                  return (
                    <div key={day.id} className="relative">
                      <div className="relative w-full" style={{minHeight: `${JOURNEY_ROW_HEIGHT}px`}}>
                        <div
                          className="absolute flex w-[156px] flex-col items-center"
                          style={{
                            left: `calc(50% + ${nodeOffsetPx}px)`,
                            top: `${JOURNEY_NODE_CENTER_Y}px`,
                            transform: `translate(-50%, -${JOURNEY_MARKER_CIRCLE_CENTER_OFFSET}px)`,
                          }}
                        >
                          {/* Day label */}
                          <p
                            className={cn(
                              "flex h-10 max-w-[140px] items-end justify-center text-center text-xs font-semibold leading-4 line-clamp-2",
                              state === "locked"
                                ? "text-slate-400 dark:text-slate-700"
                                : state === "completed"
                                  ? "text-slate-500 dark:text-slate-500"
                                  : "text-slate-700 dark:text-slate-200",
                            )}
                          >
                            {title}
                          </p>

                          <div className="mt-2 flex flex-col items-center">
                            <button
                              type="button"
                              onClick={() => void handleToggleDay(day.day_number, canOpen)}
                              disabled={!canOpen}
                              data-marathon-day-interactive="true"
                              className={cn(
                                "relative inline-flex size-14 items-center justify-center rounded-full border-2 text-sm font-bold transition-all duration-200",
                                // locked
                                state === "locked" &&
                                  "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 dark:border-white/8 dark:bg-white/3 dark:text-slate-700",
                                // open — teal
                                state === "open" && !isFinal &&
                                  "cursor-pointer border-slate-300 bg-white text-slate-700 hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700 hover:shadow-[0_0_16px_rgba(20,184,166,0.15)] dark:border-white/15 dark:bg-white/5 dark:text-slate-300 dark:hover:border-teal-400/40 dark:hover:bg-teal-500/10 dark:hover:text-teal-300 dark:hover:shadow-[0_0_20px_rgba(0,178,178,0.22)]",
                                // open — orange (final)
                                state === "open" && isFinal &&
                                  "cursor-pointer border-orange-200 bg-orange-50/50 text-orange-600 hover:border-orange-300 hover:bg-orange-50 hover:shadow-[0_0_16px_rgba(234,88,12,0.15)] dark:border-orange-500/20 dark:bg-orange-500/5 dark:text-orange-400 dark:hover:border-orange-400/40 dark:hover:shadow-[0_0_20px_rgba(230,81,0,0.22)]",
                                // current — teal
                                state === "current" && !isFinal &&
                                  "cursor-pointer border-teal-400 bg-teal-50 text-teal-700 shadow-[0_0_0_5px_rgba(20,184,166,0.12)] dark:border-teal-400/70 dark:bg-teal-500/15 dark:text-teal-300 dark:shadow-[0_0_28px_rgba(0,178,178,0.45),0_0_0_5px_rgba(0,178,178,0.08)]",
                                // current — orange (final)
                                state === "current" && isFinal &&
                                  "cursor-pointer border-orange-400 bg-orange-50 text-orange-700 shadow-[0_0_0_5px_rgba(234,88,12,0.12)] dark:border-orange-400/70 dark:bg-orange-500/15 dark:text-orange-300 dark:shadow-[0_0_28px_rgba(230,81,0,0.45),0_0_0_5px_rgba(230,81,0,0.08)]",
                                // completed — teal
                                state === "completed" && !isFinal &&
                                  "cursor-pointer border-teal-200 bg-teal-50/80 text-teal-600 dark:border-teal-500/40 dark:bg-teal-500/10 dark:text-teal-400",
                                // completed — orange (final)
                                state === "completed" && isFinal &&
                                  "cursor-pointer border-orange-200 bg-orange-50/70 text-orange-600 dark:border-orange-400/60 dark:bg-orange-500/12 dark:text-orange-300 dark:shadow-[0_0_28px_rgba(230,81,0,0.40),0_0_0_5px_rgba(230,81,0,0.07)]",
                              )}
                            >
                              {/* Pulse rings */}
                              {state === "current" ? (
                                <span
                                  className={cn(
                                    "absolute inset-0 animate-ping rounded-full border opacity-50",
                                    isFinal
                                      ? "border-orange-400/60 dark:border-orange-400/50"
                                      : "border-teal-400/60 dark:border-teal-400/50",
                                  )}
                                />
                              ) : null}
                              {/* Extra glow rings for final boss node (unlocked) */}
                              {isFinal && state !== "locked" ? (
                                <>
                                  <span
                                    className="absolute -inset-3 animate-ping rounded-full border border-orange-400/35 dark:border-orange-400/30"
                                    style={{animationDuration: "1.6s"}}
                                  />
                                  <span
                                    className="absolute -inset-5 animate-ping rounded-full border border-orange-400/18 dark:border-orange-400/15"
                                    style={{animationDuration: "2.2s"}}
                                  />
                                </>
                              ) : null}

                              {isFinal ? (
                                state === "locked" ? <Lock className="size-4" /> : <Trophy className="size-5" />
                              ) : state === "completed" ? (
                                <CheckCircle2 className="size-5" />
                              ) : state === "locked" ? (
                                <Lock className="size-4" />
                              ) : (
                                <span>{day.day_number}</span>
                              )}
                            </button>

                            {isFinal && state !== "locked" ? (
                              <span
                                className={cn(
                                  "mt-2 text-[9px] font-bold uppercase tracking-widest",
                                  state === "completed"
                                    ? "text-orange-400 dark:text-orange-500"
                                    : "text-orange-500 dark:text-orange-400",
                                )}
                              >
                                Finish Line
                              </span>
                            ) : taskCount > 0 && !isFinal ? (
                              <span
                                className={cn(
                                  "mt-2 text-[9px] font-bold uppercase tracking-widest",
                                  state === "current" && "text-teal-600 dark:text-teal-500",
                                  state === "completed" && "text-teal-500 dark:text-teal-600",
                                  state === "open" && "text-slate-500",
                                  state === "locked" && "text-slate-400 dark:text-slate-700",
                                )}
                              >
                                {taskCount} tasks
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      {/* Popup */}
                      {isSelected && selectedDay ? (
                        <div
                          ref={routeSelectionRef}
                          data-marathon-day-interactive="true"
                          className="pointer-events-none absolute left-0 right-0 top-[132px] z-20 w-full"
                        >
                          <div
                            className={cn(
                              "pointer-events-auto w-full max-w-[380px] rounded-[22px] border p-5",
                              "bg-white/96 backdrop-blur-sm dark:bg-[#0a1525]/96",
                              isFinal
                                ? "border-orange-200 shadow-[0_20px_60px_rgba(0,0,0,0.12)] dark:border-orange-500/20 dark:shadow-[0_20px_60px_rgba(0,0,0,0.65),0_0_40px_rgba(230,81,0,0.07)]"
                                : "border-teal-200 shadow-[0_20px_60px_rgba(0,0,0,0.12)] dark:border-teal-500/15 dark:shadow-[0_20px_60px_rgba(0,0,0,0.65),0_0_40px_rgba(0,178,178,0.06)]",
                            )}
                            style={{
                              marginLeft: `clamp(0px, calc(50% + ${nodeOffsetPx}px - 190px), calc(100% - 380px))`,
                            }}
                          >
                            {/* Header */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <span
                                  className={cn(
                                    "text-[10px] font-bold uppercase tracking-widest",
                                    isFinal
                                      ? "text-orange-600 dark:text-orange-400"
                                      : "text-teal-600 dark:text-teal-400",
                                  )}
                                >
                                  {isFinal ? "Final Day" : `Day ${selectedDay.day_number}`}
                                </span>
                                <h4 className="mt-0.5 line-clamp-1 text-base font-bold text-slate-900 dark:text-white">
                                  {selectedDay.title || `Day ${selectedDay.day_number}`}
                                </h4>
                              </div>
                              <button
                                type="button"
                                data-marathon-day-interactive="true"
                                onClick={() => {
                                  setSelectedDayNumber(null);
                                  setSelectedDay(null);
                                }}
                                className="shrink-0 rounded-lg p-1 text-slate-400 transition hover:text-slate-700 dark:text-slate-600 dark:hover:text-slate-300"
                              >
                                <X className="size-4" />
                              </button>
                            </div>

                            {/* Excerpt */}
                            {selectedDay.content ? (
                              <p className="mt-2.5 line-clamp-2 text-xs leading-5 text-slate-500">
                                {selectedDay.content.split(/\n+/)[0]}
                              </p>
                            ) : null}

                            {/* Task chips */}
                            {selectedDay.reading_passages.length + selectedDay.listening_parts.length > 0 ? (
                              <div className="mt-3 flex flex-wrap gap-1.5">
                                {selectedDay.reading_passages.map((item) => (
                                  <span
                                    key={item.id}
                                    className={cn(
                                      "inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide",
                                      item.attempt_status === "COMPLETED"
                                        ? "bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-400"
                                        : item.attempt_status === "IN_PROGRESS"
                                          ? "bg-sky-100 text-sky-700 dark:bg-sky-500/12 dark:text-sky-400"
                                          : "bg-slate-100 text-slate-500 dark:bg-white/6 dark:text-slate-500",
                                    )}
                                  >
                                    <BookOpen className="size-2.5" />
                                    {item.passage_number_display || "Reading"}
                                  </span>
                                ))}
                                {selectedDay.listening_parts.map((item) => (
                                  <span
                                    key={item.id}
                                    className={cn(
                                      "inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide",
                                      item.attempt_status === "COMPLETED"
                                        ? "bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-400"
                                        : item.attempt_status === "IN_PROGRESS"
                                          ? "bg-sky-100 text-sky-700 dark:bg-sky-500/12 dark:text-sky-400"
                                          : "bg-slate-100 text-slate-500 dark:bg-white/6 dark:text-slate-500",
                                    )}
                                  >
                                    <Headphones className="size-2.5" />
                                    {item.part_number_display || "Listening"}
                                  </span>
                                ))}
                              </div>
                            ) : null}

                            {/* Note */}
                            {detail?.enrollment ? (
                              <div className="mt-3">
                                <textarea
                                  value={noteDraft}
                                  onChange={(e) => setNoteDraft(e.target.value)}
                                  onBlur={() => void handleSaveNote()}
                                  placeholder="Add a note..."
                                  rows={2}
                                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-700 outline-none placeholder:text-slate-400 focus:border-teal-300 focus:bg-white dark:border-white/8 dark:bg-white/4 dark:text-slate-300 dark:placeholder:text-slate-700 dark:focus:border-teal-500/30 dark:focus:bg-white/6"
                                />
                                {noteSaving ? (
                                  <span className="text-[10px] text-teal-600 dark:text-teal-500">Saving...</span>
                                ) : null}
                              </div>
                            ) : null}

                            {/* CTA */}
                            <Link
                              href={`/${locale}/marathons/${marathonId}/days/${selectedDay.day_number}`}
                              className={cn(
                                "mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition",
                                isFinal
                                  ? "bg-orange-50 text-orange-700 hover:bg-orange-100 dark:bg-orange-500/15 dark:text-orange-300 dark:hover:bg-orange-500/25 dark:hover:text-orange-200"
                                  : "bg-teal-50 text-teal-700 hover:bg-teal-100 dark:bg-teal-500/15 dark:text-teal-300 dark:hover:bg-teal-500/25 dark:hover:text-teal-200",
                              )}
                            >
                              Open Day
                              <Zap className="size-3.5" />
                            </Link>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Enrollment CTA */
        <div className="relative overflow-hidden rounded-[28px] border border-teal-100 bg-white p-10 text-center dark:border-teal-500/15 dark:bg-[#060d18]">
          <div className="pointer-events-none absolute inset-0 [background-image:linear-gradient(rgba(0,178,178,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(0,178,178,0.06)_1px,transparent_1px)] [background-size:36px_36px] dark:[background-image:linear-gradient(rgba(0,178,178,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(0,178,178,0.025)_1px,transparent_1px)]" />
          <div className="pointer-events-none absolute left-1/2 top-0 size-[320px] -translate-x-1/2 rounded-full bg-teal-200/30 blur-3xl dark:bg-teal-500/6" />
          <div className="relative">
            <div className="mb-5 inline-flex size-16 items-center justify-center rounded-2xl border border-teal-200 bg-teal-50 dark:border-teal-500/25 dark:bg-teal-500/10">
              <Zap className="size-7 text-teal-600 dark:text-teal-400" />
            </div>
            <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{detail.title}</h3>
            {detail.description ? (
              <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-600 dark:text-slate-400">
                {detail.description}
              </p>
            ) : null}
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {detail.difficulty_display ? (
                <span className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-bold uppercase tracking-widest text-teal-700 dark:border-teal-500/20 dark:bg-teal-500/8 dark:text-teal-400">
                  {detail.difficulty_display}
                </span>
              ) : null}
              {detail.target_band ? (
                <span className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-bold uppercase tracking-widest text-orange-700 dark:border-orange-500/20 dark:bg-orange-500/8 dark:text-orange-400">
                  Band {detail.target_band}
                </span>
              ) : null}
              <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-widest text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
                {Math.max(detail.total_days || 0, detail.marathon_days || 0)} days
              </span>
            </div>
            <Button
              type="button"
              onClick={() => void handleEnroll()}
              disabled={enrollLoading}
              className="mt-7 h-12 rounded-xl border border-teal-600 bg-teal-600 px-8 text-sm font-bold text-white hover:bg-teal-700 dark:border-teal-500/30 dark:bg-teal-500/15 dark:text-teal-300 dark:hover:bg-teal-500/25 dark:hover:text-teal-200"
            >
              {enrollLoading ? t("detail.enrolling") : t("detail.enroll")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
