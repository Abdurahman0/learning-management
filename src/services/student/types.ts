export type StudentListQuery = {
  page?: number;
  pageSize?: number;
  search?: string;
  ordering?: string;
  premium?: boolean;
  difficulty?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | string;
  module?: "READING" | "LISTENING" | "WRITING" | "SPEAKING" | string;
  reason?: "wrong" | "saved" | "weak_area" | "flagged" | string;
};

export type StudentPaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type StudentFieldErrors = Record<string, string[]>;

export class StudentApiError extends Error {
  status: number;
  fieldErrors: StudentFieldErrors;
  raw: unknown;

  constructor(message: string, status = 500, fieldErrors: StudentFieldErrors = {}, raw: unknown = null) {
    super(message);
    this.name = "StudentApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
    this.raw = raw;
  }
}

export type StudentReadingPassagePreview = {
  id: string;
  passage_number: string;
  title: string;
  max_questions: number;
  difficulty_display?: string | null;
};

export type StudentListeningPartPreview = {
  id: string;
  part_number: string;
  title: string;
  max_questions: number;
  difficulty_display?: string | null;
};

export type StudentUserAttemptStatus = Record<string, unknown> & {
  status?: string;
  state?: string;
  attempt_state?: string;
  in_progress?: boolean;
  is_in_progress?: boolean;
  can_resume?: boolean;
  can_retake?: boolean;
  can_review?: boolean;
  attempt_id?: string | number;
  current_attempt_id?: string | number;
  active_attempt_id?: string | number;
  last_attempt_id?: string | number;
};

export type StudentTestRecord = {
  id: string;
  title: string;
  description: string;
  test_type: string;
  type_display: string;
  difficulty_level: string;
  difficulty_display: string;
  total_questions: number;
  time_limit_seconds: number | null;
  is_premium: boolean;
  reading_passages: StudentReadingPassagePreview[];
  listening_parts: StudentListeningPartPreview[];
  user_attempt_status?: StudentUserAttemptStatus | null;
};

export type StudentAttemptMode = "REAL" | "PRACTICE";

export type StudentAttemptQuestion = {
  id: string;
  question_id?: string | null;
  attempt_question_id?: string | null;
  candidate_question_ids?: string[];
  question_number: number;
  question_text: string | null;
  options_json: unknown;
  question_type: string;
  question_type_display?: string | null;
  student_answer: unknown;
  is_flagged: boolean;
};

export type StudentAttemptQuestionGroup = {
  id: string;
  question_type: string;
  question_type_display?: string | null;
  group_order: number;
  instructions: string;
  question_number_start: number;
  question_number_end: number;
  word_limit: number | null;
  number_allowed: boolean | null;
  group_content_json: unknown;
  questions: StudentAttemptQuestion[];
};

export type StudentAttemptReadingPassage = {
  id: string;
  passage_number: string;
  title: string;
  passage_text: string;
  max_questions: number;
  answered_count: number;
  question_groups: StudentAttemptQuestionGroup[];
};

export type StudentAttemptListeningPart = {
  id: string;
  part_number: string;
  title: string;
  transcript_text: string;
  audio_file_url?: string | null;
  max_questions: number;
  answered_count: number;
  question_groups: StudentAttemptQuestionGroup[];
};

export type StudentAttemptDetail = {
  id: string;
  practice_test: string;
  practice_test_title: string;
  test_type: string;
  mode: StudentAttemptMode | string;
  status: string;
  started_at: string | null;
  completed_at?: string | null;
  time_used_seconds: number;
  time_limit_seconds: number | null;
  total_questions: number;
  answered_count: number;
  reading_passages: StudentAttemptReadingPassage[];
  listening_parts: StudentAttemptListeningPart[];
  score?: number | null;
  band_score?: string | null;
  correct_count?: number | null;
  incorrect_count?: number | null;
  unanswered_count?: number | null;
  question_type_stats_json?: Record<string, unknown> | null;
  passage_stats_json?: Record<string, unknown> | null;
};

export type StudentAttemptAnswerPayloadItem = {
  question_id: string;
  answer: unknown | null;
  is_flagged?: boolean;
  time_spent_seconds?: number;
};

