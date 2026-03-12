import type {
  TeacherAssignmentModuleKey,
  TeacherAssignmentTaskStatus,
  TeacherModuleKey,
  TeacherStudentActivityType,
  TeacherStudent,
  TeacherStudentAttempt,
  TeacherStudentBandProgressPoint,
  TeacherStudentNote,
  TeacherStudentProgressState,
  TeacherStudentWeakAreaMetric,
  TeacherStudentStatus,
  TeacherWeakSkillKey
} from "@/types/teacher";

import type {
  TeacherAssignmentAssignModeKey,
  TeacherAssignmentRowStatus,
  TeacherAssignmentTypeKey,
  TeacherWorkspaceAssignment
} from "./assignment-workspace";
import {
  TEACHER_ACTIVITY_EVENTS,
  TEACHER_ASSIGNMENTS,
  TEACHER_ASSIGNMENT_TASKS,
  TEACHER_DASHBOARD_MONTHLY_PROGRESS,
  TEACHER_MESSAGE_THREADS,
  TEACHER_NAV_ITEMS,
  TEACHER_PROFILE,
  TEACHER_QUICK_ACTIONS,
  TEACHER_REVIEWS,
  TEACHER_STUDENT_ATTEMPTS,
  TEACHER_STUDENT_INITIAL_NOTES,
  TEACHER_STUDENT_PROFILES,
  TEACHER_STUDENT_TIMELINE_EVENTS,
  TEACHER_STUDENTS
} from "./index";
import {getTeacherRecommendationAssignmentDrafts} from "./recommendations";
import {
  createTeacherWorkspaceAssignment,
  getTeacherWorkspaceAssignments,
  updateTeacherWorkspaceAssignmentStatus
} from "./assignment-workspace";
import {
  getTeacherReviewedAssignmentPairs,
  getTeacherReviewWorkspaceActivities,
  getTeacherReviewWorkspaceRecordBySubmission,
  saveTeacherReviewDraftRecord,
  submitTeacherReviewRecord,
  type TeacherReviewCriteriaScores as TeacherReviewCriteriaScoresModel,
  type TeacherReviewSubmissionStatus as TeacherReviewSubmissionStatusModel,
  type TeacherReviewSubmissionType as TeacherReviewSubmissionTypeModel
} from "./review-workspace";

export type TeacherDashboardStatKey = "studentsAssigned" | "pendingReviews" | "assignmentsActive" | "studentsAtRisk";
export type TeacherStatIndicatorKey = "upThisMonth" | "urgent" | "currentlyActive" | "needsAttention";
export type TeacherStatTone = "success" | "warning" | "info" | "danger";

export type TeacherDashboardStat = {
  key: TeacherDashboardStatKey;
  value: number;
  indicator: TeacherStatIndicatorKey;
  tone: TeacherStatTone;
};

export type TeacherDashboardMonthKey = "jan" | "feb" | "mar" | "apr" | "may" | "jun";

export type TeacherDashboardRecentActivityEventKey =
  | "completedReadingTest3"
  | "submittedWritingTask1"
  | "sentMessage";
export type TeacherDashboardRecentActivityTimeKey = "twoMinutesAgo" | "fortyFiveMinutesAgo" | "twoHoursAgo";
export type TeacherDashboardRecentActivityTone = "blue" | "emerald" | "violet";

export type TeacherDashboardRecentActivityItem = {
  id: string;
  studentName: string;
  studentInitials: string;
  event: TeacherDashboardRecentActivityEventKey;
  time: TeacherDashboardRecentActivityTimeKey;
  tone: TeacherDashboardRecentActivityTone;
};

export type TeacherDashboardWeakAreaKey = "matchingHeadings" | "listeningPart4" | "speakingFluency";
export type TeacherDashboardLastActivityKey = "yesterday430" | "twoDaysAgo" | "today1015";

export type TeacherDashboardStudentNeedingHelp = {
  id: string;
  studentName: string;
  studentInitials: string;
  currentBand: number;
  weakArea: TeacherDashboardWeakAreaKey;
  lastActivity: TeacherDashboardLastActivityKey;
};

export type TeacherStudentsTargetFilter = "all" | "6_plus" | "6_5_plus" | "7_plus" | "7_5_plus";
export type TeacherStudentsProgressFilter = "all" | TeacherStudentProgressState;
export type TeacherStudentsStatusFilter = "all" | TeacherStudentStatus;
export type TeacherStudentsSortBy = "recent_activity" | "name" | "highest_band" | "lowest_band" | "most_pending";

export type TeacherStudentsLastActivityLabelKey = "justNow" | "minutesAgo" | "hoursAgo" | "yesterday" | "daysAgo";

export type TeacherStudentsLastActivity = {
  key: TeacherStudentsLastActivityLabelKey;
  value?: number;
};

export type TeacherStudentListItem = TeacherStudent & {
  pendingCount: number;
  pendingAssignments: number;
  pendingReviews: number;
  unreadMessages: number;
  lastActivity: TeacherStudentsLastActivity;
};

export type TeacherStudentsSummary = {
  totalStudents: number;
  studentsImproving: number;
  needingHelp: number;
  inactiveStudents: number;
};

export type TeacherClassProgressPoint = {
  module: TeacherModuleKey;
  currentMonth: number;
  target: number;
};

export type TeacherStudentProfileActivityKey =
  | "completedReadingTest"
  | "submittedWritingAssignment"
  | "startedListeningDrill"
  | "loggedIntoDashboard"
  | "sentMessage";

export type TeacherStudentProfileAssignmentStatusKey = "pending" | "completed" | "reviewed";

export type TeacherStudentProfileAttemptRow = {
  id: string;
  title: string;
  module: TeacherStudentAttempt["module"];
  scoreLabel: string;
  band: number | null;
  attemptedAt: string;
};

export type TeacherStudentProfileActivityRow = {
  id: string;
  activityKey: TeacherStudentProfileActivityKey;
  occurredAt: string;
};

export type TeacherStudentProfileAssignmentRow = {
  id: string;
  assignmentId: string;
  title: string;
  module: TeacherStudentAttempt["module"];
  dueAt: string;
  status: TeacherStudentProfileAssignmentStatusKey;
};

export type TeacherStudentProfileData = {
  student: TeacherStudentListItem;
  joinedAt: string;
  testsDone: number;
  streakDays: number;
  recommendation: string;
  bandProgress: TeacherStudentBandProgressPoint[];
  weakAreas: TeacherStudentWeakAreaMetric[];
  recentAttempts: TeacherStudentProfileAttemptRow[];
  recentActivity: TeacherStudentProfileActivityRow[];
  activeAssignments: TeacherStudentProfileAssignmentRow[];
  initialNotes: TeacherStudentNote[];
};

export type TeacherStudentProgressSummary = {
  studentId: string;
  studentCode: string;
  targetBand: number;
  currentBand: number;
  totalTests: number;
  improvementBand: number;
  testsThisWeek: number;
  averageStudyTimeHours: number;
  streakDays: number;
  lastActivity: TeacherStudentsLastActivity;
};

export type TeacherStudentProgressBandPoint = {
  id: string;
  label: `test${1 | 2 | 3 | 4}`;
  band: number;
};

export type TeacherStudentModuleScore = {
  module: TeacherModuleKey;
  score: number;
  target: number;
};

export type TeacherStudentWeakQuestionType = {
  id: string;
  label: TeacherWeakSkillKey;
  accuracy: number;
  tone: TeacherStudentWeakAreaMetric["tone"];
};

export type TeacherStudentRecommendationPriority = "high" | "medium" | "normal";

export type TeacherStudentRecommendation = {
  id: string;
  targetSkill: TeacherWeakSkillKey;
  focusModule: TeacherStudentAttempt["module"];
  priority: TeacherStudentRecommendationPriority;
  moduleCount: number;
};

