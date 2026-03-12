import type {TeacherWeakSkillKey} from "@/types/teacher";

export type TeacherRecommendationAssignmentDraft = {
  id: string;
  studentId: string;
  recommendationId: string;
  targetSkill: TeacherWeakSkillKey;
  createdAt: string;
};

const recommendationAssignmentDrafts: TeacherRecommendationAssignmentDraft[] = [];

export function createTeacherRecommendationAssignmentDraft(input: {
  studentId: string;
  recommendationId: string;
  targetSkill: TeacherWeakSkillKey;
}) {
  const created = {
    id: `rec-draft-${input.studentId}-${Date.now()}`,
    studentId: input.studentId,
    recommendationId: input.recommendationId,
    targetSkill: input.targetSkill,
    createdAt: new Date().toISOString()
  } satisfies TeacherRecommendationAssignmentDraft;

  recommendationAssignmentDrafts.unshift(created);
  return created;
}

export function getTeacherRecommendationAssignmentDrafts(studentId?: string) {
  if (!studentId) {
    return [...recommendationAssignmentDrafts];
  }

  return recommendationAssignmentDrafts.filter((item) => item.studentId === studentId);
}
