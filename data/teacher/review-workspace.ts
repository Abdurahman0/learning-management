import type {TeacherAssignmentModuleKey} from "@/types/teacher";

export type TeacherReviewSubmissionType = "writing" | "speaking" | "reading_practice" | "listening_practice";
export type TeacherReviewSubmissionStatus = "pending" | "reviewed" | "overdue";

export type TeacherReviewCriteriaScores = {
  taskResponse: number;
  coherence: number;
  lexical: number;
  grammar: number;
};

export type TeacherReviewWorkspaceRecord = {
  submissionId: string;
  studentId: string;
  assignmentId: string;
  assignmentTitle: string;
  module: TeacherAssignmentModuleKey;
  type: TeacherReviewSubmissionType;
  status: TeacherReviewSubmissionStatus;
  selectedBand: number | null;
  teacherFeedback: string;
  criteria: TeacherReviewCriteriaScores;
  isDraft: boolean;
  updatedAt: string;
  reviewedAt?: string;
};

export type TeacherReviewWorkspaceActivity = {
  id: string;
  submissionId: string;
  studentId: string;
  assignmentId: string;
  assignmentTitle: string;
  finalBand: number;
  reviewedAt: string;
};

const reviewWorkspaceRecords: TeacherReviewWorkspaceRecord[] = [];
const reviewWorkspaceActivities: TeacherReviewWorkspaceActivity[] = [];

function makeAssignmentStudentPairKey(assignmentId: string, studentId: string) {
  return `${assignmentId}::${studentId}`;
}

export function getTeacherReviewWorkspaceRecords() {
  return [...reviewWorkspaceRecords];
}

export function getTeacherReviewWorkspaceRecordBySubmission(submissionId: string) {
  const found = reviewWorkspaceRecords.find((item) => item.submissionId === submissionId);
  return found ? {...found} : null;
}

export function getTeacherReviewWorkspaceActivities() {
  return [...reviewWorkspaceActivities];
}

export function getTeacherReviewedAssignmentPairs() {
  return new Set(
    reviewWorkspaceRecords
      .filter((item) => item.status === "reviewed")
      .map((item) => makeAssignmentStudentPairKey(item.assignmentId, item.studentId))
  );
}

export function saveTeacherReviewDraftRecord(input: {
  submissionId: string;
  studentId: string;
  assignmentId: string;
  assignmentTitle: string;
  module: TeacherAssignmentModuleKey;
  type: TeacherReviewSubmissionType;
  status: Extract<TeacherReviewSubmissionStatus, "pending" | "overdue">;
  selectedBand: number | null;
  teacherFeedback: string;
  criteria: TeacherReviewCriteriaScores;
}) {
  const now = new Date().toISOString();
  const existing = reviewWorkspaceRecords.find((item) => item.submissionId === input.submissionId);

  if (existing) {
    existing.assignmentId = input.assignmentId;
    existing.assignmentTitle = input.assignmentTitle;
    existing.module = input.module;
    existing.type = input.type;
    existing.status = input.status;
    existing.selectedBand = input.selectedBand;
    existing.teacherFeedback = input.teacherFeedback;
    existing.criteria = input.criteria;
    existing.isDraft = true;
    existing.updatedAt = now;

    return {...existing};
  }

  const created = {
    submissionId: input.submissionId,
    studentId: input.studentId,
    assignmentId: input.assignmentId,
    assignmentTitle: input.assignmentTitle,
    module: input.module,
    type: input.type,
    status: input.status,
    selectedBand: input.selectedBand,
    teacherFeedback: input.teacherFeedback,
    criteria: input.criteria,
    isDraft: true,
    updatedAt: now
  } satisfies TeacherReviewWorkspaceRecord;

  reviewWorkspaceRecords.unshift(created);
  return {...created};
}

export function submitTeacherReviewRecord(input: {
  submissionId: string;
  studentId: string;
  assignmentId: string;
  assignmentTitle: string;
  module: TeacherAssignmentModuleKey;
  type: TeacherReviewSubmissionType;
  selectedBand: number;
  teacherFeedback: string;
  criteria: TeacherReviewCriteriaScores;
}) {
  const now = new Date().toISOString();
  let record = reviewWorkspaceRecords.find((item) => item.submissionId === input.submissionId);

  if (!record) {
    record = {
      submissionId: input.submissionId,
      studentId: input.studentId,
      assignmentId: input.assignmentId,
      assignmentTitle: input.assignmentTitle,
      module: input.module,
      type: input.type,
      status: "reviewed",
      selectedBand: input.selectedBand,
      teacherFeedback: input.teacherFeedback,
      criteria: input.criteria,
      isDraft: false,
      updatedAt: now,
      reviewedAt: now
    };

    reviewWorkspaceRecords.unshift(record);
  } else {
    record.assignmentId = input.assignmentId;
    record.assignmentTitle = input.assignmentTitle;
    record.module = input.module;
    record.type = input.type;
    record.status = "reviewed";
    record.selectedBand = input.selectedBand;
    record.teacherFeedback = input.teacherFeedback;
    record.criteria = input.criteria;
    record.isDraft = false;
    record.updatedAt = now;
    record.reviewedAt = now;
  }

  const activity = {
    id: `review-activity-${record.submissionId}-${Date.now()}`,
    submissionId: record.submissionId,
    studentId: record.studentId,
    assignmentId: record.assignmentId,
    assignmentTitle: record.assignmentTitle,
    finalBand: input.selectedBand,
    reviewedAt: now
  } satisfies TeacherReviewWorkspaceActivity;

  reviewWorkspaceActivities.unshift(activity);

  return {
    record: {...record},
    activity
  };
}
