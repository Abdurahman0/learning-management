import type {
  TeacherAnnouncement,
  TeacherAnnouncementAttachment,
  TeacherAnnouncementAudience,
  TeacherAnnouncementEngagement,
  TeacherAnnouncementFormInput,
  TeacherAnnouncementStats,
  TeacherAssignmentModuleKey,
  TeacherAssignmentTaskStatus,
  TeacherChatMessage,
  TeacherModuleKey,
  TeacherProfile,
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
import {
  createTeacherChatMessage,
  getTeacherChatMessages,
  getTeacherChatMessagesByConversation
} from "./messages";
import {
  createTeacherWorkspaceAnnouncement,
  getTeacherAnnouncementsWithWorkspace,
  resolveTeacherAnnouncementAudienceStudentIds
} from "./announcements";
import {
  appendTeacherWorkspaceProfileActivity,
  getTeacherWorkspacePassword,
  getTeacherWorkspaceProfile,
  getTeacherWorkspaceProfileActivities,
  updateTeacherWorkspacePassword,
  updateTeacherWorkspaceProfile,
  type TeacherProfileActivityEntry,
  type TeacherProfileActivityKind
} from "./profile-workspace";

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

export type TeacherWeakAreasSummary = {
  mostDifficultModule: TeacherModuleKey;
  hardestQuestionType: TeacherWeakSkillKey;
  lowestAverageScore: number;
  studentsNeedingHelpCount: number;
};

export type TeacherQuestionTypeAccuracy = {
  id: string;
  label: TeacherWeakSkillKey;
  percentage: number;
  tone: TeacherStudentWeakAreaMetric["tone"];
};

export type TeacherModuleDifficultyValue = {
  module: TeacherModuleKey;
  value: number;
};

export type TeacherWeakAreasStudentRow = {
  id: string;
  name: string;
  avatarFallback: string;
  weakestModule: TeacherModuleKey;
  weakestType: TeacherWeakSkillKey;
  currentBand: number;
  lastActivity: TeacherStudentsLastActivity;
};

export type TeacherCommonMistakeInsight = {
  id: "falseVsNotGiven" | "timeManagementSection3" | "task2Cohesion";
  severity: "high" | "moderate" | "watch";
  metricPrimary: number;
  metricSecondary?: number;
};

export type TeacherPracticeRecommendation = {
  id: string;
  targetSkill: TeacherWeakSkillKey;
  assignMode: "class" | "weak_students";
  delivery: "question_set" | "video_quiz" | "timed_drill";
  questionCount: number;
  targetStudents: number;
};

export type TeacherWeakAreasPageData = {
  summary: TeacherWeakAreasSummary;
  questionTypeAccuracy: TeacherQuestionTypeAccuracy[];
  moduleDifficulty: TeacherModuleDifficultyValue[];
  studentsNeedingImprovement: TeacherWeakAreasStudentRow[];
  totalStudentsNeedingHelp: number;
  commonMistakes: TeacherCommonMistakeInsight[];
  recommendations: TeacherPracticeRecommendation[];
};

export type TeacherConversationListItem = {
  id: string;
  studentId: string;
  studentName: string;
  studentAvatarFallback: string;
  isOnline: boolean;
  unreadCount: number;
  lastMessagePreview: string;
  lastMessageAt: string;
  lastMessageTime: TeacherStudentsLastActivity;
};

export type TeacherConversationMessage = {
  id: string;
  conversationId: string;
  studentId: string;
  senderRole: TeacherChatMessage["senderRole"];
  text: string;
  createdAt: string;
  time: TeacherStudentsLastActivity;
};

export type TeacherMessagesStudentQuickInfo = {
  studentId: string;
  studentName: string;
  studentAvatarFallback: string;
  subtitleKey: "academicIeltsStudent";
  bandEstimate: number;
  targetBand: number;
  lastActivity: TeacherStudentsLastActivity;
  testsCompleted: number;
};

export type TeacherMessagesRecentActivityItem = {
  id: string;
  activityKey: TeacherStudentProfileActivityKey;
  occurredAt: string;
  relative: TeacherStudentsLastActivity;
};

export type TeacherMessagesConversationData = {
  conversation: TeacherConversationListItem;
  messages: TeacherConversationMessage[];
  studentInfo: TeacherMessagesStudentQuickInfo;
  recentActivity: TeacherMessagesRecentActivityItem[];
};

export type TeacherMessagesPageData = {
  conversations: TeacherConversationListItem[];
  selectedConversationId: string | null;
};

export type TeacherAnnouncementAudienceOption = {
  id: TeacherAnnouncementAudience;
  studentCount: number;
};

export type TeacherAnnouncementsPageData = {
  stats: TeacherAnnouncementStats;
  engagement: TeacherAnnouncementEngagement;
  audienceOptions: TeacherAnnouncementAudienceOption[];
};

export type TeacherProfileStatKey = "students" | "tasks" | "reviews" | "messages";

export type TeacherProfileStatItem = {
  id: TeacherProfileStatKey;
  value: number;
};

export type TeacherProfileActivityKey =
  | "accountLogin"
  | "reviewCompleted"
  | "newAssignmentCreated"
  | "passwordChanged"
  | "profileUpdated"
  | "teachingProfileUpdated"
  | "avatarChangeRequested";

export type TeacherProfileActivityItem = {
  id: string;
  activityKey: TeacherProfileActivityKey;
  detail: string;
  location?: string;
  relative: TeacherStudentsLastActivity;
  occurredAt: string;
};

export type TeacherProfilePageData = {
  profile: TeacherProfile;
  stats: TeacherProfileStatItem[];
  recentActivity: TeacherProfileActivityItem[];
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

function relativeFromIso(iso: string): TeacherStudentsLastActivity {
  const minutes = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / (1000 * 60)));
  return relativeActivity(minutes);
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
  return getTeacherWorkspaceProfile();
}