export type TeacherStudentProgressData = {
  student: TeacherStudentListItem;
  summary: TeacherStudentProgressSummary;
  bandProgression: TeacherStudentProgressBandPoint[];
  modulePerformance: TeacherStudentModuleScore[];
  weakAreasByType: TeacherStudentWeakQuestionType[];
  recommendations: TeacherStudentRecommendation[];
};

export type TeacherAssignmentsSummary = {
  activeAssignments: number;
  dueSoon: number;
  completed: number;
  overdue: number;
};

export type TeacherAssignmentProgressItemTone = "blue" | "amber" | "emerald";

export type TeacherAssignmentProgressItem = {
  id: string;
  label: string;
  value: number;
  tone: TeacherAssignmentProgressItemTone;
};

export type TeacherAssignmentRow = {
  id: string;
  title: string;
  type: TeacherAssignmentTypeKey;
  assignedToMode: TeacherAssignmentAssignModeKey;
  assignedStudentIds: string[];
  dueAt: string;
  instructions: string;
  status: TeacherAssignmentRowStatus;
  progressPercent: number;
  source: "base" | "workspace";
};

export type TeacherAssignmentsPageData = {
  summary: TeacherAssignmentsSummary;
  progressItems: TeacherAssignmentProgressItem[];
  activeAssignments: TeacherAssignmentRow[];
};

export type TeacherReviewSubmissionType = TeacherReviewSubmissionTypeModel;
export type TeacherReviewSubmissionStatus = TeacherReviewSubmissionStatusModel;
export type TeacherReviewCriteriaScores = TeacherReviewCriteriaScoresModel;
export type TeacherReviewsTypeFilter = "all" | TeacherReviewSubmissionType;
export type TeacherReviewsStatusFilter = "all" | TeacherReviewSubmissionStatus;

export type TeacherReviewSubmission = {
  id: string;
  studentId: string;
  studentName: string;
  studentAvatarFallback: string;
  assignmentId: string;
  assignmentTitle: string;
  module: TeacherAssignmentModuleKey;
  type: TeacherReviewSubmissionType;
  submittedAt: string;
  status: TeacherReviewSubmissionStatus;
  content: string;
  contentPreview: string;
  selectedBand: number | null;
  teacherFeedback: string;
  criteria: TeacherReviewCriteriaScores;
  reviewedAt?: string;
  isDraft: boolean;
  source: "task" | "workspace";
};

export type TeacherReviewActivityItem = {
  id: string;
  studentId: string;
  studentName: string;
  submissionId: string;
  assignmentTitle: string;
  finalBand: number;
  reviewedAt: string;
};

export type TeacherReviewsSummary = {
  pendingReviews: number;
  reviewedToday: number;
  averageBandScore: number;
  overdueSubmissions: number;
};

export type TeacherReviewsPageData = {
  summary: TeacherReviewsSummary;
  submissions: TeacherReviewSubmission[];
  recentActivity: TeacherReviewActivityItem[];
  selectedSubmissionId: string | null;
};

export type TeacherAnalyticsSummary = {
  totalStudents: number;
  averageBandScore: number;
  testsCompleted: number;
  averageStudyTimeHours: number;
};

export type TeacherAnalyticsPeriod = "monthly" | "weekly";

export type TeacherBandProgressPoint = {
  id: string;
  label: string;
  value: number;
};

export type TeacherModulePerformance = {
  module: TeacherModuleKey;
  value: number;
};

export type TeacherWeakAreaAggregate = {
  id: string;
  label: TeacherWeakSkillKey;
  percentage: number;
  tone: TeacherStudentWeakAreaMetric["tone"];
};

export type TeacherDailyActivityMetric = {
  id: "activeStudents" | "inactive" | "testsStarted" | "submissions";
  value: number;
};

export type TeacherAnalyticsPageData = {
  summary: TeacherAnalyticsSummary;
  progress: Record<TeacherAnalyticsPeriod, TeacherBandProgressPoint[]>;
  modulePerformance: TeacherModulePerformance[];
  weakAreas: TeacherWeakAreaAggregate[];
  dailyActivity: TeacherDailyActivityMetric[];
};

const pendingTaskStatuses = new Set(["todo", "pending_review"]);
const dashboardHelpStudentOrder = ["student-james-sterling", "student-maria-valdez", "student-arjun-kapoor"] as const;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function roundBand(value: number) {
  return Math.round(value * 10) / 10;
}

function roundHalf(value: number) {
  return Math.round(value * 2) / 2;
}

