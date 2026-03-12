export type TeacherNavKey =
  | "dashboard"
  | "myStudents"
  | "assignments"
  | "reviews"
  | "messages"
  | "analytics"
  | "profile"
  | "settings";

export type TeacherNavItem = {
  key: TeacherNavKey;
  segment: string;
  enabled: boolean;
};

export type TeacherProfile = {
  id: string;
  role: "teacher";
  name: string;
  title: string;
  email: string;
  avatarFallback: string;
};

export type TeacherStudentStatus = "active" | "inactive" | "at_risk";
export type TeacherStudentProgressState = "improving" | "stable" | "needs_help";
export type TeacherModuleKey = "reading" | "listening" | "writing" | "speaking";
export type TeacherAssignmentModuleKey = TeacherModuleKey | "general";
export type TeacherWeakSkillKey =
  | "matchingHeadings"
  | "listeningPart4"
  | "speakingFluency"
  | "writingTask2"
  | "timeManagement"
  | "multipleChoice"
  | "trueFalseNotGiven"
  | "sentenceCompletion";

export type TeacherStudent = {
  id: string;
  studentCode: string;
  name: string;
  avatarFallback: string;
  targetBand: number;
  estimatedBand: number;
  bandDelta: number;
  weakestSkill: TeacherWeakSkillKey;
  status: TeacherStudentStatus;
  progressState: TeacherStudentProgressState;
  caseload: "primary" | "monitoring";
  lastActiveMinutesAgo: number;
  moduleBands: Record<TeacherModuleKey, number>;
  targetModuleBands: Record<TeacherModuleKey, number>;
};

export type TeacherAssignmentStatus = "active" | "scheduled" | "completed";
export type TeacherAssignmentTaskStatus = "todo" | "submitted" | "pending_review" | "reviewed";

export type TeacherAssignment = {
  id: string;
  title: string;
  module: TeacherAssignmentModuleKey;
  status: TeacherAssignmentStatus;
  dueAt: string;
};

export type TeacherAssignmentTask = {
  id: string;
  assignmentId: string;
  studentId: string;
  status: TeacherAssignmentTaskStatus;
  updatedAt: string;
};

export type TeacherReviewStatus = "pending" | "completed";

export type TeacherReviewItem = {
  id: string;
  studentId: string;
  reviewType: "writing" | "speaking";
  status: TeacherReviewStatus;
  priority: "normal" | "urgent";
  submittedAt: string;
};

export type TeacherMessageThread = {
  id: string;
  studentId: string;
  unreadCount: number;
  lastMessageAt: string;
};

export type TeacherActivityEventType = "completed_reading_test" | "submitted_writing_task_1" | "sent_message";

export type TeacherActivityEvent = {
  id: string;
  studentId: string;
  type: TeacherActivityEventType;
  occurredAt: string;
};

export type TeacherAttemptModuleKey = TeacherAssignmentModuleKey;

export type TeacherStudentAttempt = {
  id: string;
  studentId: string;
  title: string;
  module: TeacherAttemptModuleKey;
  scoreLabel: string;
  band: number | null;
  attemptedAt: string;
};

export type TeacherStudentBandProgressPoint = {
  id: string;
  label: string;
  band: number;
};

export type TeacherWeakAreaTone = "weak" | "average" | "strong";

export type TeacherStudentWeakAreaMetric = {
  id: string;
  label: TeacherWeakSkillKey;
  score: number;
  tone: TeacherWeakAreaTone;
};

export type TeacherStudentActivityType =
  | "completed_reading_test"
  | "submitted_writing_assignment"
  | "started_listening_drill"
  | "logged_into_dashboard"
  | "sent_message";

export type TeacherStudentTimelineEvent = {
  id: string;
  studentId: string;
  type: TeacherStudentActivityType;
  occurredAt: string;
};

export type TeacherStudentProfileMeta = {
  studentId: string;
  joinedAt: string;
  streakDays: number;
  testsDone: number;
  recommendation: string;
  bandProgress: TeacherStudentBandProgressPoint[];
  weakAreas: TeacherStudentWeakAreaMetric[];
};

export type TeacherStudentNote = {
  id: string;
  studentId: string;
  teacherId: string;
  teacherName: string;
  content: string;
  createdAt: string;
};