export function getTeacherNavItems() {
  return TEACHER_NAV_ITEMS;
}

export function getTeacherQuickActions() {
  return TEACHER_QUICK_ACTIONS;
}

function buildTeacherConversationList(group?: string | null) {
  const studentsById = new Map(TEACHER_STUDENTS.map((student) => [student.id, toListItem(student)]));
  const conversations = TEACHER_MESSAGE_THREADS.map((thread) => {
    const student = studentsById.get(thread.studentId);
    if (!student) {
      return null;
    }

    const messages = getTeacherChatMessagesByConversation(thread.id);
    const lastMessage = messages.at(-1);
    const lastMessageAt = lastMessage?.createdAt ?? thread.lastMessageAt;

    return {
      id: thread.id,
      studentId: student.id,
      studentName: student.name,
      studentAvatarFallback: student.avatarFallback,
      isOnline: student.lastActiveMinutesAgo <= 15,
      unreadCount: thread.unreadCount,
      lastMessagePreview: (lastMessage?.text ?? "").trim(),
      lastMessageAt,
      lastMessageTime: relativeFromIso(lastMessageAt),
      status: student.status
    };
  })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .sort((left, right) => {
      const activeBoostLeft = group === "active" && left.status === "active" ? 1 : 0;
      const activeBoostRight = group === "active" && right.status === "active" ? 1 : 0;
      if (activeBoostLeft !== activeBoostRight) {
        return activeBoostRight - activeBoostLeft;
      }

      if (left.unreadCount !== right.unreadCount) {
        return right.unreadCount - left.unreadCount;
      }

      return new Date(right.lastMessageAt).getTime() - new Date(left.lastMessageAt).getTime();
    })
    .map((item) => ({
      id: item.id,
      studentId: item.studentId,
      studentName: item.studentName,
      studentAvatarFallback: item.studentAvatarFallback,
      isOnline: item.isOnline,
      unreadCount: item.unreadCount,
      lastMessagePreview: item.lastMessagePreview,
      lastMessageAt: item.lastMessageAt,
      lastMessageTime: item.lastMessageTime
    }) satisfies TeacherConversationListItem);

  return conversations;
}

