export type AdminLocale = "en" | "uz";
export type AdminRole = "student" | "admin" | "tutor";
export type AdminStatus = "verified" | "active" | "suspended";
export type PlanId = "guest" | "free" | "pro" | "premium";
export type BillingPeriod = "forever" | "month";

export type TestModule = "reading" | "listening";
export type TestStatus = "published" | "draft";
export type TestDifficulty = "beginner" | "intermediate" | "advanced";
export type ContentModule = TestModule;
export type PassageDifficulty = "easy" | "medium" | "hard";
export type PassageSource = "cambridge" | "practice" | "custom";

export type QuestionType =
  | "tfng"
  | "yes_no_not_given"
  | "multiple_choice"
  | "selecting_from_a_list"
  | "matching_headings"
  | "matching_features"
  | "sentence_completion"
  | "summary_completion"
  | "table_completion"
  | "flow_chart"
  | "map"
  | "diagram_labeling"
  | "form_completion"
  | "note_completion"
  | "matching_information"
  | "short_answer";

export type VariantGroupTemplate = {
  id: string;
  type: QuestionType;
  count: number;
};

export type PassageAssetEntity = {
  id: string;
  title: string;
  module: ContentModule;
  wordCount?: number;
  durationMinutes?: number;
  difficulty: PassageDifficulty;
  topic: string;
  source: PassageSource;
  previewText: string;
  fullText: string[];
  estimatedTimeLabel?: string;
  createdAt: string;
  linkedStructureIds: string[];
  linkedTestIds: string[];
};

export type QuestionVariantStatus = "draft" | "published" | "used";

export type QuestionVariantSetEntity = {
  id: string;
  passageId: string;
  name: string;
  status: QuestionVariantStatus;
  maxQuestionTypes: number;
  groups: VariantGroupTemplate[];
  questionTypesSummary: string;
  questionTypeKeys: QuestionType[];
  questionSignature: string;
  usedInTestIds: string[];
  createdAt: string;
};

export type BuilderQuestionBase = {
  id: string;
  number: number;
  type: QuestionType;
  prompt: string;
  explanation?: string;
  evidence?: string;
  evidenceText?: string;
};

export type TFNGAnswer = "TRUE" | "FALSE" | "NOT GIVEN" | "";
export type YesNoNotGivenAnswer = "YES" | "NO" | "NOT GIVEN" | "";
export type MultipleChoiceAnswer = "A" | "B" | "C" | "D" | "";

export type TFNGBuilderQuestion = BuilderQuestionBase & {
  type: "tfng";
  correctAnswer: TFNGAnswer;
};

export type YesNoNotGivenBuilderQuestion = BuilderQuestionBase & {
  type: "yes_no_not_given";
  correctAnswer: YesNoNotGivenAnswer;
};

export type MultipleChoiceBuilderQuestion = BuilderQuestionBase & {
  type: "multiple_choice";
  options: string[];
  correctAnswer: MultipleChoiceAnswer;
};

export type MatchingHeadingsBuilderQuestion = BuilderQuestionBase & {
  type: "matching_headings";
  headings: string[];
  correctAnswer: string;
};

export type MatchingInformationBuilderQuestion = BuilderQuestionBase & {
  type: "matching_information" | "matching_features" | "selecting_from_a_list" | "map";
  items: string[];
  choices: string[];
  correctAnswer: Record<string, string>;
};

export type TextAnswerBuilderQuestion = BuilderQuestionBase & {
  type:
    | "sentence_completion"
    | "summary_completion"
    | "table_completion"
    | "flow_chart"
    | "diagram_labeling"
    | "form_completion"
    | "note_completion"
    | "short_answer";
  correctAnswer: string | string[];
  acceptableAnswers?: string[];
};

export type BuilderQuestion =
  | TFNGBuilderQuestion
  | YesNoNotGivenBuilderQuestion
  | MultipleChoiceBuilderQuestion
  | MatchingHeadingsBuilderQuestion
  | MatchingInformationBuilderQuestion
  | TextAnswerBuilderQuestion;

export type BuilderQuestionGroup = {
  id: string;
  title: string;
  type: QuestionType;
  from: number;
  to: number;
  questions: BuilderQuestion[];
  variantSetId?: string;
  instructions?: string;
  groupContentJson?: unknown;
};

export type BuilderPassageSlot = {
  id: string;
  index: 1 | 2 | 3 | 4;
  module: ContentModule;
  linkedPassageId?: string;
  linkedVariantSetId?: string;
  title: string;
  questionRangeStart: number;
  questionRangeEnd: number;
  content: string[];
  audioLabel?: string;
  questionGroups: BuilderQuestionGroup[];
};

export type TestStructureKind = "passage" | "section";

export type TestStructureEntity = {
  id: string;
  kind: TestStructureKind;
  index: number;
  title: string;
  questionRangeLabel: string;
  shortDescription: string;
  content: string[];
  audioLabel?: string;
  questionCount: number;
};

export type TestEntity = {
  id: string;
  name: string;
  module: TestModule;
  book: string;
  questions: number;
  difficulty: TestDifficulty;
  status: TestStatus;
  createdAt: string;
  structures: TestStructureEntity[];
};

export type PlanFeatureEntity = {
  id: string;
  label: string;
  included: boolean;
};

export type PlanEntity = {
  id: PlanId;
  name: string;
  tagline: string;
  price: number;
  billingPeriod: BillingPeriod;
  highlight?: boolean;
  badge?: string;
  features: PlanFeatureEntity[];
};