function initialsFromName(name: string) {
  const parts = name.split(" ");
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function relativeActivity(minutesAgo: number): TeacherStudentsLastActivity {
  if (minutesAgo <= 5) {
    return {key: "justNow"};
  }

  if (minutesAgo < 60) {
    return {key: "minutesAgo", value: Math.max(1, Math.round(minutesAgo))};
  }

  const hours = Math.round(minutesAgo / 60);
  if (hours < 24) {
    return {key: "hoursAgo", value: Math.max(1, hours)};
  }

  if (hours < 48) {
    return {key: "yesterday"};
  }

  return {key: "daysAgo", value: Math.max(2, Math.round(hours / 24))};
}

function weakSkillToDashboardKey(weakSkill: TeacherWeakSkillKey): TeacherDashboardWeakAreaKey {
  if (weakSkill === "listeningPart4") {
    return "listeningPart4";
  }

  if (weakSkill === "speakingFluency") {
    return "speakingFluency";
  }

  return "matchingHeadings";
}

function weakSkillToModule(weakSkill: TeacherWeakSkillKey): TeacherStudentAttempt["module"] {
  switch (weakSkill) {
    case "writingTask2":
      return "writing";
    case "speakingFluency":
      return "speaking";
    case "listeningPart4":
    case "sentenceCompletion":
      return "listening";
    case "timeManagement":
      return "general";
    default:
      return "reading";
  }
}

function ensureWeakAreas(areas: TeacherStudentWeakAreaMetric[]): TeacherStudentWeakQuestionType[] {
  const fallbacks: TeacherWeakSkillKey[] = [
    "matchingHeadings",
    "trueFalseNotGiven",
    "multipleChoice",
    "sentenceCompletion",
    "listeningPart4"
  ];

  const normalized = areas.map((item) => ({
    id: item.id,
    label: item.label,
    accuracy: item.score,
    tone: item.tone
  }));

  for (const fallback of fallbacks) {
    if (normalized.length >= 5) {
      break;
    }

    if (normalized.some((item) => item.label === fallback)) {
      continue;
    }

    const seed = 58 + normalized.length * 6;
    const accuracy = clamp(seed, 45, 84);

    normalized.push({
      id: `wa-fallback-${fallback}`,
      label: fallback,
      accuracy,
      tone: accuracy < 50 ? "weak" : accuracy < 70 ? "average" : "strong"
    });
  }

  return normalized;
}

function pickBandProgression(points: TeacherStudentBandProgressPoint[]): TeacherStudentProgressBandPoint[] {
  if (points.length === 0) {
    return [
      {id: "test-1", label: "test1", band: 5.5},
      {id: "test-2", label: "test2", band: 6.0},
      {id: "test-3", label: "test3", band: 6.8},
      {id: "test-4", label: "test4", band: 7.2}
    ];
  }

  const indexes = points.length <= 4
    ? points.map((_, index) => index)
    : [0, 1, Math.floor(points.length / 2), points.length - 1];

  const uniqueIndexes = Array.from(new Set(indexes)).sort((left, right) => left - right).slice(0, 4);
  const selected = uniqueIndexes.map((index) => points[index]);

  while (selected.length < 4) {
    selected.push(selected[selected.length - 1]);
  }

  return selected.slice(0, 4).map((point, index) => ({
    id: `progress-${point.id}-${index + 1}`,
    label: `test${(index + 1) as 1 | 2 | 3 | 4}`,
    band: point.band
  }));
}

function mapActivityTypeToKey(type: TeacherStudentActivityType): TeacherStudentProfileActivityKey {
  if (type === "completed_reading_test") {
    return "completedReadingTest";
  }

  if (type === "submitted_writing_assignment") {
    return "submittedWritingAssignment";
  }

  if (type === "started_listening_drill") {
    return "startedListeningDrill";
  }

  if (type === "sent_message") {
    return "sentMessage";
  }

  return "loggedIntoDashboard";
}

function mapTaskStatusToProfileStatus(status: TeacherAssignmentTaskStatus): TeacherStudentProfileAssignmentStatusKey {
  if (status === "reviewed") {
    return "reviewed";
  }

  if (status === "submitted") {
    return "completed";
  }

  return "pending";
}

function moduleToAssignmentType(module: TeacherAssignmentModuleKey): TeacherAssignmentTypeKey {
  return module;
}

function assignmentTypeToModule(type: TeacherAssignmentTypeKey): TeacherAssignmentModuleKey {
  if (type === "full_test") {
    return "general";
  }

  return type;
}

function assignmentStatusFromDueDate(baseStatus: "active" | "scheduled" | "completed", dueAt: string): TeacherAssignmentRowStatus {
  if (baseStatus === "completed") {
    return "completed";
  }

  if (new Date(dueAt).getTime() < Date.now()) {
    return "overdue";
  }

  return "active";
}

function progressFromTaskStatus(status: TeacherAssignmentTaskStatus) {
  if (status === "reviewed") {
    return 100;
  }

  if (status === "submitted") {
    return 78;
  }

  if (status === "pending_review") {
    return 60;
  }

  return 24;
}

function progressFromAssignmentTasks(assignmentId: string) {
  const reviewedPairs = getTeacherReviewedAssignmentPairs();
  const tasks = TEACHER_ASSIGNMENT_TASKS.filter((item) => item.assignmentId === assignmentId);
  if (tasks.length === 0) {
    return 0;
  }

  const total = tasks.reduce((sum, task) => {
    const key = `${task.assignmentId}::${task.studentId}`;
    const status = reviewedPairs.has(key) ? "reviewed" : task.status;
    return sum + progressFromTaskStatus(status);
  }, 0);
  return Math.round(total / tasks.length);
}

function resolveAssignedStudentIds(mode: TeacherAssignmentAssignModeKey, requestedStudentIds: string[]) {
  if (mode === "all") {
    return TEACHER_STUDENTS.map((item) => item.id);
  }

  if (mode === "at_risk") {
    return TEACHER_STUDENTS.filter((item) => item.status === "at_risk").map((item) => item.id);
  }

  if (mode === "improving") {
    return TEACHER_STUDENTS.filter((item) => item.progressState === "improving").map((item) => item.id);
  }

  return requestedStudentIds;
}

function collectBaseAssignmentRows(): TeacherAssignmentRow[] {
  const studentsByAssignment = new Map<string, Set<string>>();

  for (const task of TEACHER_ASSIGNMENT_TASKS) {
    const list = studentsByAssignment.get(task.assignmentId) ?? new Set<string>();
    list.add(task.studentId);
    studentsByAssignment.set(task.assignmentId, list);
  }

  return TEACHER_ASSIGNMENTS.map((item) => {
    const assignedStudentIds = Array.from(studentsByAssignment.get(item.id) ?? []);

    return {
      id: item.id,
      title: item.title,
      type: moduleToAssignmentType(item.module),
      assignedToMode: assignedStudentIds.length <= 1 ? "one" : assignedStudentIds.length >= TEACHER_STUDENTS.length * 0.8 ? "all" : "selected",
      assignedStudentIds,
      dueAt: item.dueAt,
      instructions: `Follow the ${item.title} guidance and submit before due date.`,
      status: assignmentStatusFromDueDate(item.status, item.dueAt),
      progressPercent: item.status === "completed" ? 100 : progressFromAssignmentTasks(item.id),
      source: "base"
    } satisfies TeacherAssignmentRow;
  });
}

function collectWorkspaceAssignmentRows(): TeacherAssignmentRow[] {
  return getTeacherWorkspaceAssignments().map((item) => {
    const resolvedStatus: TeacherAssignmentRowStatus =
      item.status === "active" && new Date(item.dueAt).getTime() < Date.now() ? "overdue" : item.status;

    return {
      id: item.id,
      title: item.title,
      type: item.type,
      assignedToMode: item.assignedToMode,
      assignedStudentIds: item.assignedStudentIds,
      dueAt: item.dueAt,
      instructions: item.instructions,
      status: resolvedStatus,
      progressPercent: item.progressPercent,
      source: "workspace"
    };
  });
}

function getDueSoon(value: string) {
  const now = Date.now();
  const due = new Date(value).getTime();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;

  return due >= now && due <= now + sevenDays;
}

function assignmentModuleToReviewType(module: TeacherAssignmentModuleKey): TeacherReviewSubmissionType {
  if (module === "writing") {
    return "writing";
  }

  if (module === "speaking") {
    return "speaking";
  }

  if (module === "listening") {
    return "listening_practice";
  }

  return "reading_practice";
}

function clampCriteria(value: number) {
  return clamp(Math.round(value), 35, 95);
}

function roundBandToHalf(value: number) {
  return Math.round(value * 2) / 2;
}

function normalizeBandScore(value: number) {
  return clamp(roundBandToHalf(value), 4.0, 9.0);
}

function defaultReviewCriteria(student: TeacherStudent, type: TeacherReviewSubmissionType): TeacherReviewCriteriaScores {
  const moduleBand =
    type === "writing"
      ? student.moduleBands.writing
      : type === "speaking"
        ? student.moduleBands.speaking
        : type === "listening_practice"
          ? student.moduleBands.listening
          : student.moduleBands.reading;
  const base = moduleBand * 12;

  return {
    taskResponse: clampCriteria(base + (type === "writing" ? 2 : -1)),
    coherence: clampCriteria(base + (type === "speaking" ? 3 : 0)),
    lexical: clampCriteria(base + (student.progressState === "improving" ? 4 : -2)),
    grammar: clampCriteria(base + (student.status === "at_risk" ? -6 : 1))
  };
}

function defaultBandFromCriteria(criteria: TeacherReviewCriteriaScores) {
  const average = (criteria.taskResponse + criteria.coherence + criteria.lexical + criteria.grammar) / 4;
  return normalizeBandScore(average / 12);
}

function scoreFromTaskStatus(status: TeacherAssignmentTaskStatus, dueAt: string): TeacherReviewSubmissionStatus {
  if (status === "reviewed") {
    return "reviewed";
  }

  if (new Date(dueAt).getTime() < Date.now()) {
    return "overdue";
  }

  return "pending";
}

function createReviewContent(input: {
  studentName: string;
  assignmentTitle: string;
  type: TeacherReviewSubmissionType;
  instructions?: string;
}) {
  if (input.type === "writing") {
    return `${input.studentName} submitted a writing response for "${input.assignmentTitle}".\n\nIn contemporary education, technology plays a transformative role in how learners access information and collaborate. While digital tools can be distracting in uncontrolled environments, structured integration improves engagement, vocabulary exposure, and time-managed practice. To maximize outcomes, students should combine technology-assisted practice with consistent feedback and reflection.`;
  }

  if (input.type === "speaking") {
    return `Speaking transcript (${input.assignmentTitle}):\n\n"Today I will describe how I organize my daily routines. First, I plan the most difficult task in the morning because I can focus better. Then I review mistakes from previous IELTS practice and set one small target for the next day."`;
  }

  if (input.type === "listening_practice") {
    return `${input.studentName} completed listening practice for "${input.assignmentTitle}".\n\nAnswer summary: correctly captured key details in Sections 1 and 2, but missed distractors in longer multi-speaker sections.`;
  }

  return `${input.studentName} completed reading practice for "${input.assignmentTitle}".\n\nResponse summary: strong skimming speed, but needs better evidence matching in heading and true/false/not given tasks.${input.instructions ? `\n\nTeacher instructions:\n${input.instructions}` : ""}`;
}

function reviewPreview(content: string) {
  return content.split("\n").join(" ").slice(0, 160);
}

function weakSkillLabel(skill: TeacherWeakSkillKey) {
  if (skill === "trueFalseNotGiven") {
    return "TFNG";
  }

  if (skill === "listeningPart4") {
    return "Listening Part 4";
  }

  return skill
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (value) => value.toUpperCase())
    .trim();
}