export function resolveTeacherConversationIdByStudentId(studentId: string) {
  const match = TEACHER_MESSAGE_THREADS.find((thread) => thread.studentId === studentId);
  return match?.id ?? null;
}

export function getTeacherMessagesPageData(context: {studentId?: string | null; source?: string | null; group?: string | null} = {}): TeacherMessagesPageData {
  const conversations = buildTeacherConversationList(context.group);
  const selectedFromStudent = context.studentId ? resolveTeacherConversationIdByStudentId(context.studentId) : null;
  const selectedConversationId = selectedFromStudent ?? conversations[0]?.id ?? null;

  return {
    conversations,
    selectedConversationId
  };
}

export function getTeacherMessagesConversationData(conversationId: string): TeacherMessagesConversationData | null {
  const conversation = buildTeacherConversationList().find((item) => item.id === conversationId);
  if (!conversation) {
    return null;
  }

  const student = findTeacherStudentById(conversation.studentId);
  if (!student) {
    return null;
  }

  const profileMeta = getStudentProfileMeta(student.id);
  const testsCompleted = Math.max(profileMeta.testsDone, getTeacherStudentRecentAttempts(student.id, 60).length);
  const messages = getTeacherChatMessagesByConversation(conversationId).map((item) => ({
    id: item.id,
    conversationId: item.conversationId,
    studentId: item.studentId,
    senderRole: item.senderRole,
    text: item.text,
    createdAt: item.createdAt,
    time: relativeFromIso(item.createdAt)
  }) satisfies TeacherConversationMessage);

  const recentActivity = getTeacherStudentRecentActivity(student.id, 3).map((item) => ({
    id: item.id,
    activityKey: item.activityKey,
    occurredAt: item.occurredAt,
    relative: relativeFromIso(item.occurredAt)
  }) satisfies TeacherMessagesRecentActivityItem);

  return {
    conversation,
    messages,
    studentInfo: {
      studentId: student.id,
      studentName: student.name,
      studentAvatarFallback: student.avatarFallback,
      subtitleKey: "academicIeltsStudent",
      bandEstimate: student.estimatedBand,
      targetBand: student.targetBand,
      lastActivity: student.lastActivity,
      testsCompleted
    },
    recentActivity
  };
}

export function sendTeacherMessage(input: {conversationId: string; studentId: string; text: string}): TeacherConversationMessage | null {
  const content = input.text.trim();
  if (!content) {
    return null;
  }

  const created = createTeacherChatMessage({
    conversationId: input.conversationId,
    studentId: input.studentId,
    text: content
  });

  return {
    id: created.id,
    conversationId: created.conversationId,
    studentId: created.studentId,
    senderRole: created.senderRole,
    text: created.text,
    createdAt: created.createdAt,
    time: relativeFromIso(created.createdAt)
  };
}

const announcementAudienceOptions: TeacherAnnouncementAudience[] = [
  "all",
  "weak_students",
  "reading_students",
  "writing_students"
];

export type TeacherAnnouncementCreateMode = "draft" | "publish";

export type TeacherAnnouncementCreateInput = TeacherAnnouncementFormInput & {
  mode: TeacherAnnouncementCreateMode;
};

function audienceIdsForAnnouncement(audience: TeacherAnnouncementAudience) {
  return resolveTeacherAnnouncementAudienceStudentIds(audience);
}

