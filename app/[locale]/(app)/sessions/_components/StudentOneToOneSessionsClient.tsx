"use client";

import {useEffect, useMemo, useState} from "react";
import {useLocale, useTranslations} from "next-intl";
import {useRouter} from "next/navigation";
import {CalendarClock, CheckCircle2, Clock3, Video} from "lucide-react";

import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {STUDENT_ASSIGNMENT_TEACHERS} from "@/data/student/assignments";
import {
  STUDENT_ONE_TO_ONE_AVAILABILITY,
  getStudentOneToOneSessions,
  getTeacherNameBySessionTeacherId
} from "@/data/student/sessions";
import {STUDENT_PROFILE} from "@/data/student/performance";
import type {StudentOneToOneSession, StudentOneToOneSessionStatus} from "@/types/student";
import {cn} from "@/lib/utils";

type Notice = {
  title: string;
  description: string;
};

const statusToneClass: Record<StudentOneToOneSessionStatus, string> = {
  scheduled: "border-indigo-400/35 bg-indigo-500/12 text-indigo-700 dark:text-indigo-200",
  completed: "border-emerald-400/35 bg-emerald-500/12 text-emerald-700 dark:text-emerald-200",
  pending: "border-amber-400/35 bg-amber-500/12 text-amber-700 dark:text-amber-200",
  cancelled: "border-rose-400/35 bg-rose-500/12 text-rose-700 dark:text-rose-200"
};

const cardClassName =
  "rounded-2xl border border-border/70 bg-card/95 dark:border-slate-700/45 dark:bg-[linear-gradient(155deg,rgba(17,24,39,0.92),rgba(15,23,42,0.9))] shadow-none";