function getStudentProfileMeta(studentId: string) {
  const profile = TEACHER_STUDENT_PROFILES.find((item) => item.studentId === studentId);

  if (profile) {
    return profile;
  }

  return {
    studentId,
    joinedAt: "2023-10-01T00:00:00.000Z",
    streakDays: 4,
    testsDone: 8,
    recommendation: "Continue weekly drills and reinforce weak question types with targeted practice.",
    bandProgress: [
      {id: "month-1", label: "month1", band: 5.0},
      {id: "month-2", label: "month2", band: 5.4},
      {id: "month-3", label: "month3", band: 5.8},
      {id: "month-4", label: "month4", band: 6.1},
      {id: "month-5", label: "month5", band: 6.3},
      {id: "current", label: "current", band: 6.5}
    ],
    weakAreas: [
      {id: "wa-1", label: "matchingHeadings" as TeacherWeakSkillKey, score: 48, tone: "weak" as const},
      {id: "wa-2", label: "trueFalseNotGiven" as TeacherWeakSkillKey, score: 58, tone: "average" as const},
      {id: "wa-3", label: "multipleChoice" as TeacherWeakSkillKey, score: 74, tone: "strong" as const}
    ]
  };
}

function getPendingMap() {
  const pendingAssignmentsMap = new Map<string, number>();
  const pendingReviewsMap = new Map<string, number>();
  const unreadMessagesMap = new Map<string, number>();

  for (const task of TEACHER_ASSIGNMENT_TASKS) {
    if (!pendingTaskStatuses.has(task.status)) {
      continue;
    }

    pendingAssignmentsMap.set(task.studentId, (pendingAssignmentsMap.get(task.studentId) ?? 0) + 1);
  }

  for (const review of TEACHER_REVIEWS) {
    if (review.status !== "pending") {
      continue;
    }

    pendingReviewsMap.set(review.studentId, (pendingReviewsMap.get(review.studentId) ?? 0) + 1);
  }

  for (const thread of TEACHER_MESSAGE_THREADS) {
    unreadMessagesMap.set(thread.studentId, thread.unreadCount);
  }

  return {pendingAssignmentsMap, pendingReviewsMap, unreadMessagesMap};
}

const pendingMaps = getPendingMap();

function toListItem(student: TeacherStudent): TeacherStudentListItem {
  const {pendingAssignmentsMap, pendingReviewsMap, unreadMessagesMap} = pendingMaps;
  const pendingAssignments = pendingAssignmentsMap.get(student.id) ?? 0;
  const pendingReviews = pendingReviewsMap.get(student.id) ?? 0;
  const unreadMessages = unreadMessagesMap.get(student.id) ?? 0;
  const pendingCount = pendingAssignments + pendingReviews + unreadMessages;

  return {
    ...student,
    pendingAssignments,
    pendingReviews,
    unreadMessages,
    pendingCount,
    lastActivity: relativeActivity(student.lastActiveMinutesAgo)
  };
}

function sortStudents(items: TeacherStudentListItem[], sortBy: TeacherStudentsSortBy) {
  const sorted = [...items];

  sorted.sort((left, right) => {
    if (sortBy === "name") {
      return left.name.localeCompare(right.name);
    }

    if (sortBy === "highest_band") {
      return right.estimatedBand - left.estimatedBand || left.name.localeCompare(right.name);
    }

    if (sortBy === "lowest_band") {
      return left.estimatedBand - right.estimatedBand || left.name.localeCompare(right.name);
    }

    if (sortBy === "most_pending") {
      return right.pendingCount - left.pendingCount || left.lastActiveMinutesAgo - right.lastActiveMinutesAgo;
    }

    return left.lastActiveMinutesAgo - right.lastActiveMinutesAgo;
  });

  return sorted;
}

function matchTargetFilter(student: TeacherStudent, targetFilter: TeacherStudentsTargetFilter) {
  if (targetFilter === "all") {
    return true;
  }

  const thresholds: Record<Exclude<TeacherStudentsTargetFilter, "all">, number> = {
    "6_plus": 6,
    "6_5_plus": 6.5,
    "7_plus": 7,
    "7_5_plus": 7.5
  };

  return student.targetBand >= thresholds[targetFilter];
}

export function getTeacherProfile() {
  return TEACHER_PROFILE;
}

export function getTeacherNavItems() {
  return TEACHER_NAV_ITEMS;
}

export function getTeacherQuickActions() {
  return TEACHER_QUICK_ACTIONS;
}

export function getTeacherStudentsSummary(): TeacherStudentsSummary {
  return {
    totalStudents: TEACHER_STUDENTS.length,
    studentsImproving: TEACHER_STUDENTS.filter((student) => student.progressState === "improving").length,
    needingHelp: TEACHER_STUDENTS.filter((student) => student.progressState === "needs_help").length,
    inactiveStudents: TEACHER_STUDENTS.filter((student) => student.status === "inactive").length
  };
}

export function getTeacherStudentsForList({
  query = "",
  progressFilter = "all",
  targetFilter = "all",
  statusFilter = "all",
  sortBy = "recent_activity"
}: {
  query?: string;
  progressFilter?: TeacherStudentsProgressFilter;
  targetFilter?: TeacherStudentsTargetFilter;
  statusFilter?: TeacherStudentsStatusFilter;
  sortBy?: TeacherStudentsSortBy;
}) {
  const normalizedQuery = query.trim().toLowerCase();
  const items = TEACHER_STUDENTS.map(toListItem).filter((student) => {
    if (progressFilter !== "all" && student.progressState !== progressFilter) {
      return false;
    }

    if (statusFilter !== "all" && student.status !== statusFilter) {
      return false;
    }

    if (!matchTargetFilter(student, targetFilter)) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    return (
      student.name.toLowerCase().includes(normalizedQuery)
      || student.studentCode.toLowerCase().includes(normalizedQuery)
      || student.id.toLowerCase().includes(normalizedQuery)
    );
  });

  return sortStudents(items, sortBy);
}

export function findTeacherStudentById(studentId: string) {
  const student = TEACHER_STUDENTS.find((item) => item.id === studentId);
  if (!student) {
    return null;
  }

  return toListItem(student);
}

export function getTeacherStudentRecentAttempts(studentId: string, limit = 6): TeacherStudentProfileAttemptRow[] {
  return TEACHER_STUDENT_ATTEMPTS
    .filter((attempt) => attempt.studentId === studentId)
    .sort((left, right) => new Date(right.attemptedAt).getTime() - new Date(left.attemptedAt).getTime())
    .slice(0, limit)
    .map((attempt) => ({
      id: attempt.id,
      title: attempt.title,
      module: attempt.module,
      scoreLabel: attempt.scoreLabel,
      band: attempt.band,
      attemptedAt: attempt.attemptedAt
    }));
}

export function getTeacherStudentRecentActivity(studentId: string, limit = 6): TeacherStudentProfileActivityRow[] {
  const activity = TEACHER_STUDENT_TIMELINE_EVENTS
    .filter((event) => event.studentId === studentId)
    .sort((left, right) => new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime())
    .slice(0, limit);

  return activity.map((item) => ({
    id: item.id,
    activityKey: mapActivityTypeToKey(item.type),
    occurredAt: item.occurredAt
  }));
}

