"use client";

import {useEffect, useMemo, useRef, useState} from "react";
import {CheckCircle2} from "lucide-react";
import {useTranslations, useLocale} from "next-intl";
import {useRouter} from "next/navigation";

import {createTeacherNote} from "@/data/teacher/notes";
import {getTeacherProfile, type TeacherStudentProfileData} from "@/data/teacher/selectors";

import {TeacherSidebar} from "../../../_components/TeacherSidebar";
import {TeacherTopbar} from "../../../_components/TeacherTopbar";
import {TeacherStudentAssignmentsCard} from "./TeacherStudentAssignmentsCard";
import {TeacherStudentAttemptsTable} from "./TeacherStudentAttemptsTable";
import {TeacherStudentBandProgressCard} from "./TeacherStudentBandProgressCard";
import {TeacherStudentNotesCard} from "./TeacherStudentNotesCard";
import {TeacherStudentOverviewCard} from "./TeacherStudentOverviewCard";
import {TeacherStudentProfileHeader} from "./TeacherStudentProfileHeader";
import {TeacherStudentRecentActivityCard} from "./TeacherStudentRecentActivityCard";
import {TeacherStudentWeakAreasCard} from "./TeacherStudentWeakAreasCard";

type TeacherStudentProfilePageClientProps = {
  profile: TeacherStudentProfileData;
};

function formatDate(locale: string, value: string) {
  return new Intl.DateTimeFormat(locale, {month: "short", day: "numeric", year: "numeric"}).format(new Date(value));
}

function formatLastActivity(
  t: ReturnType<typeof useTranslations>,
  activity: TeacherStudentProfileData["student"]["lastActivity"]
) {
  if (activity.key === "justNow") {
    return t("relative.justNow");
  }

  if (activity.key === "minutesAgo") {
    return t("relative.minutesAgo", {value: activity.value ?? 0});
  }

  if (activity.key === "hoursAgo") {
    return t("relative.hoursAgo", {value: activity.value ?? 0});
  }

  if (activity.key === "yesterday") {
    return t("relative.yesterday");
  }

  return t("relative.daysAgo", {value: activity.value ?? 2});
}

export function TeacherStudentProfilePageClient({profile}: TeacherStudentProfilePageClientProps) {
  const t = useTranslations("teacherStudentProfile");
  const locale = useLocale();
  const router = useRouter();
  const teacher = useMemo(() => getTeacherProfile(), []);
  const noteInputRef = useRef<HTMLTextAreaElement>(null);

  const [notes, setNotes] = useState(profile.initialNotes);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!actionMessage) {
      return;
    }

    const timer = window.setTimeout(() => setActionMessage(null), 2600);
    return () => window.clearTimeout(timer);
  }, [actionMessage]);

  const handleAssignTask = () => {
    router.push(`/${locale}/teacher/assignments?studentId=${profile.student.id}`);
  };

  const handleSendMessage = () => {
    router.push(`/${locale}/teacher/messages?studentId=${profile.student.id}`);
  };

  const handleAddTeacherNote = () => {
    noteInputRef.current?.focus();
    noteInputRef.current?.scrollIntoView({behavior: "smooth", block: "center"});
    setActionMessage(t("feedback.readyToAddNote"));
  };

  const handleViewAttempt = (attemptId: string) => {
    setActionMessage(t("feedback.openAttempt", {id: attemptId}));
  };

  const handleCreateAssignment = () => {
    router.push(`/${locale}/teacher/assignments?studentId=${profile.student.id}`);
  };

  const handleAssignmentAction = (assignmentId: string, action: "edit" | "review" | "viewReport") => {
    if (action === "review") {
      router.push(`/${locale}/teacher/reviews?assignmentId=${assignmentId}&studentId=${profile.student.id}`);
      return;
    }

    if (action === "edit") {
      router.push(`/${locale}/teacher/assignments?assignmentId=${assignmentId}&studentId=${profile.student.id}`);
      return;
    }

    setActionMessage(t("feedback.assignmentAction", {action: t(action), id: assignmentId}));
  };

  const handleSaveNote = (content: string) => {
    const created = createTeacherNote({
      studentId: profile.student.id,
      teacherId: teacher.id,
      teacherName: teacher.name.replace("Dr. ", ""),
      content
    });

    setNotes((current) => [created, ...current]);
    setActionMessage(t("feedback.noteSaved"));
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <TeacherSidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <TeacherTopbar title={profile.student.name} />

          <main className="mx-auto min-w-0 w-full max-w-[1480px] space-y-5 overflow-x-hidden px-4 py-5 sm:px-6 lg:px-8">
            <TeacherStudentProfileHeader
              studentName={profile.student.name}
              progressHref={`/${locale}/teacher/students/${profile.student.id}/progress`}
            />

            <TeacherStudentOverviewCard
              studentName={profile.student.name}
              studentFallback={profile.student.avatarFallback}
              targetBand={profile.student.targetBand}
              currentBand={profile.student.estimatedBand}
              joinedDateLabel={formatDate(locale, profile.joinedAt)}
              lastActivityLabel={formatLastActivity(t, profile.student.lastActivity)}
              testsDone={profile.testsDone}
              streakDays={profile.streakDays}
              onAssignTask={handleAssignTask}
              onSendMessage={handleSendMessage}
              onAddTeacherNote={handleAddTeacherNote}
            />

            <section className="grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.8fr)]">
              <TeacherStudentBandProgressCard points={profile.bandProgress} />
              <TeacherStudentWeakAreasCard weakAreas={profile.weakAreas} recommendation={profile.recommendation} />
            </section>

            <section className="grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.8fr)]">
              <TeacherStudentAttemptsTable attempts={profile.recentAttempts} onViewAttempt={handleViewAttempt} />
              <TeacherStudentRecentActivityCard activity={profile.recentActivity} />
            </section>

            <section id="assignments" className="grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.8fr)]">
              <TeacherStudentAssignmentsCard
                assignments={profile.activeAssignments}
                onCreateAssignment={handleCreateAssignment}
                onAction={handleAssignmentAction}
              />
              <TeacherStudentNotesCard notes={notes} inputRef={noteInputRef} onSaveNote={handleSaveNote} />
            </section>
          </main>
        </div>
      </div>

      <div aria-live="polite" className="pointer-events-none fixed top-20 right-4 z-[60]">
        {actionMessage ? (
          <div className="min-w-[280px] rounded-xl border border-emerald-500/35 bg-background/95 px-4 py-3 shadow-lg backdrop-blur-md">
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 inline-flex size-5 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
                <CheckCircle2 className="size-3.5" />
              </span>
              <p className="text-sm font-medium">{actionMessage}</p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