export type StudentAttemptSavePayload = {
  time_used_seconds?: number;
  answers: StudentAttemptAnswerPayloadItem[];
};

export type StudentAttemptCreatePayload = {
  practice_test: string;
  mode: StudentAttemptMode;
};

export type StudentAttemptSaveResponse = {
  answered: number;
  total: number;
  time_used_seconds: number;
};

export type StudentAttemptReviewQuestion = {
  id: string;
  question_number: number;
  question_text: string | null;
  question_type: string;
  question_type_display?: string | null;
  options_json: unknown;
  correct_answer_json: unknown;
  student_answer: unknown;
  is_correct: boolean;
  is_skipped: boolean;
  is_flagged: boolean;
  explanation?: string | null;
  answer_evidence_json?: unknown;
};

export type StudentAttemptReviewGroup = {
  id: string;
  question_type: string;
  question_type_display?: string | null;
  instructions?: string | null;
  question_number_start?: number | null;
  question_number_end?: number | null;
  questions: StudentAttemptReviewQuestion[];
};

export type StudentAttemptReviewPassage = {
  id: string;
  passage_number: string;
  title: string;
  passage_text: string;
  max_questions: number;
  correct_count?: number | null;
  total_count?: number | null;
  performance_label?: string;
  question_groups: StudentAttemptReviewGroup[];
};

export type StudentAttemptReviewPart = {
  id: string;
  part_number: string;
  title: string;
  transcript_text: string;
  audio_file_url?: string | null;
  max_questions: number;
  correct_count?: number | null;
  total_count?: number | null;
  performance_label?: string;
  question_groups: StudentAttemptReviewGroup[];
};

export type StudentAttemptReviewResponse = {
  attempt_id: string;
  test_title: string;
  test_type: string;
  mode?: StudentAttemptMode | string | null;
  status?: string | null;
  score: number | null;
  band_score: string | null;
  total_questions?: number | null;
  correct_count?: number | null;
  incorrect_count?: number | null;
  unanswered_count?: number | null;
  time_used_seconds: number | null;
  question_type_stats?: Record<string, unknown> | null;
  question_type_stats_json?: Record<string, unknown> | null;
  passage_stats_json?: Record<string, unknown> | null;
  passages?: StudentAttemptReviewPassage[];
  parts?: StudentAttemptReviewPart[];
  raw: Record<string, unknown> | null;
};

export type StudentDashboardScorePoint = {
  id: string;
  label: string;
  band: number;
};

export type StudentDashboardSkillPoint = {
  key: "listening" | "reading" | "writing" | "speaking";
  band: number;
};

export type StudentDashboardWeakArea = {
  id: string;
  title: string;
  module: "reading" | "listening" | "writing" | "speaking";
  questionType?: string;
  questionTypeLabel?: string;
  accuracy: string;
  actionLabel: string;
};

export type StudentDashboardRecentTest = {
  id: string;
  testName: string;
  date: string;
  module: "reading" | "listening" | "writing" | "speaking";
  score: string;
};

export type StudentDashboardAchievement = {
  id: string;
  title: string;
  subtitle: string;
  earned: boolean;
};

export type StudentDashboardContinueTest = {
  id: string;
  attemptId?: string;
  module: string;
  title: string;
  level: string;
  lastActiveLabel: string;
  progressQuestions: number;
  totalQuestions: number;
  progressPercent?: number;
  href?: string;
};

export type StudentDashboardResponse = {
  summary: {
    name: string;
    currentBand: number;
    goalBand: number;
    testsTaken: number;
    readingAccuracy: number;
    listeningAccuracy: number;
    streakDays: number;
    streakIncreasedToday: boolean;
    bandsAway: number;
  };
  continueTest?: StudentDashboardContinueTest | null;
  scoreProgress: StudentDashboardScorePoint[];
  skillsSnapshot: StudentDashboardSkillPoint[];
  overallJourneyPct: number | null;
  weakAreas: StudentDashboardWeakArea[];
  aiRecommendation?: {
    tag: string;
    message: string;
  } | null;
  recentHistory: StudentDashboardRecentTest[];
  achievements: StudentDashboardAchievement[];
  raw: Record<string, unknown> | null;
};

