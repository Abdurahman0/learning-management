import type {TeacherAssignment, TeacherAssignmentTask, TeacherAssignmentTaskStatus} from "@/types/teacher";

import {TEACHER_STUDENTS} from "./students";

export const TEACHER_ASSIGNMENTS: TeacherAssignment[] = [
  {id: "assignment-reading-3", title: "Vocabulary Quiz #4", module: "general", status: "active", dueAt: "2023-10-28T12:00:00.000Z"},
  {id: "assignment-writing-task-1", title: "Task 1 - Graph Description", module: "writing", status: "active", dueAt: "2023-10-25T12:00:00.000Z"},
  {id: "assignment-listening-part-4", title: "Speaking Mock #2", module: "speaking", status: "active", dueAt: "2023-10-22T12:00:00.000Z"},
  {id: "assignment-speaking-fluency", title: "Speaking Fluency Sprint", module: "speaking", status: "active", dueAt: "2026-03-21T17:00:00.000Z"},
  {id: "assignment-mixed-set-a", title: "Mixed Practice Set A", module: "reading", status: "active", dueAt: "2026-03-22T17:00:00.000Z"},
  {id: "assignment-weekend-diagnostic", title: "Weekend Diagnostic", module: "listening", status: "scheduled", dueAt: "2026-03-24T17:00:00.000Z"},
  {id: "assignment-cambridge-review", title: "Cambridge Review Pack", module: "writing", status: "completed", dueAt: "2026-03-08T17:00:00.000Z"}
];

const activeAssignmentIds = TEACHER_ASSIGNMENTS.filter((item) => item.status === "active").map((item) => item.id);

const explicitTaskPlan: Record<string, TeacherAssignmentTaskStatus[]> = {
  "student-alex-thompson": ["todo", "submitted", "reviewed"],
  "student-maria-garcia": ["reviewed"],
  "student-liam-nguyen": ["pending_review"],
  "student-james-sterling": ["todo", "pending_review"],
  "student-maria-valdez": ["todo"],
  "student-arjun-kapoor": ["todo", "pending_review"],
  "student-john-smith": ["submitted"],
  "student-emma-wilson": ["pending_review"],
  "student-liam-chen": ["submitted"]
};

function buildGeneratedTaskStatuses(index: number, status: string, progressState: string): TeacherAssignmentTaskStatus[] {
  if (status === "inactive") {
    return index % 3 === 0 ? ["reviewed"] : [];
  }

  if (progressState === "needs_help") {
    return index % 2 === 0 ? ["todo", "pending_review"] : ["todo", "submitted"];
  }

  if (progressState === "stable") {
    return index % 3 === 0 ? ["pending_review"] : ["submitted"];
  }

  if (index % 6 === 0) {
    return ["pending_review"];
  }

  if (index % 4 === 0) {
    return [];
  }

  return ["submitted"];
}

export const TEACHER_ASSIGNMENT_TASKS: TeacherAssignmentTask[] = TEACHER_STUDENTS.flatMap((student, index) => {
  const planned = explicitTaskPlan[student.id] ?? buildGeneratedTaskStatuses(index, student.status, student.progressState);

  return planned.map((taskStatus, taskIndex) => ({
    id: `assignment-task-${student.id}-${taskIndex + 1}`,
    studentId: student.id,
    assignmentId: activeAssignmentIds[(index + taskIndex) % activeAssignmentIds.length],
    status: taskStatus,
    updatedAt: new Date(Date.now() - (student.lastActiveMinutesAgo + taskIndex * 20) * 60 * 1000).toISOString()
  }));
});
