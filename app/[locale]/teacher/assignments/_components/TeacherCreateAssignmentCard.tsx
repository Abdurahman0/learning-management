"use client";

import {useState} from "react";
import {useTranslations} from "next-intl";

import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Checkbox} from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import type {TeacherAssignmentCreateInput} from "@/data/teacher/selectors";

type StudentOption = {
  id: string;
  name: string;
};

type TeacherCreateAssignmentCardProps = {
  students: StudentOption[];
  initialForm: {
    title: string;
    type: TeacherAssignmentCreateInput["type"];
    assignedToMode: TeacherAssignmentCreateInput["assignedToMode"];
    selectedStudentId: string;
    selectedStudentIds: string[];
    dueDate: string;
    instructions: string;
    recommendationSkill?: TeacherAssignmentCreateInput["contextRecommendationSkill"];
  };
  prefilledStudentName?: string;
  onCreate: (input: TeacherAssignmentCreateInput) => void;
};

const assignmentTypeOptions: TeacherAssignmentCreateInput["type"][] = [
  "reading",
  "listening",
  "writing",
  "speaking",
  "full_test",
  "general"
];

const assignModeOptions: TeacherAssignmentCreateInput["assignedToMode"][] = [
  "all",
  "selected",
  "one",
  "at_risk",
  "improving"
];

function toIsoDate(dateValue: string) {
  return `${dateValue}T12:00:00.000Z`;
}