function normalizeAnnouncementDate(date?: string) {
  if (!date) {
    return undefined;
  }

  const normalized = date.trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return `${normalized}T12:00:00.000Z`;
  }

  const slashPattern = normalized.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashPattern) {
    const [, month, day, year] = slashPattern;
    const mm = month.padStart(2, "0");
    const dd = day.padStart(2, "0");
    return `${year}-${mm}-${dd}T12:00:00.000Z`;
  }

  return undefined;
}

function buildTeacherAnnouncementStats(announcements: TeacherAnnouncement[]): TeacherAnnouncementStats {
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const publishedThisWeek = announcements.filter(
    (item) => item.status === "published" && new Date(item.createdAt).getTime() >= oneWeekAgo
  ).length;
  const scheduled = announcements.filter((item) => item.status === "scheduled").length;

  const reachedStudents = new Set<string>();
  announcements
    .filter((item) => item.status === "published")
    .forEach((item) => {
      audienceIdsForAnnouncement(item.audience).forEach((studentId) => reachedStudents.add(studentId));
    });

  return {
    totalAnnouncements: announcements.length,
    publishedThisWeek,
    scheduled,
    studentsReached: reachedStudents.size
  };
}

function buildTeacherAnnouncementEngagement(announcements: TeacherAnnouncement[]): TeacherAnnouncementEngagement {
  const published = announcements.filter((item) => item.status === "published");

  if (published.length === 0) {
    return {
      totalViewsPercent: 0,
      resourceClicksPercent: 0,
      unreadPercent: 0
    };
  }

  const audienceTotal = published.reduce((sum, item) => sum + audienceIdsForAnnouncement(item.audience).length, 0);
  const viewsTotal = published.reduce((sum, item) => sum + item.views, 0);
  const resourceClicksTotal = published.reduce((sum, item) => sum + item.resourceClicks, 0);
  const unreadTotal = published.reduce((sum, item) => {
    const audienceCount = audienceIdsForAnnouncement(item.audience).length;
    return sum + audienceCount * (item.unreadRate / 100);
  }, 0);

  return {
    totalViewsPercent: Math.round(clamp((viewsTotal / Math.max(1, audienceTotal)) * 100, 0, 100)),
    resourceClicksPercent: Math.round(clamp((resourceClicksTotal / Math.max(1, viewsTotal)) * 100, 0, 100)),
    unreadPercent: Math.round(clamp((unreadTotal / Math.max(1, audienceTotal)) * 100, 0, 100))
  };
}

export function getTeacherAnnouncementAudienceOptions(): TeacherAnnouncementAudienceOption[] {
  return announcementAudienceOptions.map((id) => ({
    id,
    studentCount: audienceIdsForAnnouncement(id).length
  }));
}

export function getTeacherAnnouncementsPageData(): TeacherAnnouncementsPageData {
  const announcements = getTeacherAnnouncementsWithWorkspace();

  return {
    stats: buildTeacherAnnouncementStats(announcements),
    engagement: buildTeacherAnnouncementEngagement(announcements),
    audienceOptions: getTeacherAnnouncementAudienceOptions()
  };
}

export function createTeacherAnnouncement(input: TeacherAnnouncementCreateInput): TeacherAnnouncement | null {
  const title = input.title.trim();
  const content = input.content.trim();

  if (title.length < 3 || content.length < 8) {
    return null;
  }

  const audienceCount = audienceIdsForAnnouncement(input.audience).length;
  const scheduledAt = normalizeAnnouncementDate(input.scheduledDate);
  const scheduleInFuture = scheduledAt ? new Date(scheduledAt).getTime() > Date.now() : false;
  const status =
    input.mode === "draft"
      ? "draft"
      : scheduleInFuture
        ? "scheduled"
        : "published";

  const views = status === "published"
    ? Math.round(clamp(audienceCount * (input.audience === "all" ? 0.28 : 0.33), 0, audienceCount))
    : 0;
  const resourceClicks = status === "published"
    ? Math.round(views * (input.attachment ? 0.42 : 0.2))
    : 0;
  const unreadRate = status === "published"
    ? Math.round(clamp(100 - (views / Math.max(1, audienceCount)) * 100 + 8, 8, 88))
    : 100;

  return createTeacherWorkspaceAnnouncement({
    title,
    content,
    audience: input.audience,
    status,
    scheduledAt,
    attachment: input.attachment as TeacherAnnouncementAttachment | undefined,
    views,
    resourceClicks,
    unreadRate
  });
}