export function StudentOneToOneSessionsClient() {
  const t = useTranslations("studentSessions");
  const locale = useLocale();
  const router = useRouter();

  const [teacherFilter, setTeacherFilter] = useState<"all" | keyof typeof STUDENT_ASSIGNMENT_TEACHERS>("all");
  const [notice, setNotice] = useState<Notice | null>(null);
  const [bookedSlotIds, setBookedSlotIds] = useState<string[]>([]);
  const [nowTs] = useState(() => Date.now());

  useEffect(() => {
    if (!notice) {
      return;
    }

    const timer = window.setTimeout(() => setNotice(null), 2600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const dateLocale = locale === "uz" ? "uz-UZ" : "en-US";
  const dateFormatter = useMemo(() => new Intl.DateTimeFormat(dateLocale, {month: "short", day: "numeric"}), [dateLocale]);
  const timeFormatter = useMemo(() => new Intl.DateTimeFormat(dateLocale, {hour: "numeric", minute: "2-digit"}), [dateLocale]);

  const sessions = useMemo(() => getStudentOneToOneSessions(STUDENT_PROFILE.id), []);

  const summary = useMemo(() => {
    const upcoming = sessions.filter((session) => session.status !== "cancelled" && new Date(session.startsAt).getTime() > nowTs).length;
    const completed = sessions.filter((session) => session.status === "completed").length;

    return {
      total: sessions.length,
      upcoming,
      completed
    };
  }, [nowTs, sessions]);

  const filteredSessions = useMemo(() => {
    if (teacherFilter === "all") {
      return sessions;
    }

    return sessions.filter((session) => session.teacherId === teacherFilter);
  }, [sessions, teacherFilter]);

  const filteredAvailability = useMemo(() => {
    if (teacherFilter === "all") {
      return STUDENT_ONE_TO_ONE_AVAILABILITY;
    }

    return STUDENT_ONE_TO_ONE_AVAILABILITY.filter((slot) => slot.teacherId === teacherFilter);
  }, [teacherFilter]);

  const pushNotice = (title: string, description: string) => {
    setNotice({title, description});
  };

  const handleSessionAction = (session: StudentOneToOneSession) => {
    if (session.status === "completed") {
      router.push(`/${locale}/analytics`);
      return;
    }

    pushNotice(t("feedback.join.title"), t("feedback.join.description"));
  };

  const handleBookSlot = (slotId: string, available: boolean) => {
    if (!available || bookedSlotIds.includes(slotId)) {
      return;
    }

    setBookedSlotIds((current) => [...current, slotId]);
    pushNotice(t("feedback.booked.title"), t("feedback.booked.description"));
  };

  return (
    <main className="mx-auto min-w-0 w-full max-w-445 overflow-x-hidden px-2 py-5 sm:px-4 sm:py-6 lg:px-6">
      <section className="space-y-5 sm:space-y-6">
        <header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{t("title")}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-[15px]">{t("subtitle")}</p>
          </div>
          <Button type="button" className="h-10 w-full rounded-xl bg-indigo-500 px-4 text-white hover:bg-indigo-400 sm:w-auto" onClick={() => router.push(`/${locale}/assignments`)}>
            {t("actions.openAssignments")}
          </Button>
        </header>

        {notice ? (
          <Card className="rounded-xl border border-blue-400/35 bg-blue-500/10 shadow-none">
            <CardContent className="p-3">
              <p className="text-sm font-semibold text-blue-700 dark:text-blue-100">{notice.title}</p>
              <p className="text-sm text-blue-700/90 dark:text-blue-100/85">{notice.description}</p>
            </CardContent>
          </Card>
        ) : null}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className={cn(cardClassName, "p-4 sm:p-5")}>
            <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">{t("summary.total")}</p>
            <p className="mt-1 text-4xl font-semibold tracking-tight text-foreground">{summary.total}</p>
          </Card>
          <Card className={cn(cardClassName, "p-4 sm:p-5")}>
            <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">{t("summary.upcoming")}</p>
            <p className="mt-1 text-4xl font-semibold tracking-tight text-foreground">{summary.upcoming}</p>
          </Card>
          <Card className={cn(cardClassName, "p-4 sm:p-5")}>
            <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">{t("summary.completed")}</p>
            <p className="mt-1 text-4xl font-semibold tracking-tight text-foreground">{summary.completed}</p>
          </Card>
        </section>

        <section className={cn(cardClassName, "p-4 sm:p-5")}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-foreground">{t("filters.teacher")}</p>
            <Select value={teacherFilter} onValueChange={(value) => setTeacherFilter(value as "all" | keyof typeof STUDENT_ASSIGNMENT_TEACHERS)}>
              <SelectTrigger className="h-10 w-full rounded-xl border-border/70 bg-background/70 sm:w-55">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("filters.allTeachers")}</SelectItem>
                {Object.values(STUDENT_ASSIGNMENT_TEACHERS).map((teacher) => (
                  <SelectItem key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </section>

        <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)]">
          <Card className={cn(cardClassName, "min-w-0")}>
            <CardHeader>
              <CardTitle>{t("sessions.title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {filteredSessions.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border/70 bg-background/60 p-3 text-sm text-muted-foreground">{t("sessions.empty")}</p>
              ) : null}

              {filteredSessions.map((session) => {
                const teacherName = getTeacherNameBySessionTeacherId(session.teacherId);
                const date = dateFormatter.format(new Date(session.startsAt));
                const startTime = timeFormatter.format(new Date(session.startsAt));
                const endTime = timeFormatter.format(new Date(session.endsAt));

                return (
                  <div key={session.id} className="rounded-xl border border-border/70 bg-background/60 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-foreground">{session.title}</p>
                      <Badge className={cn("border", statusToneClass[session.status])}>{t(`status.${session.status}`)}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{teacherName}</p>
                    <div className="mt-2 inline-flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Clock3 className="size-3.5" />
                        {date} {startTime}-{endTime}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Video className="size-3.5" />
                        {t(`meetingType.${session.meetingType}`)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-foreground/90">{session.purpose}</p>
                    {session.note ? <p className="mt-1 text-xs text-muted-foreground">{session.note}</p> : null}
                    <Button type="button" variant="outline" className="mt-3 h-9 rounded-xl border-border/70 bg-background/70" onClick={() => handleSessionAction(session)}>
                      {session.status === "completed" ? t("actions.viewRecap") : t("actions.joinSession")}
                    </Button>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card className={cn(cardClassName, "min-w-0")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarClock className="size-4.5 text-indigo-600 dark:text-indigo-300" />
                {t("availability.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {filteredAvailability.map((slot) => {
                const teacherName = getTeacherNameBySessionTeacherId(slot.teacherId);
                const date = dateFormatter.format(new Date(slot.startsAt));
                const startTime = timeFormatter.format(new Date(slot.startsAt));
                const endTime = timeFormatter.format(new Date(slot.endsAt));
                const isBookedLocally = bookedSlotIds.includes(slot.id);
                const canBook = slot.available && !isBookedLocally;

                return (
                  <div key={slot.id} className="rounded-xl border border-border/70 bg-background/60 p-3">
                    <p className="font-medium text-foreground">{teacherName}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {date} {startTime}-{endTime}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{t(`meetingType.${slot.meetingType}`)}</p>
                    <Button
                      type="button"
                      className={cn(
                        "mt-3 h-8 rounded-lg px-3 text-xs text-white",
                        canBook ? "bg-indigo-500 hover:bg-indigo-400" : "bg-muted text-muted-foreground hover:bg-muted"
                      )}
                      onClick={() => handleBookSlot(slot.id, canBook)}
                      disabled={!canBook}
                    >
                      {isBookedLocally ? (
                        <>
                          <CheckCircle2 className="size-3.5" />
                          {t("actions.booked")}
                        </>
                      ) : slot.available ? (
                        t("actions.bookSlot")
                      ) : (
                        t("actions.slotUnavailable")
                      )}
                    </Button>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </section>
      </section>
    </main>
  );
}
