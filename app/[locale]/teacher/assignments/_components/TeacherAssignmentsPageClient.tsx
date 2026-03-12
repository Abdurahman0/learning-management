"use client";

import {useEffect, useMemo, useRef, useState} from "react";
import {CheckCircle2, Plus} from "lucide-react";
import {useLocale, useTranslations} from "next-intl";
import {useRouter} from "next/navigation";

import {
  createTeacherAssignment,
  findTeacherStudentById,
  getTeacherAssignmentsPageData,
  getTeacherStudentsForList,
  updateTeacherAssignmentStatus,
  type TeacherAssignmentCreateInput,
  type TeacherAssignmentPrefillContext,
  type TeacherAssignmentRow,
  type TeacherAssignmentsPageData
} from "@/data/teacher/selectors";

import {TeacherSidebar} from "../../_components/TeacherSidebar";
import {TeacherTopbar} from "../../_components/TeacherTopbar";
import {TeacherActiveAssignmentsTable} from "./TeacherActiveAssignmentsTable";
import {TeacherAssignmentProgressCard} from "./TeacherAssignmentProgressCard";
import {TeacherAssignmentsQuickActionsCard} from "./TeacherAssignmentsQuickActionsCard";
import {TeacherAssignmentsSummaryCards} from "./TeacherAssignmentsSummaryCards";
import {TeacherCreateAssignmentCard} from "./TeacherCreateAssignmentCard";

type TeacherAssignmentsPageClientProps = {
  initialData: TeacherAssignmentsPageData;
  prefill: TeacherAssignmentPrefillContext;
  initialQuery?: string;
};

type CreateCardInitial = {
  title: string;
  type: TeacherAssignmentCreateInput["type"];
  assignedToMode: TeacherAssignmentCreateInput["assignedToMode"];
  selectedStudentId: string;
  selectedStudentIds: string[];
  dueDate: string;
  instructions: string;
  recommendationSkill?: TeacherAssignmentPrefillContext["recommendationSkill"];
};

function toDateInputValue(isoDate: string) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const year = date.getUTCFullYear();
  return `${month}/${day}/${year}`;
}

function assignmentSearchTarget(row: TeacherAssignmentRow) {
  const assignedNames = row.assignedStudentIds
    .map((studentId) => findTeacherStudentById(studentId)?.name ?? "")
    .join(" ");

  return [
    row.title,
    row.type,
    row.assignedToMode,
    row.instructions,
    assignedNames
  ]
    .join(" ")
    .toLowerCase();
}

