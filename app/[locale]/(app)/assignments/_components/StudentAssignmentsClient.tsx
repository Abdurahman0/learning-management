"use client";

import {useEffect, useMemo, useState} from "react";
import {useLocale, useTranslations} from "next-intl";
import {useRouter} from "next/navigation";
import {AlertTriangle, ArrowUpDown, BookOpen, CalendarClock, CalendarDays, CheckCircle2, Clock3, FileText, Headphones, Mic, PenSquare, Search, User2} from "lucide-react";

import {
  STUDENT_ASSIGNMENTS,
  STUDENT_ASSIGNMENT_MODULE_FILTERS,
  STUDENT_ASSIGNMENT_STATUS_FILTERS,
  STUDENT_ASSIGNMENT_TEACHERS
} from "@/data/student/assignments";
import type {
  StudentAssignment,
  StudentAssignmentSortKey,
  StudentAssignmentStatus,
  StudentModuleKey
} from "@/types/student";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {cn} from "@/lib/utils";

type Notice = {
  title: string;
  description: string;
};

type AssignmentWithTeacher = StudentAssignment & {
  teacher: (typeof STUDENT_ASSIGNMENT_TEACHERS)[keyof typeof STUDENT_ASSIGNMENT_TEACHERS];
};

const cardClassName =
  "rounded-2xl border border-border/70 bg-card/95 dark:border-slate-700/45 dark:bg-[linear-gradient(155deg,rgba(17,24,39,0.92),rgba(15,23,42,0.9))] shadow-none";

const summaryTone = {
  total: "text-indigo-700 dark:text-indigo-200 border-indigo-400/30 bg-indigo-500/12",
  active: "text-amber-700 dark:text-amber-200 border-amber-400/30 bg-amber-500/12",
  done: "text-emerald-700 dark:text-emerald-200 border-emerald-400/30 bg-emerald-500/12",
  missed: "text-rose-700 dark:text-rose-200 border-rose-400/30 bg-rose-500/12"
} as const;

const statusTone = {
  pending: "border-amber-400/30 bg-amber-500/12 text-amber-700 dark:text-amber-200",
  submitted: "border-blue-400/30 bg-blue-500/12 text-blue-700 dark:text-blue-200",
  reviewed: "border-emerald-400/30 bg-emerald-500/12 text-emerald-700 dark:text-emerald-200",
  overdue: "border-rose-400/30 bg-rose-500/12 text-rose-700 dark:text-rose-200"
} as const;

const urgencyTone = {
  pending: "text-amber-700 dark:text-amber-300",
  submitted: "text-blue-700 dark:text-blue-300",
  reviewed: "text-emerald-700 dark:text-emerald-300",
  overdue: "text-rose-700 dark:text-rose-300"
} as const;

const moduleIconMap: Record<StudentModuleKey, typeof BookOpen> = {
  reading: BookOpen,
  listening: Headphones,
  writing: PenSquare,
  speaking: Mic
};

const moduleBadgeTone = {
  reading: "border-indigo-400/35 bg-indigo-500/12 text-indigo-700 dark:text-indigo-200",
  listening: "border-blue-400/35 bg-blue-500/12 text-blue-700 dark:text-blue-200",
  writing: "border-violet-400/35 bg-violet-500/12 text-violet-700 dark:text-violet-200",
  speaking: "border-cyan-400/35 bg-cyan-500/12 text-cyan-700 dark:text-cyan-200"
} as const;

const statusUrgencyRank: Record<StudentAssignmentStatus, number> = {
  overdue: 0,
  pending: 1,
  submitted: 2,
  reviewed: 3
};

const sortCycle: StudentAssignmentSortKey[] = ["urgent", "deadlineAsc", "deadlineDesc"];