export type TeacherProfilePersonalInfoInput = {
  fullName: string;
  email: string;
  phone: string;
  country: string;
  timezone: string;
};

export type TeacherTeachingProfileInput = {
  specialization: string;
  experienceYears: number;
  bio: string;
  preferredModules: TeacherModuleKey[];
};

export type TeacherPasswordUpdateInput = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export type TeacherPasswordUpdateError =
  | "currentPasswordIncorrect"
  | "passwordMismatch"
  | "passwordTooShort"
  | "passwordUnchanged";

export type TeacherPasswordUpdateResult = {
  success: boolean;
  error?: TeacherPasswordUpdateError;
};

function mapProfileActivityKind(kind: TeacherProfileActivityKind): TeacherProfileActivityKey {
  if (kind === "account_login") {
    return "accountLogin";
  }

  if (kind === "review_completed") {
    return "reviewCompleted";
  }

  if (kind === "assignment_created") {
    return "newAssignmentCreated";
  }

  if (kind === "password_changed") {
    return "passwordChanged";
  }

  if (kind === "teaching_profile_updated") {
    return "teachingProfileUpdated";
  }

  if (kind === "avatar_change_requested") {
    return "avatarChangeRequested";
  }

  return "profileUpdated";
}

function buildTeacherProfileStats(): TeacherProfileStatItem[] {
  const students = TEACHER_STUDENTS.length;

  const workspaceTaskCount = getTeacherWorkspaceAssignments().reduce((sum, item) => {
    return sum + resolveAssignedStudentIds(item.assignedToMode, item.assignedStudentIds).length;
  }, 0);
  const tasks = TEACHER_ASSIGNMENT_TASKS.length + workspaceTaskCount;

  const reviewedBase = TEACHER_REVIEWS.filter((item) => item.status === "completed").length;
  const reviewedTaskCount = TEACHER_ASSIGNMENT_TASKS.filter((task) => task.status === "reviewed").length;
  const reviewedWorkspace = getTeacherReviewWorkspaceActivities().length;
  const reviews = reviewedBase + reviewedTaskCount + reviewedWorkspace;

  const messages = getTeacherChatMessages().length;

  return [
    {id: "students", value: students},
    {id: "tasks", value: tasks},
    {id: "reviews", value: reviews},
    {id: "messages", value: messages}
  ];
}

function toTeacherProfileActivityItem(entry: TeacherProfileActivityEntry): TeacherProfileActivityItem {
  return {
    id: entry.id,
    activityKey: mapProfileActivityKind(entry.kind),
    detail: entry.detail,
    location: entry.location,
    relative: relativeFromIso(entry.occurredAt),
    occurredAt: entry.occurredAt
  };
}

function calculateProfileCompletion(profile: TeacherProfile) {
  const base = 62;
  const completeness =
    (profile.phone.trim().length > 0 ? 6 : 0)
    + (profile.country.trim().length > 0 ? 6 : 0)
    + (profile.timezone.trim().length > 0 ? 6 : 0)
    + (profile.specialization.trim().length > 0 ? 6 : 0)
    + (profile.bio.trim().length > 30 ? 8 : 0)
    + Math.min(8, profile.preferredModules.length * 2)
    + (profile.verified ? 6 : 0);

  return clamp(base + completeness, 48, 100);
}

export function getTeacherProfilePageData(): TeacherProfilePageData {
  const profile = getTeacherProfile();

  return {
    profile,
    stats: buildTeacherProfileStats(),
    recentActivity: getTeacherWorkspaceProfileActivities().slice(0, 7).map(toTeacherProfileActivityItem)
  };
}

