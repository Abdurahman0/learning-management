import type {TeacherAssignmentModuleKey, TeacherWeakSkillKey} from "@/types/teacher";

export type TeacherAssignmentTypeKey = TeacherAssignmentModuleKey | "full_test";
export type TeacherAssignmentAssignModeKey = "all" | "selected" | "one" | "at_risk" | "improving";
export type TeacherAssignmentRowStatus = "draft" | "active" | "completed" | "overdue";

export type TeacherWorkspaceAssignment = {
  id: string;
  title: string;
  type: TeacherAssignmentTypeKey;
  assignedToMode: TeacherAssignmentAssignModeKey;
  assignedStudentIds: string[];
  dueAt: string;
  instructions: string;
  status: TeacherAssignmentRowStatus;
  progressPercent: number;
  createdAt: string;
  contextRecommendationSkill?: TeacherWeakSkillKey;
};

const workspaceAssignments: TeacherWorkspaceAssignment[] = [];

export function getTeacherWorkspaceAssignments() {
  return [...workspaceAssignments];
}

export function createTeacherWorkspaceAssignment(input: {
  title: string;
  type: TeacherAssignmentTypeKey;
  assignedToMode: TeacherAssignmentAssignModeKey;
  assignedStudentIds: string[];
  dueAt: string;
  instructions: string;
  status: Extract<TeacherAssignmentRowStatus, "draft" | "active">;
  contextRecommendationSkill?: TeacherWeakSkillKey;
}) {
  const created = {
    id: `workspace-assignment-${Date.now()}`,
    title: input.title,
    type: input.type,
    assignedToMode: input.assignedToMode,
    assignedStudentIds: input.assignedStudentIds,
    dueAt: input.dueAt,
    instructions: input.instructions,
    status: input.status,
    progressPercent: input.status === "draft" ? 0 : 6,
    createdAt: new Date().toISOString(),
    contextRecommendationSkill: input.contextRecommendationSkill
  } satisfies TeacherWorkspaceAssignment;

  workspaceAssignments.unshift(created);
  return created;
}

export function updateTeacherWorkspaceAssignmentStatus(assignmentId: string, status: TeacherAssignmentRowStatus) {
  const found = workspaceAssignments.find((item) => item.id === assignmentId);
  if (!found) {
    return null;
  }

  found.status = status;

  if (status === "completed") {
    found.progressPercent = 100;
  }

  if (status === "overdue" && found.progressPercent > 96) {
    found.progressPercent = 96;
  }

  return {...found};
}