export function getTeacherStudentAssignments(studentId: string, limit = 6): TeacherStudentProfileAssignmentRow[] {
  const assignmentsById = new Map(TEACHER_ASSIGNMENTS.map((assignment) => [assignment.id, assignment]));
  const reviewedPairs = getTeacherReviewedAssignmentPairs();
  const rows = TEACHER_ASSIGNMENT_TASKS
    .filter((task) => task.studentId === studentId)
    .map((task) => {
      const assignment = assignmentsById.get(task.assignmentId);
      if (!assignment) {
        return null;
      }
      const isReviewedFromWorkspace = reviewedPairs.has(`${assignment.id}::${task.studentId}`);

      return {
        id: task.id,
        assignmentId: assignment.id,
        title: assignment.title,
        module: assignment.module,
        dueAt: assignment.dueAt,
        status: isReviewedFromWorkspace ? "reviewed" : mapTaskStatusToProfileStatus(task.status)
      } satisfies TeacherStudentProfileAssignmentRow;
    })
    .filter((item): item is TeacherStudentProfileAssignmentRow => Boolean(item))
    .sort((left, right) => new Date(left.dueAt).getTime() - new Date(right.dueAt).getTime());

  const workspaceRows = getTeacherWorkspaceAssignments()
    .filter((item) => item.assignedStudentIds.includes(studentId))
    .map((item) => ({
      id: `workspace-profile-${item.id}`,
      assignmentId: item.id,
      title: item.title,
      module: assignmentTypeToModule(item.type),
      dueAt: item.dueAt,
      status: item.status === "completed" ? "reviewed" : item.status === "draft" ? "pending" : "completed"
    } satisfies TeacherStudentProfileAssignmentRow))
    .sort((left, right) => new Date(left.dueAt).getTime() - new Date(right.dueAt).getTime());

  const merged = [...workspaceRows, ...rows]
    .sort((left, right) => new Date(left.dueAt).getTime() - new Date(right.dueAt).getTime())
    .slice(0, limit);

  if (merged.length > 0) {
    return merged;
  }

  return TEACHER_ASSIGNMENTS.filter((assignment) => assignment.status === "active")
    .slice(0, Math.min(limit, 3))
    .map((assignment, index) => ({
      id: `fallback-assignment-${studentId}-${index + 1}`,
      assignmentId: assignment.id,
      title: assignment.title,
      module: assignment.module,
      dueAt: assignment.dueAt,
      status: "pending" as const
    }));
}

export function getTeacherStudentInitialNotes(studentId: string) {
  return TEACHER_STUDENT_INITIAL_NOTES
    .filter((note) => note.studentId === studentId)
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
}

export function getTeacherStudentProfileData(studentId: string): TeacherStudentProfileData | null {
  const student = findTeacherStudentById(studentId);
  if (!student) {
    return null;
  }

  const profileMeta = getStudentProfileMeta(studentId);

  return {
    student,
    joinedAt: profileMeta.joinedAt,
    testsDone: profileMeta.testsDone,
    streakDays: profileMeta.streakDays,
    recommendation: profileMeta.recommendation,
    bandProgress: profileMeta.bandProgress,
    weakAreas: profileMeta.weakAreas,
    recentAttempts: getTeacherStudentRecentAttempts(studentId, 6),
    recentActivity: getTeacherStudentRecentActivity(studentId, 6),
    activeAssignments: getTeacherStudentAssignments(studentId, 6),
    initialNotes: getTeacherStudentInitialNotes(studentId)
  };
}

export function getTeacherStudentProgressData(studentId: string): TeacherStudentProgressData | null {
  const student = findTeacherStudentById(studentId);
  if (!student) {
    return null;
  }

  const profileMeta = getStudentProfileMeta(studentId);
  const weakAreasByType = ensureWeakAreas(profileMeta.weakAreas);
  const relevantActivityTypes = new Set(["completed_reading_test", "submitted_writing_assignment", "started_listening_drill"]);
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const testsThisWeek = TEACHER_STUDENT_TIMELINE_EVENTS.filter(
    (event) => event.studentId === studentId
      && relevantActivityTypes.has(event.type)
      && new Date(event.occurredAt).getTime() >= oneWeekAgo
  ).length;

  const initialBand = profileMeta.bandProgress[0]?.band ?? roundBand(clamp(student.estimatedBand - 1.0, 4.0, 8.0));
  const improvementBand = roundBand(student.estimatedBand - initialBand);
  const totalTests = Math.max(profileMeta.testsDone, getTeacherStudentRecentAttempts(studentId, 24).length);
  const averageStudyTimeHours = roundHalf(
    clamp(0.6 + testsThisWeek * 0.3 + (student.progressState === "improving" ? 0.2 : 0), 0.5, 3.5)
  );

  const recommendations = [...weakAreasByType]
    .sort((left, right) => left.accuracy - right.accuracy)
    .slice(0, 3)
    .map((area, index) => {
      const priority: TeacherStudentRecommendationPriority =
        area.accuracy < 50 ? "high" : area.accuracy < 70 ? "medium" : "normal";

      return {
        id: `recommendation-${studentId}-${index + 1}`,
        targetSkill: area.label,
        focusModule: weakSkillToModule(area.label),
        priority,
        moduleCount: clamp(Math.ceil((100 - area.accuracy) / 22), 1, 5)
      } satisfies TeacherStudentRecommendation;
    });

  return {
    student,
    summary: {
      studentId: student.id,
      studentCode: student.studentCode,
      targetBand: student.targetBand,
      currentBand: student.estimatedBand,
      totalTests,
      improvementBand,
      testsThisWeek,
      averageStudyTimeHours,
      streakDays: profileMeta.streakDays,
      lastActivity: student.lastActivity
    },
    bandProgression: pickBandProgression(profileMeta.bandProgress),
    modulePerformance: (["reading", "listening", "writing", "speaking"] as const).map((module) => ({
      module,
      score: student.moduleBands[module],
      target: student.targetModuleBands[module]
    })),
    weakAreasByType,
    recommendations
  };
}

export type TeacherAssignmentCreateInput = {
  title: string;
  type: TeacherAssignmentTypeKey;
  assignedToMode: TeacherAssignmentAssignModeKey;
  assignedStudentIds: string[];
  dueAt: string;
  instructions: string;
  status: "draft" | "active";
  contextRecommendationSkill?: TeacherWeakSkillKey;
};

export type TeacherAssignmentPrefillContext = {
  studentId?: string;
  recommendationSkill?: TeacherWeakSkillKey;
  prefilledTitle?: string;
  prefilledInstructions?: string;
};

export function getTeacherAssignmentPrefillContext(input: {
  studentId?: string | null;
  recommendationSkill?: string | null;
  title?: string | null;
  instructions?: string | null;
}) {
  const recommendationSkill = input.recommendationSkill as TeacherWeakSkillKey | undefined;
  const student = input.studentId ? findTeacherStudentById(input.studentId) : null;
  const recentDraft = input.studentId ? getTeacherRecommendationAssignmentDrafts(input.studentId).at(0) : undefined;
  const fallbackSkill = recommendationSkill ?? recentDraft?.targetSkill;

  const prefilledTitle = input.title?.trim()
    || (fallbackSkill ? `Practice ${weakSkillLabel(fallbackSkill)}` : undefined);
  const prefilledInstructions = input.instructions?.trim()
    || (fallbackSkill
      ? `Focus on ${weakSkillLabel(fallbackSkill)} exercises and complete the assigned set before due date.`
      : undefined);

  return {
    studentId: student?.id,
    recommendationSkill: fallbackSkill,
    prefilledTitle,
    prefilledInstructions
  } satisfies TeacherAssignmentPrefillContext;
}