export function StudentAssignmentsClient() {
  const t = useTranslations("studentAssignments");
  const locale = useLocale();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [moduleFilter, setModuleFilter] = useState<"all" | StudentModuleKey>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | StudentAssignmentStatus>("all");
  const [sortKey, setSortKey] = useState<StudentAssignmentSortKey>("urgent");
  const [expandedId, setExpandedId] = useState<string | null>(STUDENT_ASSIGNMENTS[0]?.id ?? null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [nowTs] = useState(() => Date.now());

  const assignments = useMemo<AssignmentWithTeacher[]>(
    () => STUDENT_ASSIGNMENTS.map((item) => ({...item, teacher: STUDENT_ASSIGNMENT_TEACHERS[item.teacherId]})),
    []
  );

  useEffect(() => {
    if (!notice) {
      return;
    }

    const timer = window.setTimeout(() => setNotice(null), 2600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const dateLocale = locale === "uz" ? "uz-UZ" : "en-US";
  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(dateLocale, {month: "short", day: "numeric", year: "numeric"}),
    [dateLocale]
  );
  const monthFormatter = useMemo(() => new Intl.DateTimeFormat(dateLocale, {month: "short"}), [dateLocale]);
  const dayFormatter = useMemo(() => new Intl.DateTimeFormat(dateLocale, {day: "2-digit"}), [dateLocale]);
  const timeFormatter = useMemo(() => new Intl.DateTimeFormat(dateLocale, {hour: "numeric", minute: "2-digit"}), [dateLocale]);

  const getUrgencyLabel = (item: StudentAssignment) => {
    const dueTime = new Date(item.dueAt).getTime();
    const dayMs = 1000 * 60 * 60 * 24;

    if (item.status === "overdue") {
      const lateDays = Math.max(1, Math.ceil((nowTs - dueTime) / dayMs));
      return t("urgency.lateByDays", {days: lateDays});
    }

    if (item.status === "reviewed") {
      return t("urgency.reviewed");
    }

    const dueDays = Math.ceil((dueTime - nowTs) / dayMs);

    if (dueDays <= 0) {
      return t("urgency.dueToday");
    }

    return t("urgency.dueInDays", {days: dueDays});
  };

  const filteredAssignments = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const filtered = assignments.filter((item) => {
      if (moduleFilter !== "all" && item.module !== moduleFilter) {
        return false;
      }

      if (statusFilter !== "all" && item.status !== statusFilter) {
        return false;
      }

      if (!query) {
        return true;
      }

      const haystack = `${item.title} ${item.description} ${item.teacher.name} ${item.module}`.toLowerCase();
      return haystack.includes(query);
    });

    const sorted = [...filtered].sort((left, right) => {
      const leftDue = new Date(left.dueAt).getTime();
      const rightDue = new Date(right.dueAt).getTime();

      if (sortKey === "deadlineAsc") {
        return leftDue - rightDue;
      }

      if (sortKey === "deadlineDesc") {
        return rightDue - leftDue;
      }

      const rankDiff = statusUrgencyRank[left.status] - statusUrgencyRank[right.status];
      if (rankDiff !== 0) {
        return rankDiff;
      }

      return leftDue - rightDue;
    });

    return sorted;
  }, [assignments, moduleFilter, searchQuery, sortKey, statusFilter]);

  const summary = useMemo(() => {
    const total = assignments.length;
    const active = assignments.filter((item) => item.status === "pending").length;
    const done = assignments.filter((item) => item.status === "submitted" || item.status === "reviewed").length;
    const missed = assignments.filter((item) => item.status === "overdue").length;

    return {total, active, done, missed};
  }, [assignments]);

  const upcomingDeadlines = useMemo(() => {
    return assignments
      .filter((item) => item.status !== "overdue" && item.status !== "reviewed" && new Date(item.dueAt).getTime() >= nowTs)
      .sort((left, right) => new Date(left.dueAt).getTime() - new Date(right.dueAt).getTime())
      .slice(0, 3);
  }, [assignments, nowTs]);

  const pushNotice = (title: string, description: string) => {
    setNotice({title, description});
  };

  const handleSortCycle = () => {
    const currentIndex = sortCycle.indexOf(sortKey);
    const next = sortCycle[(currentIndex + 1) % sortCycle.length];
    setSortKey(next);
    pushNotice(t("feedback.sortChanged.title"), t("feedback.sortChanged.description", {sort: t(`filters.sort.${next}`)}));
  };

  const handleMyProgress = () => {
    router.push(`/${locale}/analytics?source=assignments`);
  };

  const handleViewDetails = (id: string) => {
    setExpandedId((current) => (current === id ? null : id));
  };

  const handlePrimaryAction = (item: AssignmentWithTeacher) => {
    if (item.status === "reviewed") {
      router.push(`/${locale}/assignments/${item.id}/feedback`);
      return;
    }

    if (item.status === "overdue") {
      pushNotice(t("feedback.lateSubmission.title"), t("feedback.lateSubmission.description"));
      router.push(`/${locale}/assignments/${item.id}/submit?mode=late`);
      return;
    }

    if (item.status === "submitted") {
      pushNotice(t("feedback.submissionOpened.title"), t("feedback.submissionOpened.description"));
      router.push(`/${locale}/assignments/${item.id}/submit?mode=resubmit`);
      return;
    }

    router.push(`/${locale}/assignments/${item.id}/submit`);
  };

  const handleSecondaryAction = (item: AssignmentWithTeacher) => {
    if (item.status === "reviewed") {
      router.push(`/${locale}${item.practicePath}?source=assignments&assignment=${item.id}`);
      return;
    }

    handleViewDetails(item.id);
  };

  const handleCalendar = () => {
    router.push(`/${locale}/dashboard?tab=calendar`);
  };

  const resetFilters = () => {
    setSearchQuery("");
    setModuleFilter("all");
    setStatusFilter("all");
    setSortKey("urgent");
  };

  const getPrimaryActionLabel = (status: StudentAssignmentStatus) => {
    if (status === "pending") {
      return t("actions.submitWork");
    }

    if (status === "overdue") {
      return t("actions.submitLate");
    }

    if (status === "submitted") {
      return t("actions.updateSubmission");
    }

    return t("actions.viewFeedback");
  };

  const getSecondaryActionLabel = (status: StudentAssignmentStatus) => {
    if (status === "reviewed") {
      return t("actions.practiceAgain");
    }

    return t("actions.viewDetails");
  };

  return (
    <main className="mx-auto min-w-0 w-full max-w-[1780px] overflow-x-hidden px-1.5 py-5 sm:px-4 sm:py-6 lg:px-6">
      <section className="space-y-5 sm:space-y-6">
        <header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{t("title")}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-[15px]">{t("subtitle")}</p>
          </div>
          <Button
            type="button"
            className="h-10 w-full rounded-xl bg-indigo-500 px-4 text-white hover:bg-indigo-400 sm:w-auto"
            onClick={handleMyProgress}
          >
            {t("actions.myProgress")}
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

        <section className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className={cn(cardClassName, "p-4 sm:p-5")}>
            <span className={cn("inline-flex size-9 items-center justify-center rounded-xl border", summaryTone.total)}>
              <FileText className="size-4" />
            </span>
            <p className="mt-3 text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">{t("summary.total.label")}</p>
            <p className="mt-1 text-4xl font-semibold tracking-tight text-foreground">{summary.total}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t("summary.total.meta")}</p>
          </Card>

          <Card className={cn(cardClassName, "p-4 sm:p-5")}>
            <span className={cn("inline-flex size-9 items-center justify-center rounded-xl border", summaryTone.active)}>
              <Clock3 className="size-4" />
            </span>
            <p className="mt-3 text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">{t("summary.active.label")}</p>
            <p className="mt-1 text-4xl font-semibold tracking-tight text-foreground">{summary.active}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t("summary.active.meta")}</p>
          </Card>

          <Card className={cn(cardClassName, "p-4 sm:p-5")}>
            <span className={cn("inline-flex size-9 items-center justify-center rounded-xl border", summaryTone.done)}>
              <CheckCircle2 className="size-4" />
            </span>
            <p className="mt-3 text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">{t("summary.done.label")}</p>
            <p className="mt-1 text-4xl font-semibold tracking-tight text-foreground">{summary.done}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t("summary.done.meta")}</p>
          </Card>

          <Card className={cn(cardClassName, "p-4 sm:p-5")}>
            <span className={cn("inline-flex size-9 items-center justify-center rounded-xl border", summaryTone.missed)}>
              <AlertTriangle className="size-4" />
            </span>
            <p className="mt-3 text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">{t("summary.missed.label")}</p>
            <p className="mt-1 text-4xl font-semibold tracking-tight text-foreground">{summary.missed}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t("summary.missed.meta")}</p>
          </Card>
        </section>

        <section className={cn(cardClassName, "w-full min-w-0 p-4 sm:p-5")}>
          <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(300px,1.6fr)_minmax(170px,0.75fr)_minmax(170px,0.75fr)_auto]">
            <div className="relative min-w-0 sm:col-span-2 xl:col-span-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={t("filters.searchPlaceholder")}
                className="h-10 w-full min-w-0 rounded-xl border-border/70 bg-background/70 pl-9"
              />
            </div>

            <Select value={moduleFilter} onValueChange={(value) => setModuleFilter(value as "all" | StudentModuleKey)}>
              <SelectTrigger className="h-10 w-full min-w-0 rounded-xl border-border/70 bg-background/70 text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STUDENT_ASSIGNMENT_MODULE_FILTERS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {t(option.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "all" | StudentAssignmentStatus)}>
              <SelectTrigger className="h-10 w-full min-w-0 rounded-xl border-border/70 bg-background/70 text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STUDENT_ASSIGNMENT_STATUS_FILTERS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {t(option.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              type="button"
              variant="outline"
              className="h-10 w-full min-w-0 rounded-xl border-border/70 bg-background/70 px-3 text-foreground sm:col-span-2 xl:col-span-1"
              onClick={handleSortCycle}
              title={t("filters.toggleSort")}
            >
              <ArrowUpDown className="size-4" />
              <span className="text-xs">{t(`filters.sort.${sortKey}`)}</span>
            </Button>
          </div>
        </section>

        <section className="grid min-w-0 items-start gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.9fr)]">
          <section className="min-w-0 space-y-4">
            {assignments.length === 0 ? (
              <Card className={cn(cardClassName, "p-6")}>
                <h3 className="text-lg font-semibold text-foreground">{t("empty.all.title")}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{t("empty.all.description")}</p>
              </Card>
            ) : null}

            {assignments.length > 0 && filteredAssignments.length === 0 ? (
              <Card className={cn(cardClassName, "p-6")}>
                <h3 className="text-lg font-semibold text-foreground">{t("empty.filtered.title")}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{t("empty.filtered.description")}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 rounded-xl border-border/70 bg-background/70"
                    onClick={resetFilters}
                  >
                    {t("actions.resetFilters")}
                  </Button>
                  <Button type="button" className="h-9 rounded-xl bg-indigo-500 text-white hover:bg-indigo-400" onClick={() => router.push(`/${locale}/reading`)}>
                    {t("actions.goToPractice")}
                  </Button>
                </div>
              </Card>
            ) : null}

            {filteredAssignments.map((item) => {
              const ModuleIcon = moduleIconMap[item.module];
              const isExpanded = expandedId === item.id;
              const dueDate = dateFormatter.format(new Date(item.dueAt));

              return (
                <Card
                  key={item.id}
                  className={cn(
                    cardClassName,
                    "w-full min-w-0 max-w-full overflow-hidden p-4 sm:p-5",
                    isExpanded ? "border-indigo-400/50" : "border-border/70"
                  )}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <button type="button" className="block w-full min-w-0 text-left" onClick={() => handleViewDetails(item.id)}>
                        <div className="flex min-w-0 items-start gap-3">
                          <span className={cn("mt-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-lg border", moduleBadgeTone[item.module])}>
                            <ModuleIcon className="size-4" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <h3 className="break-words [overflow-wrap:anywhere] text-lg leading-snug font-semibold tracking-tight text-foreground sm:text-xl">{item.title}</h3>
                            <p className="mt-1 flex min-w-0 flex-wrap items-start gap-1.5 break-words text-sm text-muted-foreground">
                              <User2 className="size-3.5" />
                              {t("list.assignedBy", {name: item.teacher.name})}
                            </p>
                          </div>
                        </div>
                      </button>
                    </div>

                    <div className="min-w-0 space-y-1 text-left sm:flex sm:items-center sm:justify-between sm:gap-3 sm:space-y-0 lg:block lg:text-right">
                      <Badge className={cn("border font-semibold uppercase", statusTone[item.status])}>{t(`status.${item.status}`)}</Badge>
                      <div className="min-w-0 sm:text-right lg:text-right">
                        <p className={cn("break-words text-sm font-medium", urgencyTone[item.status])}>{getUrgencyLabel(item)}</p>
                        <p className="break-words text-sm text-muted-foreground">{dueDate}</p>
                      </div>
                    </div>
                  </div>

                  {item.metaKey ? (
                    <div className="mt-4 min-w-0 rounded-lg border border-border/70 bg-background/65 px-3 py-2 text-sm text-muted-foreground break-words [overflow-wrap:anywhere]">
                      {t(`meta.${item.metaKey}`)}
                    </div>
                  ) : null}

                  {isExpanded ? (
                    <div className="mt-4 rounded-xl border border-border/70 bg-background/65 p-4">
                      <p className="text-sm leading-relaxed text-foreground/90 break-words [overflow-wrap:anywhere]">{item.description}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>{t("list.estimatedTime", {minutes: item.estimatedMinutes})}</span>
                        <span className="text-border">-</span>
                        <span>{t("list.assignedDate", {date: dateFormatter.format(new Date(item.assignedAt))})}</span>
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-4 grid min-w-0 grid-cols-1 gap-2 border-t border-border/70 pt-4 sm:grid-cols-2 md:flex md:flex-wrap md:items-center md:justify-end">
                    <Button
                      type="button"
                      className={cn(
                        "h-9 w-full min-w-0 rounded-xl px-4 text-white sm:flex-1 md:w-auto md:flex-none",
                        item.status === "overdue" ? "bg-rose-500 hover:bg-rose-400" : "bg-indigo-500 hover:bg-indigo-400"
                      )}
                      onClick={() => handlePrimaryAction(item)}
                    >
                      {getPrimaryActionLabel(item.status)}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-9 w-full min-w-0 rounded-xl border-border/70 bg-background/70 sm:flex-1 md:w-auto md:flex-none"
                      onClick={() => handleSecondaryAction(item)}
                    >
                      {getSecondaryActionLabel(item.status)}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </section>

          <aside className="space-y-4 xl:sticky xl:top-6">
            <Card className={cn(cardClassName, "p-4 sm:p-5")}>
              <CardHeader className="p-0">
                <CardTitle className="flex items-center justify-between gap-2 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                  {t("deadlines.title")}
                  <CalendarDays className="size-5 text-muted-foreground" />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-0 pt-4">
                {upcomingDeadlines.length === 0 ? (
                  <p className="rounded-xl border border-border/70 bg-background/70 p-3 text-sm text-muted-foreground">{t("deadlines.empty")}</p>
                ) : (
                  upcomingDeadlines.map((item) => {
                    const dueDate = new Date(item.dueAt);
                    const monthText = monthFormatter.format(dueDate).toUpperCase();
                    const dayText = dayFormatter.format(dueDate);

                    return (
                      <div key={item.id} className="flex items-center gap-3 rounded-xl border border-border/70 bg-background/70 p-3">
                        <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg border border-indigo-400/35 bg-indigo-500/12">
                          <span className="text-[10px] font-semibold tracking-[0.06em] text-indigo-700 dark:text-indigo-300">{monthText}</span>
                          <span className="text-lg leading-none font-semibold text-foreground">{dayText}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">{item.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.isAnytime ? t("deadlines.anytime") : timeFormatter.format(dueDate)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}

                <Button type="button" variant="link" className="h-auto px-0 text-indigo-600 dark:text-indigo-300" onClick={handleCalendar}>
                  {t("actions.viewFullCalendar")}
                </Button>
              </CardContent>
            </Card>

            <Card className={cn(cardClassName, "p-4 sm:p-5")}>
              <CardHeader className="p-0">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
                  <CalendarClock className="size-4.5 text-indigo-600 dark:text-indigo-300" />
                  {t("studyTip.title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 pt-3">
                <p className="text-sm leading-relaxed text-foreground/90">{t("studyTip.content")}</p>
                <p className="mt-3 text-xs font-medium tracking-[0.06em] text-muted-foreground uppercase">{t("studyTip.author")}</p>
              </CardContent>
            </Card>
          </aside>
        </section>
      </section>
    </main>
  );
}
