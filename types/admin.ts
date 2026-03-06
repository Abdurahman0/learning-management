export type AdminLocale = "en" | "uz";
export type AdminRole = "student" | "admin" | "tutor";
export type AdminStatus = "verified" | "active" | "suspended";
export type PlanId = "guest" | "free" | "pro" | "premium";
export type BillingPeriod = "forever" | "month";

export type TestModule = "reading" | "listening";
export type TestStatus = "published" | "draft";
export type TestDifficulty = "beginner" | "intermediate" | "advanced";

export type QuestionType =
  | "tfng"
  | "multiple_choice"
  | "matching_headings"
  | "sentence_completion"
  | "summary_completion"
  | "table_completion"
  | "diagram_labeling"
  | "form_completion"
  | "note_completion"
  | "matching_information"
  | "short_answer";

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

export type AnalyticsSnapshotEntity = {
  scoreTrend: TrendPointEntity[];
  completedPerDay: DailyCompletionEntity[];
};