export function getTeacherAssignmentsPageData(): TeacherAssignmentsPageData {
  const rows = [...collectWorkspaceAssignmentRows(), ...collectBaseAssignmentRows()]
    .sort((left, right) => new Date(right.dueAt).getTime() - new Date(left.dueAt).getTime());

  const summary = rows.reduce(
    (acc, item) => {
      if (item.status === "active") {
        acc.activeAssignments += 1;
      }

      if (item.status === "completed") {
        acc.completed += 1;
      }

      if (item.status === "overdue") {
        acc.overdue += 1;
      }

      if (item.status === "active" && getDueSoon(item.dueAt)) {
        acc.dueSoon += 1;
      }

      return acc;
    },
    {activeAssignments: 0, dueSoon: 0, completed: 0, overdue: 0} satisfies TeacherAssignmentsSummary
  );

  const progressSource = rows
    .filter((item) => item.status === "active" || item.status === "completed")
    .slice(0, 3);

  const progressItems = progressSource.map((item, index) => ({
    id: `assignment-progress-${item.id}`,
    label: item.title,
    value: item.progressPercent,
    tone: index === 1 ? "amber" : index === 2 ? "emerald" : "blue"
  } satisfies TeacherAssignmentProgressItem));

  return {
    summary,
    progressItems,
    activeAssignments: rows
  };
}

export function createTeacherAssignment(input: TeacherAssignmentCreateInput) {
  const assignedStudentIds = resolveAssignedStudentIds(input.assignedToMode, input.assignedStudentIds);

  return createTeacherWorkspaceAssignment({
    title: input.title,
    type: input.type,
    assignedToMode: input.assignedToMode,
    assignedStudentIds,
    dueAt: input.dueAt,
    instructions: input.instructions,
    status: input.status,
    contextRecommendationSkill: input.contextRecommendationSkill
  });
}

export function updateTeacherAssignmentStatus(assignmentId: string, status: TeacherAssignmentRowStatus) {
  return updateTeacherWorkspaceAssignmentStatus(assignmentId, status);
}

type ReviewSelectionContext = {
  assignmentId?: string | null;
  studentId?: string | null;
  submissionId?: string | null;
};

function mapBaseTaskToReviewSubmission(
  task: (typeof TEACHER_ASSIGNMENT_TASKS)[number],
  assignmentsMap: Map<string, (typeof TEACHER_ASSIGNMENTS)[number]>,
  studentsMap: Map<string, TeacherStudentListItem>,
  reviewedPairs: Set<string>
): TeacherReviewSubmission | null {
  const assignment = assignmentsMap.get(task.assignmentId);
  const student = studentsMap.get(task.studentId);

  if (!assignment || !student) {
    return null;
  }

  if (task.status === "todo") {
    return null;
  }

  const type = assignmentModuleToReviewType(assignment.module);
  const defaultCriteria = defaultReviewCriteria(student, type);
  const reviewedFromWorkspace = reviewedPairs.has(`${assignment.id}::${student.id}`);
  const derivedStatus = reviewedFromWorkspace ? "reviewed" : scoreFromTaskStatus(task.status, assignment.dueAt);
  const content = createReviewContent({
    studentName: student.name,
    assignmentTitle: assignment.title,
    type
  });
  const selectedBand = derivedStatus === "reviewed" ? defaultBandFromCriteria(defaultCriteria) : null;

  return {
    id: `submission-task-${task.id}`,
    studentId: student.id,
    studentName: student.name,
    studentAvatarFallback: student.avatarFallback,
    assignmentId: assignment.id,
    assignmentTitle: assignment.title,
    module: assignment.module,
    type,
    submittedAt: task.updatedAt,
    status: derivedStatus,
    content,
    contentPreview: reviewPreview(content),
    selectedBand,
    teacherFeedback:
      derivedStatus === "reviewed"
        ? `Reviewed by ${TEACHER_PROFILE.name.replace("Dr. ", "")}. Continue targeted ${assignment.module} drills.`
        : "",
    criteria: defaultCriteria,
    reviewedAt: derivedStatus === "reviewed" ? task.updatedAt : undefined,
    isDraft: false,
    source: "task"
  };
}