export function updateTeacherProfilePersonalInfo(input: TeacherProfilePersonalInfoInput) {
  const current = getTeacherProfile();
  const nextName = input.fullName.trim();

  const updated = updateTeacherWorkspaceProfile({
    name: nextName,
    email: input.email.trim(),
    phone: input.phone.trim(),
    country: input.country.trim(),
    timezone: input.timezone.trim(),
    avatarFallback: initialsFromName(nextName || current.name)
  });

  updateTeacherWorkspaceProfile({
    profileCompletion: calculateProfileCompletion(updated)
  });

  appendTeacherWorkspaceProfileActivity({
    kind: "profile_updated",
    detail: "Personal information updated"
  });

  return getTeacherProfile();
}

export function updateTeacherTeachingProfile(input: TeacherTeachingProfileInput) {
  const updated = updateTeacherWorkspaceProfile({
    specialization: input.specialization.trim(),
    experienceYears: roundBand(input.experienceYears),
    bio: input.bio.trim(),
    preferredModules: input.preferredModules
  });

  updateTeacherWorkspaceProfile({
    profileCompletion: calculateProfileCompletion(updated)
  });

  appendTeacherWorkspaceProfileActivity({
    kind: "teaching_profile_updated",
    detail: "Teaching profile updated"
  });

  return getTeacherProfile();
}

export function requestTeacherAvatarChange() {
  appendTeacherWorkspaceProfileActivity({
    kind: "avatar_change_requested",
    detail: "Avatar change requested"
  });
}

export function updateTeacherPassword(input: TeacherPasswordUpdateInput): TeacherPasswordUpdateResult {
  if (input.currentPassword !== getTeacherWorkspacePassword()) {
    return {success: false, error: "currentPasswordIncorrect"};
  }

  if (input.newPassword.length < 8) {
    return {success: false, error: "passwordTooShort"};
  }

  if (input.newPassword !== input.confirmPassword) {
    return {success: false, error: "passwordMismatch"};
  }

  if (input.currentPassword === input.newPassword) {
    return {success: false, error: "passwordUnchanged"};
  }

  updateTeacherWorkspacePassword(input.newPassword);

  appendTeacherWorkspaceProfileActivity({
    kind: "password_changed",
    detail: "Security update"
  });

  return {success: true};
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
  assignedToMode?: TeacherAssignmentAssignModeKey;
};

