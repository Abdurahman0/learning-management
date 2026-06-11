"use client";

import Link from "next/link";
import {ArrowLeft, BookOpen, ExternalLink, FileText, Headphones, Link2, Youtube} from "lucide-react";
import {useEffect, useMemo, useState, type ReactNode} from "react";
import {useLocale} from "next-intl";

import {Button} from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card";
import {cn} from "@/lib/utils";
import {ReadingTestCard} from "@/app/[locale]/(app)/_components/reading/ReadingTestCard";
import {ListeningTestCard} from "@/app/[locale]/(app)/_components/listening/ListeningTestCard";
import type {
  Difficulty,
  ListeningTestItem,
  ReadingGuestTest,
} from "@/app/[locale]/(app)/_components/tests/types";
import {studentMarathonService} from "@/src/services/student/marathon.service";
import type {
  StudentMarathonDayContentItem,
  StudentMarathonDayDetail,
  StudentMarathonListeningDayItem,
} from "@/src/services/student/marathon.types";
import {StudentApiError} from "@/src/services/student/types";

import {MarathonSurface} from "./MarathonSurface";

type MarathonDayPageClientProps = {
  marathonId: string;
  dayNumber: number;
};

type WorkspaceSection = "reading" | "listening" | "resources";

function SectionButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-sm font-medium transition-colors",
        active
          ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300"
          : "text-foreground hover:bg-muted",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function buildMarathonTaskHref(params: {
  locale: string;
  marathonId: string;
  dayNumber: number;
  route: "reading" | "listening";
  contentId: string;
  attemptStatus: string | null;
  attemptId: string | null;
}) {
  const query = new URLSearchParams({
    mode: "practice",
    marathonId: params.marathonId,
    dayNumber: String(params.dayNumber),
    returnTo: `/${params.locale}/marathons/${params.marathonId}/days/${params.dayNumber}`,
    returnLabel: "Back to marathon day",
  });

  if (params.attemptStatus === "COMPLETED" && params.attemptId) {
    query.set("review", "1");
    query.set("attempt", params.attemptId);
  }

  return `/${params.locale}/${params.route}/${params.contentId}?${query.toString()}`;
}

function normalizeDifficulty(value: string | null): Difficulty {
  const normalized = value?.trim().toLowerCase();
  if (normalized === "easy" || normalized === "beginner") return "easy";
  if (normalized === "hard" || normalized === "advanced") return "hard";
  return "medium";
}

function toReadingTest(item: StudentMarathonDayContentItem): ReadingGuestTest {
  const difficulty = normalizeDifficulty(item.difficulty_level);
  return {
    id: item.id,
    title: item.title,
    testFormat: "part",
    isPremium: false,
    durationMinutes: item.estimated_time_minutes ?? 20,
    totalQuestions: item.max_questions,
    difficulty,
    practiceSource: "custom",
    passages: [{
      id: item.id,
      title: item.title,
      questionsCount: item.max_questions,
      difficulty,
    }],
  };
}

function toListeningTest(item: StudentMarathonListeningDayItem): ListeningTestItem {
  const difficulty = normalizeDifficulty(item.difficulty_level);
  return {
    id: item.id,
    title: item.title,
    testFormat: "part",
    isPremium: false,
    difficulty,
    practiceSource: "custom",
    durationMins: item.estimated_time_minutes ?? 10,
    durationMinutes: item.estimated_time_minutes ?? 10,
    totalQuestions: item.max_questions,
    sectionsCount: 1,
    sections: [{
      id: item.id,
      title: item.title,
      label: item.title,
      questions: item.max_questions,
    }],
  };
}

function getAttemptBadgeLabel(status: string | null) {
  if (status === "COMPLETED") return "Completed";
  if (status === "IN_PROGRESS") return "In progress";
  return "Marathon";
}