export type UserModuleStats = {
  reading: number;
  listening: number;
  writing: number;
  speaking: number;
};

export type WeakAreaSeverity = "critical" | "improving" | "stable";

export type UserWeakArea = {
  id: string;
  label: string;
  severity: WeakAreaSeverity;
};

export type UserPaymentStatus = "paid" | "pending" | "failed";

export type UserPaymentEntity = {
  id: string;
  title: string;
  amount: string;
  status: UserPaymentStatus;
  date: string;
};

export type BandProgressPoint = {
  label: string;
  value: number;
};

export type AdminUserEntity = {
  id: string;
  name: string;
  email: string;
  avatarFallback: string;
  avatarUrl?: string;
  planId: PlanId;
  role: AdminRole;
  status: AdminStatus;
  locale: AdminLocale;
  joinedAt: string;
  isActiveToday: boolean;
  overallBand: number;
  targetBand: number;
  moduleStats: UserModuleStats;
  weakAreas: UserWeakArea[];
  bandProgress: BandProgressPoint[];
  payments: UserPaymentEntity[];
};

export type UserTestAttemptEntity = {
  id: string;
  userId: string;
  testId: string;
  module: TestModule;
  scoreBand: number;
  date: string;
};

export type SubscriptionActionStatus = "success" | "pending" | "closed";

export type SubscriptionActionEntity = {
  id: string;
  userId: string;
  fromPlanId: PlanId;
  toPlanId: PlanId | "cancelled";
  date: string;
  status: SubscriptionActionStatus;
};

export type AchievementTone = "gold" | "slate" | "orange" | "purple";
export type AchievementIcon = "trophy" | "award" | "flame" | "sparkles";

export type AchievementEntity = {
  id: string;
  title: string;
  description: string;
  tone: AchievementTone;
  badgeIcon: AchievementIcon;
};

export type UserAchievementEntity = {
  id: string;
  userId: string;
  achievementId: string;
  dateEarned: string;
  currentStreak: string;
};

export type BadgeLibraryIcon = "star" | "rocket" | "pen" | "mic" | "headphones" | "plus";

export type BadgeLibraryEntity = {
  id: string;
  label: string;
  icon: BadgeLibraryIcon;
};

export type GamificationSettingsEntity = {
  streakTracking: boolean;
  badgeNotifications: boolean;
  publicLeaderboard: boolean;
};

export type AnalyticsRangeKey = "last7Days" | "last30Days" | "last3Months";

export type TrendPointEntity = {
  label: string;
  reading: number;
  listening: number;
};

export type DailyCompletionEntity = {
  day: string;
  value: number;
};

export type MistakeSeverity = "critical" | "warning" | "good";

export type MistakeQuestionTypeEntity = {
  id: string;
  label: string;
  accuracy: number;
  severity: MistakeSeverity;
};

export type MistakeDistributionEntity = {
  module: "reading" | "listening" | "writing" | "speaking";
  percentage: number;
  totalErrors: number;
  color: string;
};

export type MissedQuestionEntity = {
  id: string;
  testId: string;
  preview: string;
  type: string;
  accuracyRate: number;
  attempts: number;
  topics: string[];
};

export type PassageDifficultyEntity = {
  id: string;
  testId: string;
  title: string;
  accuracy: number;
  rank: number;
};

export type MistakeTopicEntity = {
  id: string;
  label: string;
  count: number;
};

export type AiInsightEntity = {
  id: string;
  title: string;
  description: string;
};

export type RecommendationSettingsEntity = {
  enabled: boolean;
  threshold: number;
};

export type MistakesSnapshotEntity = {
  questionTypeAccuracy: MistakeQuestionTypeEntity[];
  distribution: MistakeDistributionEntity[];
  totalErrorsLabel: string;
  mostMissedQuestions: MissedQuestionEntity[];
  passageDifficulty: PassageDifficultyEntity[];
  commonTopics: MistakeTopicEntity[];
  insights: AiInsightEntity[];
};

export type ReportModule = "reading" | "listening" | "writing" | "speaking";
export type ReportStatus = "open" | "in_review" | "resolved" | "rejected";
export type ReportSeverity = "low" | "medium" | "urgent";
export type ReportType = "content_error" | "answer_key" | "audio_issue" | "image_missing" | "ui_issue";

export type ReportQuestionOptionEntity = {
  id: string;
  label: string;
  text: string;
};

export type AdminReportEntity = {
  id: string;
  code: string;
  userId: string;
  testId: string;
  module: ReportModule;
  reportType: ReportType;
  status: ReportStatus;
  severity: ReportSeverity;
  questionPreview: string;
  questionNumberLabel: string;
  userMessage: string;
  createdAt: string;
  selectedAnswer?: string;
  correctAnswer?: string;
  assignedToUserId?: string;
  questionContentTitle?: string;
  questionOptions?: ReportQuestionOptionEntity[];
  passageId?: string;
  passageHighlight?: string;
};

export type ReportHistoryActionType = "created" | "resolved" | "reassigned" | "rejected" | "commented";

export type ReportHistoryEntity = {
  id: string;
  reportId?: string;
  actionType: ReportHistoryActionType;
  actorUserId?: string;
  actorLabel?: string;
  description: string;
  createdAt: string;
};

export type AnalyticsSnapshotEntity = {
  scoreTrend: TrendPointEntity[];
  completedPerDay: DailyCompletionEntity[];
};