export function getTeacherAssignmentPrefillContext(input: {
  studentId?: string | null;
  recommendationSkill?: string | null;
  assignedToMode?: string | null;
  title?: string | null;
  instructions?: string | null;
}) {
  const recommendationSkill = input.recommendationSkill as TeacherWeakSkillKey | undefined;
  const normalizedAssignMode =
    input.assignedToMode === "all"
    || input.assignedToMode === "selected"
    || input.assignedToMode === "one"
    || input.assignedToMode === "at_risk"
    || input.assignedToMode === "improving"
      ? input.assignedToMode
      : undefined;
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
    prefilledInstructions,
    assignedToMode: student?.id ? "one" : normalizedAssignMode
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

const weakAreasQuestionTypes: TeacherWeakSkillKey[] = [
  "matchingHeadings",
  "trueFalseNotGiven",
  "sentenceCompletion",
  "multipleChoice"
];

function weakSkillToWeakAreasModule(skill: TeacherWeakSkillKey): TeacherModuleKey {
  const moduleKey = weakSkillToModule(skill);
  return moduleKey === "general" ? "reading" : moduleKey;
}

function deriveFallbackWeakAreaScore(skill: TeacherWeakSkillKey, student: TeacherStudentListItem) {
  const moduleKey = weakSkillToWeakAreasModule(skill);
  const moduleBand = student.moduleBands[moduleKey];
  const base = clamp(Math.round(moduleBand * 13), 35, 88);

  if (student.weakestSkill === skill) {
    return clamp(base - 14, 33, 86);
  }

  if (weakSkillToWeakAreasModule(student.weakestSkill) === moduleKey) {
    return clamp(base - 8, 35, 88);
  }

  return clamp(base + 5, 36, 90);
}

function buildWeakAreasInterventionCohort(limit: number) {
  const ranked = TEACHER_STUDENTS.map(toListItem)
    .map((student) => {
      const bandGap = Math.max(0, student.targetBand - student.estimatedBand);
      const atRiskBoost = student.status === "at_risk" ? 3.2 : student.status === "inactive" ? 1.2 : 0;
      const progressBoost = student.progressState === "needs_help" ? 2.8 : student.progressState === "stable" ? 1 : 0;
      const lowBandBoost = Math.max(0, 6.6 - student.estimatedBand) * 1.45;
      const pendingBoost = clamp(student.pendingCount / 6, 0, 2.2);

      return {
        student,
        riskScore: bandGap * 1.25 + atRiskBoost + progressBoost + lowBandBoost + pendingBoost
      };
    })
    .sort((left, right) => {
      if (right.riskScore !== left.riskScore) {
        return right.riskScore - left.riskScore;
      }

      if (left.student.estimatedBand !== right.student.estimatedBand) {
        return left.student.estimatedBand - right.student.estimatedBand;
      }

      return left.student.lastActiveMinutesAgo - right.student.lastActiveMinutesAgo;
    });

  return ranked.slice(0, Math.max(1, Math.min(limit, ranked.length))).map((item) => item.student);
}

function buildWeakAreasQuestionTypeAccuracy(students: TeacherStudentListItem[]): TeacherQuestionTypeAccuracy[] {
  return weakAreasQuestionTypes.map((label) => {
    const values = students.map((student) => {
      const metric = getStudentProfileMeta(student.id).weakAreas.find((item) => item.label === label);
      return metric?.score ?? deriveFallbackWeakAreaScore(label, student);
    });

    const percentage = Math.round(values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length));

    return {
      id: `teacher-weak-accuracy-${label}`,
      label,
      percentage,
      tone: toneFromPercentage(percentage)
    } satisfies TeacherQuestionTypeAccuracy;
  });
}

function buildWeakAreasModuleDifficulty(students: TeacherStudentListItem[]): TeacherModuleDifficultyValue[] {
  const modules: TeacherModuleKey[] = ["reading", "listening", "writing", "speaking"];

  return modules.map((module) => {
    const avgCurrent = students.reduce((sum, student) => sum + student.moduleBands[module], 0) / Math.max(1, students.length);
    const avgTarget = students.reduce((sum, student) => sum + student.targetModuleBands[module], 0) / Math.max(1, students.length);
    const targetGap = Math.max(0, avgTarget - avgCurrent);
    const weakModuleShare =
      students.filter((student) => weakSkillToWeakAreasModule(student.weakestSkill) === module).length
      / Math.max(1, students.length);
    const value = Math.round(clamp(18 + targetGap * 14 + weakModuleShare * 32 + (6.8 - avgCurrent) * 4, 18, 92));

    return {module, value} satisfies TeacherModuleDifficultyValue;
  });
}

function buildWeakAreasStudentRows(students: TeacherStudentListItem[]): TeacherWeakAreasStudentRow[] {
  return students.map((student) => ({
    id: student.id,
    name: student.name,
    avatarFallback: student.avatarFallback,
    weakestModule: weakSkillToWeakAreasModule(student.weakestSkill),
    weakestType: student.weakestSkill,
    currentBand: student.estimatedBand,
    lastActivity: student.lastActivity
  }));
}