export function TeacherCreateAssignmentCard({
  students,
  initialForm,
  prefilledStudentName,
  onCreate
}: TeacherCreateAssignmentCardProps) {
  const t = useTranslations("teacherAssignments");

  const [title, setTitle] = useState(initialForm.title);
  const [type, setType] = useState<TeacherAssignmentCreateInput["type"]>(initialForm.type);
  const [assignedToMode, setAssignedToMode] = useState<TeacherAssignmentCreateInput["assignedToMode"]>(initialForm.assignedToMode);
  const [selectedStudentId, setSelectedStudentId] = useState(initialForm.selectedStudentId);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>(
    initialForm.selectedStudentIds.length > 0
      ? initialForm.selectedStudentIds
      : initialForm.selectedStudentId
        ? [initialForm.selectedStudentId]
        : []
  );
  const [dueDate, setDueDate] = useState(initialForm.dueDate);
  const [instructions, setInstructions] = useState(initialForm.instructions);

  const canSubmit = title.trim().length > 2 && dueDate && instructions.trim().length > 8;
  const requiresSingleStudent = assignedToMode === "one";
  const requiresSelectedStudents = assignedToMode === "selected";

  const toggleSelectedStudent = (studentId: string, checked: boolean) => {
    setSelectedStudentIds((current) => {
      if (checked) {
        if (current.includes(studentId)) {
          return current;
        }

        return [...current, studentId];
      }

      return current.filter((item) => item !== studentId);
    });
  };

  const handleAssignToModeChange = (value: TeacherAssignmentCreateInput["assignedToMode"]) => {
    setAssignedToMode(value);

    if (value === "selected" && selectedStudentIds.length === 0 && selectedStudentId) {
      setSelectedStudentIds([selectedStudentId]);
      return;
    }

    if (value === "one" && !selectedStudentId && selectedStudentIds.length > 0) {
      setSelectedStudentId(selectedStudentIds[0]);
    }
  };

  const submit = (status: TeacherAssignmentCreateInput["status"]) => {
    if (!canSubmit) {
      return;
    }

    const assignedStudentIds =
      assignedToMode === "one"
        ? selectedStudentId
          ? [selectedStudentId]
          : []
        : assignedToMode === "selected"
          ? selectedStudentIds
          : [];

    onCreate({
      title: title.trim(),
      type,
      assignedToMode,
      assignedStudentIds,
      dueAt: toIsoDate(dueDate),
      instructions: instructions.trim(),
      status,
      contextRecommendationSkill: initialForm.recommendationSkill
    });

    if (status === "active") {
      setTitle("");
      setInstructions("");
      setDueDate("");
      if (!initialForm.selectedStudentId) {
        setSelectedStudentId("");
      }
      if (!initialForm.selectedStudentIds.length) {
        setSelectedStudentIds([]);
      }
    }
  };

  return (
    <Card className="overflow-hidden rounded-2xl border-border/70 bg-card/75 py-0">
      <CardHeader className="pt-7 pb-3">
        <CardTitle className="text-2xl">{t("createNewAssignment")}</CardTitle>
        {prefilledStudentName ? (
          <p className="text-xs text-muted-foreground">{t("prefilledForStudent", {student: prefilledStudentName})}</p>
        ) : null}
        {initialForm.recommendationSkill ? (
          <p className="text-xs text-primary">{t("prefilledFromRecommendation", {skill: t(`skills.${initialForm.recommendationSkill}`)})}</p>
        ) : null}
      </CardHeader>

      <CardContent className="space-y-4 border-t border-border/65 pt-5 pb-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">{t("assignmentTitle")}</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={t("assignmentTitlePlaceholder")}
              className="h-11 w-full rounded-xl border border-border/70 bg-background/45 px-3 text-sm outline-none transition-colors focus:border-primary/55"
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">{t("assignmentType")}</span>
            <Select value={type} onValueChange={(value) => setType(value as TeacherAssignmentCreateInput["type"])}>
              <SelectTrigger className="h-11 w-full rounded-xl border-border/70 bg-background/45">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {assignmentTypeOptions.map((item) => (
                  <SelectItem key={item} value={item}>
                    {t(`typeOptions.${item}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">{t("assignTo")}</span>
            <Select value={assignedToMode} onValueChange={(value) => handleAssignToModeChange(value as TeacherAssignmentCreateInput["assignedToMode"])}>
              <SelectTrigger className="h-11 w-full rounded-xl border-border/70 bg-background/45">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {assignModeOptions.map((item) => (
                  <SelectItem key={item} value={item}>
                    {t(`assignToOptions.${item}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          <label className="space-y-2">
            <span className="text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">{t("dueDate")}</span>
            <input
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              className="h-11 w-full rounded-xl border border-border/70 bg-background/45 px-3 text-sm outline-none transition-colors focus:border-primary/55"
            />
          </label>
        </div>

        {requiresSingleStudent ? (
          <label className="space-y-2">
            <span className="text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">{t("selectStudent")}</span>
            <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
              <SelectTrigger className="h-11 w-full rounded-xl border-border/70 bg-background/45">
                <SelectValue placeholder={t("selectStudentPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {students.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
        ) : null}

        {requiresSelectedStudents ? (
          <section className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">{t("selectStudent")}</span>
              <span className="text-xs text-muted-foreground">{t("selectedStudentsCount", {count: selectedStudentIds.length})}</span>
            </div>
            <div className="max-h-44 space-y-1.5 overflow-y-auto rounded-xl border border-border/70 bg-background/35 p-2.5">
              {students.map((student) => {
                const checked = selectedStudentIds.includes(student.id);

                return (
                  <label
                    key={student.id}
                    className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition hover:bg-muted/45"
                  >
                    <Checkbox checked={checked} onChange={(event) => toggleSelectedStudent(student.id, event.target.checked)} />
                    <span className="truncate">{student.name}</span>
                  </label>
                );
              })}
            </div>
          </section>
        ) : null}

        <label className="space-y-2">
          <span className="text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">{t("instructions")}</span>
          <textarea
            value={instructions}
            onChange={(event) => setInstructions(event.target.value)}
            rows={5}
            placeholder={t("instructionsPlaceholder")}
            className="w-full resize-none rounded-xl border border-border/70 bg-background/45 px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary/55"
          />
        </label>

        <div className="flex flex-wrap justify-end gap-2.5">
          <Button type="button" variant="secondary" className="rounded-xl" disabled={!canSubmit} onClick={() => submit("draft")}>
            {t("saveAsDraft")}
          </Button>
          <Button
            type="button"
            className="rounded-xl"
            disabled={!canSubmit || (requiresSingleStudent && !selectedStudentId) || (requiresSelectedStudents && selectedStudentIds.length === 0)}
            onClick={() => submit("active")}
          >
            {t("assignNow")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