export type StudentProfileResponse = {
  id: string;
  full_name: string;
  email: string;
  target_band: number | null;
  study_streak?: number;
  last_activity_date?: string | null;
  updated_at?: string | null;
  is_active?: boolean;
  is_premium?: boolean;
  date_joined?: string | null;
  raw: Record<string, unknown> | null;
};

export type StudentProfileUpdatePayload = {
  target_band?: number | string;
};

export type StudentAnalyticsBandPoint = {
  id: string;
  label: string;
  band: number;
};

export type StudentAnalyticsAccuracyPoint = {
  id: string;
  label: string;
  percentage: number;
};

export type StudentAnalyticsWeeklyPoint = {
  id: string;
  label: string;
  sessions: number;
};

export type StudentAnalyticsModulePerformance = {
  module: "reading" | "listening" | "writing" | "speaking";
  percentage: number;
};

export type StudentAnalyticsInsight = {
  id: string;
  tone: "positive" | "neutral" | "warning";
  title?: string;
  description?: string;
};

export type StudentAnalyticsPracticeActivity = {
  id: string;
  dateLabel: string;
  module: "reading" | "listening" | "writing" | "speaking";
  questionType: string;
  accuracy: number;
  durationMinutes: number;
  action?: "navigate" | "toast";
  href?: string;
};

export type StudentAnalyticsResponse = {
  summary: {
    currentBandEstimate: number;
    currentBandDelta: number;
    targetBand: number;
    practiceSessions: number;
    averageAccuracy: number;
    accuracyDelta: number;
  };
  bandProgression: StudentAnalyticsBandPoint[];
  accuracyImprovement: StudentAnalyticsAccuracyPoint[];
  weeklyStudyActivity: StudentAnalyticsWeeklyPoint[];
  modulePerformance: StudentAnalyticsModulePerformance[];
  learningInsights: StudentAnalyticsInsight[];
  recentPracticeActivity: StudentAnalyticsPracticeActivity[];
  raw: Record<string, unknown> | null;
};

export type StudentReviewCenterReason = "wrong" | "saved" | "flagged" | "weakArea";
export type StudentReviewCenterDifficulty = "easy" | "medium" | "hard";
export type StudentReviewCenterModule = "reading" | "listening" | "writing" | "speaking";

export type StudentReviewCenterItem = {
  id: string;
  questionId: string;
  attemptId: string;
  questionNumber: number;
  questionText: string;
  module: StudentReviewCenterModule;
  questionType: string;
  questionTypeDisplay?: string;
  question: string;
  snippet: string;
  context: string;
  sourceLabel: string;
  difficulty: StudentReviewCenterDifficulty;
  correctAnswer?: string;
  explanation?: string;
  testName?: string;
  studentAnswer?: unknown;
  isWrong: boolean;
  isSaved: boolean;
  isWeakArea: boolean;
  isFlagged: boolean;
  reasons?: string[];
  createdAt?: string | null;
  reviewReasons: StudentReviewCenterReason[];
  savedAgoKey: string;
  linkedPracticePath: string;
  raw: Record<string, unknown> | null;
};

export type StudentReviewCenterSummary = {
  questionsToReview: number;
  mostDifficultType: string;
  weakestModule: StudentReviewCenterModule;
  accuracyTrend: number;
};

export type StudentReviewCenterMistakeByType = {
  id: string;
  type: string;
  count: number;
};

export type StudentReviewCenterMistakeByModule = {
  id: string;
  module: StudentReviewCenterModule;
  count: number;
  share: number;
};

export type StudentReviewCenterResponse = {
  summary: StudentReviewCenterSummary | null;
  mistakesByType: StudentReviewCenterMistakeByType[];
  mistakesByModule: StudentReviewCenterMistakeByModule[];
  items: StudentReviewCenterItem[];
  count: number;
  next: string | null;
  previous: string | null;
  raw: Record<string, unknown> | null;
};

export type StudentReviewCenterCreatePayload = {
  question_id: string;
  attempt_id: string;
  is_wrong?: boolean;
  is_saved?: boolean;
  is_weak_area?: boolean;
  is_flagged?: boolean;
};

export type StudentReviewCenterUpdatePayload = {
  is_wrong?: boolean;
  is_saved?: boolean;
  is_weak_area?: boolean;
  is_flagged?: boolean;
};