function getResourceMeta(rawUrl: string) {
  try {
    const url = new URL(rawUrl);
    const hostname = url.hostname.replace(/^www\./, "");
    const isYoutube = hostname === "youtu.be" || hostname.endsWith("youtube.com");
    if (isYoutube) {
      return {
        label: "YouTube video",
        icon: Youtube,
        accentClass: "bg-red-500/10 text-red-600 dark:bg-red-500/15 dark:text-red-300",
      };
    }

    const filename = decodeURIComponent(url.pathname.split("/").filter(Boolean).at(-1) ?? "");
    const extension = filename.match(/\.([a-z0-9]{2,8})$/i)?.[1]?.toUpperCase();
    if (extension) {
      return {
        label: `${extension} file`,
        icon: FileText,
        accentClass: "bg-blue-500/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
      };
    }

    return {
      label: hostname || "External link",
      icon: Link2,
      accentClass: "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    };
  } catch {
    return {
      label: "External link",
      icon: Link2,
      accentClass: "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    };
  }
}

export function MarathonDayPageClient({
  marathonId,
  dayNumber,
}: MarathonDayPageClientProps) {
  const locale = useLocale();
  const [day, setDay] = useState<StudentMarathonDayDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<WorkspaceSection>("reading");

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await studentMarathonService.getDay(marathonId, dayNumber);
        if (!active) return;
        setDay(response);
      } catch (cause) {
        if (!active) return;
        setDay(null);
        setError(cause instanceof StudentApiError ? cause.message : "Could not load this marathon day.");
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [dayNumber, marathonId]);

  useEffect(() => {
    if (!day) return;
    if (day.reading_passages.length) {
      setActiveSection("reading");
      return;
    }
    if (day.listening_parts.length) {
      setActiveSection("listening");
      return;
    }
    setActiveSection("resources");
  }, [day]);

  const availableSections = useMemo(() => {
    if (!day) return [] as WorkspaceSection[];
    const sections: WorkspaceSection[] = [];
    if (day.reading_passages.length) sections.push("reading");
    if (day.listening_parts.length) sections.push("listening");
    if (day.external_links.length) sections.push("resources");
    return sections;
  }, [day]);

  const sidebarContent = (
    <div className="space-y-2">
      <div className="px-1 pb-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Day {dayNumber}</p>
      </div>
      {availableSections.includes("reading") ? (
        <SectionButton
          active={activeSection === "reading"}
          onClick={() => setActiveSection("reading")}
          icon={<BookOpen className="size-4" />}
          label="Reading"
        />
      ) : null}
      {availableSections.includes("listening") ? (
        <SectionButton
          active={activeSection === "listening"}
          onClick={() => setActiveSection("listening")}
          icon={<Headphones className="size-4" />}
          label="Listening"
        />
      ) : null}
      {availableSections.includes("resources") ? (
        <SectionButton
          active={activeSection === "resources"}
          onClick={() => setActiveSection("resources")}
          icon={<Link2 className="size-4" />}
          label="Resources"
        />
      ) : null}
    </div>
  );

  return (
    <MarathonSurface
      title={`Marathon Day ${dayNumber}`}
      subtitle="Open the reading, listening, or resource blocks assigned to this marathon day."
      showLeaderboardNav
      sidebarContent={sidebarContent}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <Button asChild variant="outline" className="rounded-2xl">
            <Link href={`/${locale}/marathons/${marathonId}`}>
              <ArrowLeft className="size-4" />
              Back to journey
            </Link>
          </Button>
        </div>

        {loading ? (
          <Card className="rounded-[28px] border border-slate-200 bg-white/94 dark:border-white/10 dark:bg-white/7">
            <CardContent className="h-80 p-5" />
          </Card>
        ) : error || !day ? (
          <Card className="rounded-[28px] border border-rose-200 bg-rose-50 dark:border-rose-300/20 dark:bg-rose-500/10">
            <CardContent className="p-4 text-sm text-rose-700 dark:text-rose-100">{error ?? "Could not load this marathon day."}</CardContent>
          </Card>
        ) : (
          <>
            {activeSection === "reading" ? (
              day.reading_passages.length ? (
                day.reading_passages.map((item) => (
                  <ReadingTestCard
                    key={item.id}
                    test={toReadingTest(item)}
                    badgeLabel={getAttemptBadgeLabel(item.attempt_status)}
                    resourceLink={item.external_link
                      ? {
                          href: item.external_link.url,
                          label: item.external_link.title || "Watch video",
                        }
                      : undefined}
                    action={{
                      href: buildMarathonTaskHref({
                        locale,
                        marathonId,
                        dayNumber,
                        route: "reading",
                        contentId: item.id,
                        attemptStatus: item.attempt_status,
                        attemptId: item.attempt_id,
                      }),
                      label: item.attempt_status === "COMPLETED"
                        ? "Review reading"
                        : item.attempt_status === "IN_PROGRESS"
                          ? "Continue reading"
                          : "Start reading",
                    }}
                  />
                ))
              ) : (
                <Card className="rounded-[24px] border border-slate-200 bg-white/94 dark:border-white/10 dark:bg-white/7">
                  <CardContent className="p-5 text-sm text-slate-600 dark:text-slate-300">No reading content added to this day.</CardContent>
                </Card>
              )
            ) : null}

            {activeSection === "listening" ? (
              day.listening_parts.length ? (
                day.listening_parts.map((item) => (
                  <ListeningTestCard
                    key={item.id}
                    test={toListeningTest(item)}
                    badgeLabel={getAttemptBadgeLabel(item.attempt_status)}
                    resourceLink={item.external_link
                      ? {
                          href: item.external_link.url,
                          label: item.external_link.title || "Watch video",
                        }
                      : undefined}
                    action={{
                      href: buildMarathonTaskHref({
                        locale,
                        marathonId,
                        dayNumber,
                        route: "listening",
                        contentId: item.id,
                        attemptStatus: item.attempt_status,
                        attemptId: item.attempt_id,
                      }),
                      label: item.attempt_status === "COMPLETED"
                        ? "Review listening"
                        : item.attempt_status === "IN_PROGRESS"
                          ? "Continue listening"
                          : "Start listening",
                    }}
                  />
                ))
              ) : (
                <Card className="rounded-[24px] border border-slate-200 bg-white/94 dark:border-white/10 dark:bg-white/7">
                  <CardContent className="p-5 text-sm text-slate-600 dark:text-slate-300">No listening content added to this day.</CardContent>
                </Card>
              )
            ) : null}

            {activeSection === "resources" ? (
              day.external_links.length ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                  {[...day.external_links]
                    .sort((left, right) => left.order - right.order)
                    .map((link) => {
                      const resource = getResourceMeta(link.url);
                      const ResourceIcon = resource.icon;

                      return (
                        <a
                          key={link.id}
                          href={link.url}
                          target="_blank"
                          rel="noreferrer"
                          className="group relative flex aspect-square min-h-36 flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-blue-400/70 hover:bg-accent/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <span className={cn("inline-flex size-10 items-center justify-center rounded-xl", resource.accentClass)}>
                              <ResourceIcon className="size-5" aria-hidden="true" />
                            </span>
                            <ExternalLink className="size-4 text-muted-foreground transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-300" aria-hidden="true" />
                          </div>

                          <div className="min-w-0">
                            <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground sm:text-base">
                              {link.title}
                            </h3>
                            <p className="mt-1.5 truncate text-xs font-medium text-muted-foreground">
                              {resource.label}
                            </p>
                          </div>
                        </a>
                      );
                    })}
                </div>
              ) : (
                <Card className="rounded-[24px] border border-slate-200 bg-white/94 dark:border-white/10 dark:bg-white/7">
                  <CardContent className="p-5 text-sm text-slate-600 dark:text-slate-300">No resources added to this day.</CardContent>
                </Card>
              )
            ) : null}
          </>
        )}
      </div>
    </MarathonSurface>
  );
}