function buildCommonMistakeInsights(
  students: TeacherStudentListItem[],
  questionTypeAccuracy: TeacherQuestionTypeAccuracy[]
): TeacherCommonMistakeInsight[] {
  const cohortSize = Math.max(1, students.length);
  const tfngAccuracy = questionTypeAccuracy.find((item) => item.label === "trueFalseNotGiven")?.percentage ?? 55;
  const timeManagementCount = students.filter((student) => student.weakestSkill === "timeManagement").length;
  const writingRiskCount = students.filter((student) => student.weakestSkill === "writingTask2").length;

  const falseVsNotGivenShare = Math.round(clamp(100 - tfngAccuracy + 33, 54, 88));
  const section12Minutes = Math.round(clamp(24 + (timeManagementCount / cohortSize) * 14, 24, 32));
  const section3Minutes = Math.max(8, 40 - section12Minutes);
  const cohesionShare = Math.round(clamp(48 + (writingRiskCount / cohortSize) * 42, 40, 84));

  return [
    {id: "falseVsNotGiven", severity: "high", metricPrimary: falseVsNotGivenShare},
    {id: "timeManagementSection3", severity: "moderate", metricPrimary: section12Minutes, metricSecondary: section3Minutes},
    {id: "task2Cohesion", severity: "watch", metricPrimary: cohesionShare}
  ];
}

function buildPracticeRecommendations(
  students: TeacherStudentListItem[],
  questionTypeAccuracy: TeacherQuestionTypeAccuracy[]
): TeacherPracticeRecommendation[] {
  const sorted = [...questionTypeAccuracy].sort((left, right) => left.percentage - right.percentage).slice(0, 3);
  const cohortSize = Math.max(1, students.length);

  return sorted.map((item, index) => {
    const relatedStudents = students.filter((student) => {
      if (student.weakestSkill === item.label) {
        return true;
      }

      return weakSkillToWeakAreasModule(student.weakestSkill) === weakSkillToWeakAreasModule(item.label);
    }).length;

    return {
      id: `teacher-weak-recommendation-${item.label}`,
      targetSkill: item.label,
      assignMode: index === 1 ? "weak_students" : "class",
      delivery: index === 0 ? "question_set" : index === 1 ? "video_quiz" : "timed_drill",
      questionCount: Math.round(clamp(8 + (100 - item.percentage) / 3, 8, 22)),
      targetStudents: Math.max(3, Math.min(cohortSize, relatedStudents))
    } satisfies TeacherPracticeRecommendation;
  });
}

export function getTeacherWeakAreasPageData(limit = 12): TeacherWeakAreasPageData {
  const cohort = buildWeakAreasInterventionCohort(limit);
  const questionTypeAccuracy = buildWeakAreasQuestionTypeAccuracy(cohort);
  const moduleDifficulty = buildWeakAreasModuleDifficulty(cohort);
  const studentsNeedingImprovement = buildWeakAreasStudentRows(cohort);
  const commonMistakes = buildCommonMistakeInsights(cohort, questionTypeAccuracy);
  const recommendations = buildPracticeRecommendations(cohort, questionTypeAccuracy);
  const lowestAverageScore = roundBand(
    Math.min(
      ...(["reading", "listening", "writing", "speaking"] as const).map(
        (module) => cohort.reduce((sum, student) => sum + student.moduleBands[module], 0) / Math.max(1, cohort.length)
      )
    )
  );

  const mostDifficultModule = [...moduleDifficulty].sort((left, right) => right.value - left.value)[0]?.module ?? "reading";
  const hardestQuestionType = [...questionTypeAccuracy].sort((left, right) => left.percentage - right.percentage)[0]?.label ?? "matchingHeadings";

  return {
    summary: {
      mostDifficultModule,
      hardestQuestionType,
      lowestAverageScore,
      studentsNeedingHelpCount: cohort.length
    },
    questionTypeAccuracy,
    moduleDifficulty,
    studentsNeedingImprovement,
    totalStudentsNeedingHelp: cohort.length,
    commonMistakes,
    recommendations
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
