"use client";

import Link from "next/link";
import {ArrowLeft, BookOpen, ExternalLink, Headphones, Link2} from "lucide-react";
import {useEffect, useMemo, useState, type ReactNode} from "react";
import {useLocale} from "next-intl";

import {Button} from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card";
import {cn} from "@/lib/utils";
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

function ReadingCard({
  item,
  href,
}: {
  item: StudentMarathonDayContentItem;
  href: string;
}) {
  return (
    <Card className="rounded-[24px] border border-slate-200 bg-white/94 dark:border-white/10 dark:bg-white/7">
      <CardContent className="space-y-4 p-5">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-slate-950 dark:text-white">{item.title}</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {item.max_questions} questions
            {item.estimated_time_minutes ? ` • ${item.estimated_time_minutes} min` : ""}
          </p>
        </div>
        <Button asChild className="rounded-2xl bg-slate-950 text-white hover:bg-slate-800 dark:bg-white/10 dark:hover:bg-white/15">
          <Link href={href}>
            {item.attempt_status === "COMPLETED" ? "Review reading" : item.attempt_status === "IN_PROGRESS" ? "Continue reading" : "Start reading"}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function ListeningCard({
  item,
  href,
}: {
  item: StudentMarathonListeningDayItem;
  href: string;
}) {
  return (
    <Card className="rounded-[24px] border border-slate-200 bg-white/94 dark:border-white/10 dark:bg-white/7">
      <CardContent className="space-y-4 p-5">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-slate-950 dark:text-white">{item.title}</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {item.max_questions} questions
            {item.estimated_time_minutes ? ` • ${item.estimated_time_minutes} min` : ""}
          </p>
        </div>
        <Button asChild className="rounded-2xl bg-slate-950 text-white hover:bg-slate-800 dark:bg-white/10 dark:hover:bg-white/15">
          <Link href={href}>
            {item.attempt_status === "COMPLETED" ? "Review listening" : item.attempt_status === "IN_PROGRESS" ? "Continue listening" : "Start listening"}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
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
                  <ReadingCard
                    key={item.id}
                    item={item}
                    href={buildMarathonTaskHref({
                      locale,
                      marathonId,
                      dayNumber,
                      route: "reading",
                      contentId: item.id,
                      attemptStatus: item.attempt_status,
                      attemptId: item.attempt_id,
                    })}
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
                  <ListeningCard
                    key={item.id}
                    item={item}
                    href={buildMarathonTaskHref({
                      locale,
                      marathonId,
                      dayNumber,
                      route: "listening",
                      contentId: item.id,
                      attemptStatus: item.attempt_status,
                      attemptId: item.attempt_id,
                    })}
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
                day.external_links.map((link) => (
                  <Card key={link.id} className="rounded-[24px] border border-slate-200 bg-white/94 dark:border-white/10 dark:bg-white/7">
                    <CardContent className="flex items-center justify-between gap-4 p-5">
                      <div className="min-w-0">
                        <h3 className="truncate text-base font-semibold text-slate-950 dark:text-white">{link.title}</h3>
                        <p className="mt-1 truncate text-sm text-slate-600 dark:text-slate-300">{link.url}</p>
                      </div>
                      <Button asChild variant="outline" className="rounded-2xl">
                        <a href={link.url} target="_blank" rel="noreferrer">
                          <ExternalLink className="size-4" />
                          Open
                        </a>
                      </Button>
                    </CardContent>
                  </Card>
                ))
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