export function TeacherAssignmentsPageClient({
  initialData,
  prefill,
  initialQuery = ""
}: TeacherAssignmentsPageClientProps) {
  const t = useTranslations("teacherAssignments");
  const router = useRouter();
  const locale = useLocale();

  const students = useMemo(() => getTeacherStudentsForList({sortBy: "name"}), []);
  const prefilledStudent = prefill.studentId ? findTeacherStudentById(prefill.studentId) : null;
  const formAnchorRef = useRef<HTMLDivElement>(null);

  const [pageData, setPageData] = useState(initialData);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [createCardSeed, setCreateCardSeed] = useState(0);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const initialAssignedToMode =
    prefilledStudent ? "one" : prefill.assignedToMode ?? "all";
  const [createCardInitial, setCreateCardInitial] = useState<CreateCardInitial>({
    title: prefill.prefilledTitle ?? "",
    type: "reading",
    assignedToMode: initialAssignedToMode,
    selectedStudentId: prefilledStudent?.id ?? "",
    selectedStudentIds: prefilledStudent?.id ? [prefilledStudent.id] : [],
    dueDate: "",
    instructions: prefill.prefilledInstructions ?? "",
    recommendationSkill: prefill.recommendationSkill
  });

  const visibleAssignments = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();
    if (!normalized) {
      return pageData.activeAssignments;
    }

    return pageData.activeAssignments.filter((row) => assignmentSearchTarget(row).includes(normalized));
  }, [pageData.activeAssignments, searchQuery]);

  useEffect(() => {
    if (!actionMessage) {
      return;
    }

    const timer = window.setTimeout(() => setActionMessage(null), 2800);
    return () => window.clearTimeout(timer);
  }, [actionMessage]);

  const refreshAssignmentsData = () => {
    setPageData(getTeacherAssignmentsPageData());
  };

  const focusCreateForm = () => {
    formAnchorRef.current?.scrollIntoView({behavior: "smooth", block: "start"});
  };

  const handleCreateAssignment = (input: TeacherAssignmentCreateInput) => {
    const created = createTeacherAssignment(input);
    refreshAssignmentsData();
    setActionMessage(
      input.status === "draft"
        ? t("feedback.savedDraft", {title: created.title})
        : t("feedback.assignedNow", {title: created.title})
    );
  };

  const handleQuickAction = (action: "createTask" | "allSubmissions" | "messageGroup") => {
    if (action === "createTask") {
      focusCreateForm();
      return;
    }

    if (action === "allSubmissions") {
      router.push(`/${locale}/teacher/reviews?source=assignments`);
      return;
    }

    router.push(`/${locale}/teacher/messages?source=assignments&group=active`);
  };

  const handleRowAction = (assignment: TeacherAssignmentRow, action: "view" | "edit" | "close" | "review") => {
    if (action === "view") {
      const firstStudentId = assignment.assignedStudentIds[0];
      if (firstStudentId) {
        router.push(`/${locale}/teacher/students/${firstStudentId}`);
        return;
      }

      setActionMessage(t("feedback.assignmentViewed", {title: assignment.title}));
      return;
    }

    if (action === "edit") {
      setCreateCardInitial({
        title: assignment.title,
        type: assignment.type,
        assignedToMode: assignment.assignedToMode,
        selectedStudentId: assignment.assignedStudentIds[0] ?? "",
        selectedStudentIds: assignment.assignedStudentIds,
        dueDate: toDateInputValue(assignment.dueAt),
        instructions: assignment.instructions,
        recommendationSkill: undefined
      });
      setCreateCardSeed((current) => current + 1);
      focusCreateForm();
      return;
    }

    if (action === "review") {
      router.push(`/${locale}/teacher/reviews?assignmentId=${assignment.id}`);
      return;
    }

    if (assignment.source !== "workspace") {
      setActionMessage(t("feedback.closeNotAvailable"));
      return;
    }

    updateTeacherAssignmentStatus(assignment.id, "completed");
    refreshAssignmentsData();
    setActionMessage(t("feedback.assignmentClosed", {title: assignment.title}));
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <TeacherSidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <TeacherTopbar
            title={t("title")}
            search={{
              value: searchQuery,
              onValueChange: setSearchQuery
            }}
          />

          <main className="mx-auto min-w-0 w-full max-w-[1480px] space-y-5 overflow-x-hidden px-4 py-5 sm:px-6 lg:px-8">
            <section className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="truncate text-2xl font-semibold tracking-tight sm:text-3xl">{t("title")}</h1>
                <p className="mt-1.5 text-sm text-muted-foreground">{t("subtitle")}</p>
              </div>

              <button
                type="button"
                onClick={focusCreateForm}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
              >
                <Plus className="size-4.5" />
                {t("createAssignment")}
              </button>
            </section>

            <TeacherAssignmentsSummaryCards summary={pageData.summary} />

            <section className="grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.88fr)]">
              <div ref={formAnchorRef}>
                <TeacherCreateAssignmentCard
                  key={`create-card-${createCardSeed}`}
                  students={students.map((item) => ({id: item.id, name: item.name}))}
                  initialForm={createCardInitial}
                  prefilledStudentName={prefilledStudent?.name}
                  onCreate={handleCreateAssignment}
                />
              </div>

              <div className="space-y-5">
                <TeacherAssignmentsQuickActionsCard onAction={handleQuickAction} />
                <TeacherAssignmentProgressCard items={pageData.progressItems} />
              </div>
            </section>

            <TeacherActiveAssignmentsTable rows={visibleAssignments} onAction={handleRowAction} />
          </main>
        </div>
      </div>

      <div aria-live="polite" className="pointer-events-none fixed top-20 right-4 z-[60]">
        {actionMessage ? (
          <div className="min-w-[300px] rounded-xl border border-emerald-500/35 bg-background/95 px-4 py-3 shadow-lg backdrop-blur-md">
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