function mapWorkspaceAssignmentToSubmissions(
  assignment: TeacherWorkspaceAssignment,
  studentsMap: Map<string, TeacherStudentListItem>
): TeacherReviewSubmission[] {
  if (assignment.status === "draft") {
    return [] as TeacherReviewSubmission[];
  }

  const candidateStudentIds = assignment.assignedStudentIds.slice(0, assignment.assignedToMode === "one" ? 1 : 2);

  return candidateStudentIds
    .map((studentId, index) => {
      const student = studentsMap.get(studentId);
      if (!student) {
        return null;
      }

      const submittedAt = new Date(new Date(assignment.createdAt).getTime() + (90 + index * 40) * 60 * 1000).toISOString();
      const type = assignmentModuleToReviewType(assignmentTypeToModule(assignment.type));
      const criteria = defaultReviewCriteria(student, type);
      const status: TeacherReviewSubmissionStatus =
        assignment.status === "completed"
          ? "reviewed"
          : new Date(assignment.dueAt).getTime() < Date.now()
            ? "overdue"
            : "pending";
      const content = createReviewContent({
        studentName: student.name,
        assignmentTitle: assignment.title,
        type,
        instructions: assignment.instructions
      });

      return {
        id: `submission-workspace-${assignment.id}-${student.id}`,
        studentId: student.id,
        studentName: student.name,
        studentAvatarFallback: student.avatarFallback,
        assignmentId: assignment.id,
        assignmentTitle: assignment.title,
        module: assignmentTypeToModule(assignment.type),
        type,
        submittedAt,
        status,
        content,
        contentPreview: reviewPreview(content),
        selectedBand: status === "reviewed" ? defaultBandFromCriteria(criteria) : null,
        teacherFeedback:
          status === "reviewed" ? `Submission reviewed. Keep applying feedback in ${assignment.title}.` : "",
        criteria,
        reviewedAt: status === "reviewed" ? submittedAt : undefined,
        isDraft: false,
        source: "workspace"
      } as TeacherReviewSubmission;
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
}

function pickReviewFeed(submissions: TeacherReviewSubmission[]) {
  const sorted = [...submissions].sort((left, right) => new Date(right.submittedAt).getTime() - new Date(left.submittedAt).getTime());
  const workspace = sorted.filter((item) => item.source === "workspace");
  const base = sorted.filter((item) => item.source === "task");

  const overdue = base.filter((item) => item.status === "overdue").slice(0, 3);
  const pending = base.filter((item) => item.status === "pending").slice(0, 9);
  const reviewed = base.filter((item) => item.status === "reviewed").slice(0, 18);

  const unique = new Map<string, TeacherReviewSubmission>();

  [...workspace, ...overdue, ...pending, ...reviewed].forEach((item) => {
    if (!unique.has(item.id)) {
      unique.set(item.id, item);
    }
  });

  return Array.from(unique.values()).sort(
    (left, right) => new Date(right.submittedAt).getTime() - new Date(left.submittedAt).getTime()
  );
}

function applyWorkspaceReviewOverride(submission: TeacherReviewSubmission) {
  const record = getTeacherReviewWorkspaceRecordBySubmission(submission.id);
  if (!record) {
    return submission;
  }

  return {
    ...submission,
    status: record.status,
    selectedBand: record.selectedBand,
    teacherFeedback: record.teacherFeedback,
    criteria: record.criteria,
    reviewedAt: record.reviewedAt ?? submission.reviewedAt,
    isDraft: record.isDraft
  } satisfies TeacherReviewSubmission;
}

function buildTeacherReviewSubmissions() {
  const students = getTeacherStudentsForList({sortBy: "recent_activity"});
  const studentsMap = new Map(students.map((item) => [item.id, item]));
  const assignmentsMap = new Map(TEACHER_ASSIGNMENTS.map((item) => [item.id, item]));
  const reviewedPairs = getTeacherReviewedAssignmentPairs();

  const baseTaskSubmissions = TEACHER_ASSIGNMENT_TASKS
    .map((task) => mapBaseTaskToReviewSubmission(task, assignmentsMap, studentsMap, reviewedPairs))
    .filter((item): item is TeacherReviewSubmission => Boolean(item));

  const workspaceSubmissions = getTeacherWorkspaceAssignments().flatMap((item) => mapWorkspaceAssignmentToSubmissions(item, studentsMap));
  const merged = pickReviewFeed([...workspaceSubmissions, ...baseTaskSubmissions]).map(applyWorkspaceReviewOverride);

  return merged.sort((left, right) => new Date(right.submittedAt).getTime() - new Date(left.submittedAt).getTime());
}

function getStartOfTodayUtc() {
  const now = new Date();
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
}

function buildTeacherReviewSummary(submissions: TeacherReviewSubmission[]): TeacherReviewsSummary {
  const pending = submissions.filter((item) => item.status === "pending").length;
  const overdue = submissions.filter((item) => item.status === "overdue").length;
  const reviewed = submissions.filter((item) => item.status === "reviewed");
  const startOfTodayUtc = getStartOfTodayUtc();

  const reviewedToday = reviewed.filter((item) => {
    if (!item.reviewedAt) {
      return false;
    }

    return new Date(item.reviewedAt).getTime() >= startOfTodayUtc;
  }).length;

  const averageBandScore = reviewed.length
    ? Math.round((reviewed.reduce((sum, item) => sum + (item.selectedBand ?? 0), 0) / reviewed.length) * 10) / 10
    : 0;

  return {
    pendingReviews: pending + overdue,
    reviewedToday,
    averageBandScore,
    overdueSubmissions: overdue
  };
}

function buildTeacherReviewRecentActivity(submissions: TeacherReviewSubmission[]) {
  const fromSubmissions = submissions
    .filter((item) => item.status === "reviewed" && item.reviewedAt && item.selectedBand !== null)
    .map((item) => ({
      id: `activity-base-${item.id}`,
      studentId: item.studentId,
      studentName: item.studentName,
      submissionId: item.id,
      assignmentTitle: item.assignmentTitle,
      finalBand: item.selectedBand ?? 0,
      reviewedAt: item.reviewedAt ?? item.submittedAt
    } satisfies TeacherReviewActivityItem));

  const studentsMap = new Map(getTeacherStudentsForList({sortBy: "name"}).map((item) => [item.id, item]));
  const fromWorkspace = getTeacherReviewWorkspaceActivities().map((item) => ({
    id: item.id,
    studentId: item.studentId,
    studentName: studentsMap.get(item.studentId)?.name ?? "Student",
    submissionId: item.submissionId,
    assignmentTitle: item.assignmentTitle,
    finalBand: item.finalBand,
    reviewedAt: item.reviewedAt
  } satisfies TeacherReviewActivityItem));

  const merged = [...fromWorkspace, ...fromSubmissions].sort(
    (left, right) => new Date(right.reviewedAt).getTime() - new Date(left.reviewedAt).getTime()
  );

  const unique = new Map<string, TeacherReviewActivityItem>();

  for (const item of merged) {
    if (!unique.has(item.submissionId)) {
      unique.set(item.submissionId, item);
    }
  }

  return Array.from(unique.values()).slice(0, 8);
}

function chooseReviewSelection(submissions: TeacherReviewSubmission[], context: ReviewSelectionContext) {
  if (context.submissionId) {
    const byId = submissions.find((item) => item.id === context.submissionId);
    if (byId) {
      return byId.id;
    }
  }

  if (context.assignmentId && context.studentId) {
    const match = submissions.find(
      (item) => item.assignmentId === context.assignmentId && item.studentId === context.studentId
    );
    if (match) {
      return match.id;
    }
  }

  if (context.assignmentId) {
    const match = submissions.find((item) => item.assignmentId === context.assignmentId);
    if (match) {
      return match.id;
    }
  }

  if (context.studentId) {
    const match = submissions.find((item) => item.studentId === context.studentId);
    if (match) {
      return match.id;
    }
  }

  const pending = submissions.find((item) => item.status === "pending" || item.status === "overdue");
  if (pending) {
    return pending.id;
  }

  return submissions[0]?.id ?? null;
}

export type TeacherReviewDraftInput = {
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
};

export type TeacherReviewSubmitInput = {
  submissionId: string;
  studentId: string;
  assignmentId: string;
  assignmentTitle: string;
  module: TeacherAssignmentModuleKey;
  type: TeacherReviewSubmissionType;
  selectedBand: number;
  teacherFeedback: string;
  criteria: TeacherReviewCriteriaScores;
};

export function saveTeacherReviewDraft(input: TeacherReviewDraftInput) {
  return saveTeacherReviewDraftRecord({
    ...input,
    selectedBand: input.selectedBand !== null ? normalizeBandScore(input.selectedBand) : null
  });
}

export function submitTeacherReview(input: TeacherReviewSubmitInput) {
  return submitTeacherReviewRecord({
    ...input,
    selectedBand: normalizeBandScore(input.selectedBand)
  });
}

export function getTeacherReviewsPageData(context: ReviewSelectionContext = {}): TeacherReviewsPageData {
  const submissions = buildTeacherReviewSubmissions();
  const summary = buildTeacherReviewSummary(submissions);
  const recentActivity = buildTeacherReviewRecentActivity(submissions);

  return {
    summary,
    submissions,
    recentActivity,
    selectedSubmissionId: chooseReviewSelection(submissions, context)
  };
}

function toneFromPercentage(percentage: number): TeacherStudentWeakAreaMetric["tone"] {
  if (percentage < 50) {
    return "weak";
  }

  if (percentage < 68) {
    return "average";
  }

  return "strong";
}

function mapActivityEventToTestStart(type: TeacherStudentActivityType) {
  return type === "started_listening_drill" || type === "completed_reading_test";
}

function buildAnalyticsProgress(primaryStudents: TeacherStudent[], averageBandScore: number) {
  const weeklyBaseline = clamp(averageBandScore - 1.0, 4.5, 8.0);
  const weekly: TeacherBandProgressPoint[] = [
    {id: "weekly-1", label: "week1", value: roundBand(weeklyBaseline)},
    {id: "weekly-2", label: "week2", value: roundBand(weeklyBaseline + 0.5)},
    {id: "weekly-3", label: "week3", value: roundBand(weeklyBaseline + 0.7)},
    {id: "weekly-4", label: "week4", value: roundBand(averageBandScore)}
  ];

  const monthlyAverageSeed =
    TEACHER_DASHBOARD_MONTHLY_PROGRESS.reduce((sum, point) => sum + point.value, 0)
    / Math.max(1, TEACHER_DASHBOARD_MONTHLY_PROGRESS.length);

  const primaryMomentum =
    primaryStudents.reduce((sum, student) => sum + student.bandDelta, 0) / Math.max(1, primaryStudents.length);

  const monthly: TeacherBandProgressPoint[] = TEACHER_DASHBOARD_MONTHLY_PROGRESS.map((point) => ({
    id: `monthly-${point.month}`,
    label: point.month,
    value: roundBand(
      clamp(
        averageBandScore + (point.value - monthlyAverageSeed) * 0.35 + primaryMomentum * 0.1,
        4.5,
        8.5
      )
    )
  }));

  return {weekly, monthly} satisfies Record<TeacherAnalyticsPeriod, TeacherBandProgressPoint[]>;
}

function buildModulePerformance(primaryStudents: TeacherStudent[]): TeacherModulePerformance[] {
  const modules: TeacherModuleKey[] = ["reading", "listening", "writing", "speaking"];

  return modules.map((module) => ({
    module,
    value: roundBand(
      primaryStudents.reduce((sum, student) => sum + student.moduleBands[module], 0) / Math.max(1, primaryStudents.length)
    )
  }));
}

function buildWeakAreaAggregates(primaryStudents: TeacherStudent[]) {
  const labels: TeacherWeakSkillKey[] = [
    "matchingHeadings",
    "trueFalseNotGiven",
    "multipleChoice",
    "sentenceCompletion",
    "listeningPart4"
  ];

  return labels.map((label) => {
    const weakestCount = primaryStudents.filter((student) => student.weakestSkill === label).length;
    const needsHelpCount = primaryStudents.filter(
      (student) => student.progressState === "needs_help" && student.weakestSkill === label
    ).length;
    const atRiskCount = primaryStudents.filter((student) => student.status === "at_risk" && student.weakestSkill === label).length;

    const percentage = roundBand(
      clamp(
        38 + (weakestCount / Math.max(1, primaryStudents.length)) * 220 + (needsHelpCount + atRiskCount * 0.7) * 1.8,
        35,
        88
      )
    );

    return {
      id: `weak-aggregate-${label}`,
      label,
      percentage,
      tone: toneFromPercentage(percentage)
    } satisfies TeacherWeakAreaAggregate;
  });
}

function buildDailyActivity(primaryStudents: TeacherStudent[]): TeacherDailyActivityMetric[] {
  const primaryIds = new Set(primaryStudents.map((student) => student.id));
  const activeStudents = primaryStudents.filter((student) => student.lastActiveMinutesAgo <= 24 * 60).length;
  const inactive = primaryStudents.length - activeStudents;

  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const testsStarted = TEACHER_STUDENT_TIMELINE_EVENTS.filter(
    (event) => primaryIds.has(event.studentId)
      && mapActivityEventToTestStart(event.type)
      && new Date(event.occurredAt).getTime() >= oneDayAgo
  ).length;

  const submissions = TEACHER_ASSIGNMENT_TASKS.filter(
    (task) => primaryIds.has(task.studentId)
      && (task.status === "submitted" || task.status === "pending_review" || task.status === "reviewed")
      && new Date(task.updatedAt).getTime() >= oneDayAgo
  ).length;

  return [
    {id: "activeStudents", value: activeStudents},
    {id: "inactive", value: inactive},
    {id: "testsStarted", value: testsStarted},
    {id: "submissions", value: submissions}
  ];
}

export function getTeacherAnalyticsPageData(): TeacherAnalyticsPageData {
  const primaryStudents = TEACHER_STUDENTS.filter((student) => student.caseload === "primary");
  const primaryIds = new Set(primaryStudents.map((student) => student.id));

  const totalStudents = primaryStudents.length;
  const averageBandScore = roundBand(
    primaryStudents.reduce((sum, student) => sum + student.estimatedBand, 0) / Math.max(1, totalStudents)
  );

  const primaryAttemptsCount = TEACHER_STUDENT_ATTEMPTS.filter((attempt) => primaryIds.has(attempt.studentId)).length;
  const reviewedTaskCount = TEACHER_ASSIGNMENT_TASKS.filter(
    (task) => primaryIds.has(task.studentId) && task.status === "reviewed"
  ).length;
  const testsCompleted = primaryAttemptsCount + reviewedTaskCount;

  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const weeklyActivityEvents = TEACHER_STUDENT_TIMELINE_EVENTS.filter(
    (event) => primaryIds.has(event.studentId) && new Date(event.occurredAt).getTime() >= oneWeekAgo
  ).length;

  const averageStudyTimeHours = roundBand(
    clamp((testsCompleted / Math.max(1, totalStudents)) * 1.3 + weeklyActivityEvents / Math.max(1, totalStudents) * 0.35, 1.6, 6.5)
  );

  return {
    summary: {
      totalStudents,
      averageBandScore,
      testsCompleted,
      averageStudyTimeHours
    },
    progress: buildAnalyticsProgress(primaryStudents, averageBandScore),
    modulePerformance: buildModulePerformance(primaryStudents),
    weakAreas: buildWeakAreaAggregates(primaryStudents),
    dailyActivity: buildDailyActivity(primaryStudents)
  };
}

export function getTeacherClassProgressOverview(students: TeacherStudentListItem[] = TEACHER_STUDENTS.map(toListItem)) {
  const modules: TeacherModuleKey[] = ["reading", "listening", "writing", "speaking"];

  return modules.map((module) => {
    const currentTotal = students.reduce((sum, student) => sum + student.moduleBands[module], 0);
    const targetTotal = students.reduce((sum, student) => sum + student.targetModuleBands[module], 0);
    const denominator = Math.max(1, students.length);

    return {
      module,
      currentMonth: roundBand(currentTotal / denominator),
      target: roundBand(targetTotal / denominator)
    } satisfies TeacherClassProgressPoint;
  });
}

export function getTeacherDashboardOverviewStats(): TeacherDashboardStat[] {
  const primaryStudents = TEACHER_STUDENTS.filter((student) => student.caseload === "primary");
  const pendingReviews = getTeacherReviewsPageData().summary.pendingReviews;
  const activeAssignments = TEACHER_ASSIGNMENTS.filter((assignment) => assignment.status === "active").length;
  const atRiskPrimary = primaryStudents.filter((student) => student.status === "at_risk").length;

  return [
    {key: "studentsAssigned", value: primaryStudents.length, indicator: "upThisMonth", tone: "success"},
    {key: "pendingReviews", value: pendingReviews, indicator: "urgent", tone: "warning"},
    {key: "assignmentsActive", value: activeAssignments, indicator: "currentlyActive", tone: "info"},
    {key: "studentsAtRisk", value: atRiskPrimary, indicator: "needsAttention", tone: "danger"}
  ];
}

export function getTeacherDashboardMonthlyProgress() {
  return TEACHER_DASHBOARD_MONTHLY_PROGRESS.map((point) => ({
    month: point.month as TeacherDashboardMonthKey,
    value: point.value
  }));
}

export function getTeacherDashboardRecentActivity(limit = 3): TeacherDashboardRecentActivityItem[] {
  const studentsMap = new Map(TEACHER_STUDENTS.map((student) => [student.id, student]));

  return [...TEACHER_ACTIVITY_EVENTS]
    .sort((left, right) => new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime())
    .slice(0, limit)
    .map((event) => {
      const student = studentsMap.get(event.studentId);
      const minutesAgo = Math.max(1, Math.round((Date.now() - new Date(event.occurredAt).getTime()) / (1000 * 60)));

      const eventMap: Record<string, TeacherDashboardRecentActivityEventKey> = {
        completed_reading_test: "completedReadingTest3",
        submitted_writing_task_1: "submittedWritingTask1",
        sent_message: "sentMessage"
      };

      const toneMap: Record<string, TeacherDashboardRecentActivityTone> = {
        completed_reading_test: "blue",
        submitted_writing_task_1: "emerald",
        sent_message: "violet"
      };

      let time: TeacherDashboardRecentActivityTimeKey = "twoHoursAgo";
      if (minutesAgo <= 3) {
        time = "twoMinutesAgo";
      } else if (minutesAgo <= 55) {
        time = "fortyFiveMinutesAgo";
      }

      return {
        id: event.id,
        studentName: student?.name ?? "Unknown Student",
        studentInitials: student?.avatarFallback ?? initialsFromName(student?.name ?? "US"),
        event: eventMap[event.type],
        time,
        tone: toneMap[event.type]
      };
    });
}

export function getTeacherDashboardStudentsNeedingHelp(limit = 3): TeacherDashboardStudentNeedingHelp[] {
  const studentsById = new Map(TEACHER_STUDENTS.map((student) => [student.id, student]));
  const fallback = TEACHER_STUDENTS.filter((student) => student.status === "at_risk");
  const ordered = [
    ...dashboardHelpStudentOrder
      .map((id) => studentsById.get(id))
      .filter((student): student is TeacherStudent => Boolean(student)),
    ...fallback.filter((student) => !dashboardHelpStudentOrder.includes(student.id as (typeof dashboardHelpStudentOrder)[number]))
  ];

  const labelById: Record<string, TeacherDashboardLastActivityKey> = {
    "student-james-sterling": "yesterday430",
    "student-maria-valdez": "twoDaysAgo",
    "student-arjun-kapoor": "today1015"
  };

  return ordered.slice(0, limit).map((student) => ({
    id: student.id,
    studentName: student.name,
    studentInitials: student.avatarFallback,
    currentBand: clamp(student.estimatedBand, 4, 8.5),
    weakArea: weakSkillToDashboardKey(student.weakestSkill),
    lastActivity: labelById[student.id] ?? "twoDaysAgo"
  }));
}
