import {ACHIEVEMENT_ENTITIES, ACHIEVEMENT_TRENDS, BADGE_LIBRARY_ENTITIES, GAMIFICATION_SETTINGS_ENTITY, USER_ACHIEVEMENT_ENTITIES} from "./achievements";
import {
  DAILY_COMPLETION_BY_RANGE,
  HARDEST_QUESTIONS_BY_RANGE,
  PASSAGE_PERFORMANCE_BY_RANGE,
  QUESTION_TYPE_ACCURACY_BY_RANGE,
  SCORE_TREND_BY_RANGE,
  SKILL_DISTRIBUTION_BY_RANGE,
  USER_TEST_ATTEMPT_ENTITIES
} from "./analytics";
import {
  MAX_VARIANT_QUESTION_TYPES,
  PASSAGE_ASSET_ENTITIES,
  buildVariantSummaryFromGroups,
  getQuestionVariantSetEntities
} from "./content-bank";
import {MISTAKES_BY_RANGE, DEFAULT_RECOMMENDATION_SETTINGS_ENTITY} from "./mistakes";
import {ADMIN_NAV_ITEMS, ADMIN_PROFILE, type AdminNavItem} from "./profile";
import {REPORT_ENTITIES, REPORT_HISTORY_ENTITIES} from "./reports";
import {GLOBAL_PLAN_SETTINGS_ENTITY, PLAN_ENTITIES, SUBSCRIPTION_ACTION_ENTITIES} from "./subscriptions";
import {TEST_ENTITIES, getTestById} from "./tests";
import {USER_ENTITIES, getUserById} from "./users";
import type {
  AdminLocale,
  AdminReportEntity,
  AdminStatus,
  AnalyticsRangeKey,
  BuilderQuestion,
  BuilderQuestionGroup,
  ContentModule,
  PlanId,
  ReportHistoryActionType,
  ReportModule,
  ReportSeverity,
  ReportType,
  QuestionType,
  QuestionVariantSetEntity,
  TestDifficulty,
  TestModule,
  TestStatus,
  VariantGroupTemplate
} from "@/types/admin";

export type DashboardMonthKey = "jan" | "feb" | "mar" | "apr" | "may" | "jun" | "jul";
export type ActivityStatus = "verified" | "active" | "pendingReview";
export type ActivityAvatarTone = "blue" | "emerald" | "violet" | "amber";

export type DashboardSummaryMetric = {
  key: "totalUsers" | "testsCompleted" | "activeUsers" | "premiumSubscribers";
  icon: "users" | "clipboardCheck" | "activity" | "crown";
  value: number;
  growthPct: number;
};

export type DashboardGrowthPoint = {
  month: DashboardMonthKey;
  users: number;
};

export type DashboardCompletionPoint = {
  month: DashboardMonthKey;
  academic: number;
};

export type DashboardRecentActivity = {
  id: string;
  userName: string;
  userInitials: string;
  avatarTone: ActivityAvatarTone;
  action: string;
  score: string;
  status: ActivityStatus;
};

export type TestsRow = {
  id: string;
  name: string;
  module: TestModule;
  book: string;
  questions: number;
  difficulty: TestDifficulty;
  status: TestStatus;
  createdAt: string;
  passages?: Array<{id: string; title: string; shortDescription: string; questionCount: number}>;
  sections?: Array<{id: string; title: string; shortDescription: string; questionCount: number}>;
};

export type AnalyticsSummaryStat = {
  id: "totalTestsTaken" | "avgReadingScore" | "avgListeningScore" | "activeStudents";
  value: string;
  change: string;
  icon: "tests" | "reading" | "listening" | "users";
};

export type AnalyticsDataset = {
  summary: AnalyticsSummaryStat[];
  scoreTrend: Array<{label: string; reading: number; listening: number}>;
  completedPerDay: Array<{day: string; value: number}>;
  questionTypeAccuracy: Array<{
    id: string;
    typeKey: "multipleChoice" | "tfng" | "matchingHeadings" | "diagramLabeling" | "summaryCompletion" | "tableCompletion";
    accuracy: number;
    color: string;
  }>;
  skillDistribution: {reading: number; listening: number; writing: number; speaking: number};
  hardestQuestions: Array<{id: string; preview: string; type: string; testName: string; accuracy: number; attempts: number}>;
  passagePerformance: Array<{id: string; title: string; avgScore: number; rank: number}>;
  insights: Array<{
    id: string;
    tone: "default" | "success" | "info";
    badgeKey: "optimize" | "strength" | "segment";
    titleKey: "risingDifficultyGap" | "vocabularyRetention" | "regionalPerformance";
    descriptionKey: "risingDifficultyGapDesc" | "vocabularyRetentionDesc" | "regionalPerformanceDesc";
  }>;
};

export type UsersPageUser = {
  id: string;
  name: string;
  email: string;
  avatarFallback: string;
  avatarUrl?: string;
  plan: "free" | "pro" | "premium";
  role: "student" | "admin" | "tutor";
  status: AdminStatus;
  locale: AdminLocale;
  overallBand: number;
  targetBand: number;
  joinedAt: string;
  isActiveToday: boolean;
  stats: {reading: number; listening: number; writing: number; speaking: number};
  weakAreas: Array<{id: string; label: string; severity: "critical" | "improving" | "stable"}>;
  bandProgress: Array<{label: string; value: number}>;
  history: Array<{id: string; testName: string; module: "reading" | "listening" | "writing" | "speaking"; score: string; date: string}>;
  payments: Array<{id: string; title: string; amount: string; status: "paid" | "pending" | "failed"; date: string}>;
};

export type UsersTableFilters = {
  query?: string;
  status?: "all" | AdminStatus;
  role?: "all" | "student" | "admin" | "tutor";
  plan?: "all" | "free" | "pro" | "premium";
  locale?: "all" | AdminLocale;
};

export type SubscriptionsPageData = {
  stats: Array<{
    id: "totalSubscribers" | "monthlyRevenue" | "freeUsers" | "conversionRate";
    labelKey: string;
    value: string;
    change: string;
    tone?: "positive" | "negative" | "neutral";
    icon: "users" | "wallet" | "userCheck" | "percent";
  }>;
  plans: Array<{
    id: PlanId;
    name: string;
    tagline: string;
    price: number;
    billingPeriod: "forever" | "month";
    highlight?: boolean;
    badge?: string;
    features: Array<{id: string; label: string; included: boolean}>;
  }>;
  settings: {
    guestTestLimit: number;
    aiRecommendationsAccess: boolean;
    premiumExplanations: boolean;
  };
  distribution: Array<{plan: "free" | "pro" | "premium"; percentage: number; users: number; color: string}>;
  recentActions: Array<{
    id: string;
    userName: string;
    email: string;
    avatarFallback: string;
    fromPlan: string;
    toPlan: string;
    date: string;
    status: "success" | "pending" | "closed";
  }>;
};

export type AchievementsPageData = {
  stats: Array<{id: "totalAchievements" | "earnedToday" | "mostEarnedBadge" | "activeStreakUsers"; value: string; icon: "total" | "earned" | "badge" | "streak"}>;
  activeAchievements: Array<{
    id: string;
    title: string;
    description: string;
    timesEarned: number;
    tone: "gold" | "slate" | "orange" | "purple";
    badgeIcon: "trophy" | "award" | "flame" | "sparkles";
  }>;
  recentProgress: Array<{id: string; userName: string; email: string; avatarFallback: string; achievement: string; dateEarned: string; currentStreak: string}>;
  settings: {
    streakTracking: boolean;
    badgeNotifications: boolean;
    publicLeaderboard: boolean;
  };
  trends: Record<"weekly" | "monthly", Array<{label: string; value: number}>>;
  badgeLibrary: Array<{id: string; label: string; icon: "star" | "rocket" | "pen" | "mic" | "headphones" | "plus"}>;
};

export type MistakesDataset = {
  summaryStats: Array<{
    id: "mostDifficultType" | "lowestAccuracyPassage" | "avgReadingAccuracy" | "avgListeningAccuracy";
    value: string;
    sublabel: string;
    tone?: "critical" | "warning" | "positive" | "neutral";
  }>;
  questionTypeAccuracy: Array<{id: string; label: string; accuracy: number; severity: "critical" | "warning" | "good"}>;
  distribution: Array<{module: "reading" | "listening" | "writing" | "speaking"; percentage: number; totalErrors: number; color: string}>;
  totalErrorsLabel: string;
  mostMissedQuestions: Array<{id: string; preview: string; testName: string; type: string; accuracyRate: number; attempts: number; topics: string[]}>;
  passageDifficulty: Array<{id: string; title: string; accuracy: number; rank: number}>;
  commonTopics: Array<{id: string; label: string; count: number}>;
  aiInsights: Array<{id: string; title: string; description: string}>;
};

export type AdminTestSummary = {
  id: string;
  name: string;
  module: "reading" | "listening";
};

export type ContentBankPassage = {
  id: string;
  title: string;
  module: "reading" | "listening";
  wordCount?: number;
  durationMinutes?: number;
  difficulty: "easy" | "medium" | "hard";
  topic: string;
  source: "cambridge" | "practice" | "custom";
  previewText: string;
  fullText: string[];
  estimatedTimeLabel?: string;
  createdAt: string;
  linkedStructureIds: string[];
  linkedTestIds: string[];
  usedInTestIds: string[];
  variantIds: string[];
  variantCount: number;
  usageAttempts: number;
  difficultyAccuracy?: number;
  averageBandScore?: number;
};

export type ContentBankVariantSet = {
  id: string;
  passageId: string;
  passageTitle: string;
  module: "reading" | "listening";
  name: string;
  status: "draft" | "published" | "used";
  maxQuestionTypes: number;
  groups: VariantGroupTemplate[];
  questionTypesSummary: string;
  questionTypeKeys: QuestionType[];
  questionSignature: string;
  usedInTestIds: string[];
  usedInTests: AdminTestSummary[];
  createdAt: string;
};

export type ContentBankMeta = {
  linkedTestsCount: number;
  linkedStructuresCount: number;
  activeLearnersCount: number;
  premiumPlansCount: number;
  achievementTracksCount: number;
  topMistakeTopics: string[];
};

export type ContentBankData = {
  passages: ContentBankPassage[];
  variants: ContentBankVariantSet[];
  tests: AdminTestSummary[];
  meta: ContentBankMeta;
};

export type ReportsPageReport = {
  id: string;
  code: string;
  module: ReportModule;
  reportType: ReportType;
  status: AdminReportEntity["status"];
  severity: ReportSeverity;
  questionPreview: string;
  questionNumberLabel: string;
  userMessage: string;
  createdAt: string;
  selectedAnswer?: string;
  correctAnswer?: string;
  questionContentTitle?: string;
  questionOptions?: AdminReportEntity["questionOptions"];
  passageHighlight?: string;
  passageTitle?: string;
  reporter: {
    id: string;
    name: string;
    avatarFallback: string;
  };
  test: {
    id: string;
    name: string;
  };
  assignedTo?: {
    id: string;
    name: string;
  };
};

export type MostReportedQuestionItem = {
  id: string;
  label: string;
  module: ReportModule;
  reportType: ReportType;
  reportCount: number;
};

export type ReportHistoryFeedItem = {
  id: string;
  reportId?: string;
  reportCode?: string;
  actionType: ReportHistoryActionType;
  actor: string;
  description: string;
  createdAt: string;
};

export type ReportsPageData = {
  reports: ReportsPageReport[];
  mostReportedQuestions: MostReportedQuestionItem[];
  resolutionHistory: ReportHistoryFeedItem[];
};

function toPlanTitle(planId: PlanId | "cancelled") {
  if (planId === "cancelled") return "Cancelled";
  const plan = PLAN_ENTITIES.find((item) => item.id === planId);
  return plan?.name ?? planId;
}

function toMonthKey(monthNumber: number): DashboardMonthKey {
  return (["jan", "feb", "mar", "apr", "may", "jun", "jul"] as const)[Math.max(0, Math.min(monthNumber - 1, 6))];
}

function avatarToneFromIndex(index: number): ActivityAvatarTone {
  return (["blue", "violet", "emerald", "amber"] as const)[index % 4];
}

function formatPercent(value: number, digits = 1) {
  return `${value.toFixed(digits)}%`;
}

export function getAdminNavItems(): AdminNavItem[] {
  return ADMIN_NAV_ITEMS;
}

export function getAdminProfile() {
  return ADMIN_PROFILE;
}

export function getDashboardStats(): DashboardSummaryMetric[] {
  const totalUsers = Math.round(USER_ENTITIES.length * 12543);
  const testsCompleted = Math.round(USER_TEST_ATTEMPT_ENTITIES.length * 3767.5);
  const activeUsers = Math.round(USER_ENTITIES.filter((user) => user.isActiveToday).length * 1834);
  const premiumSubscribers = USER_ENTITIES.filter((user) => user.planId === "premium").length * 1040;

  return [
    {key: "totalUsers", icon: "users", value: totalUsers, growthPct: 12.5},
    {key: "testsCompleted", icon: "clipboardCheck", value: testsCompleted, growthPct: 8.2},
    {key: "activeUsers", icon: "activity", value: activeUsers, growthPct: 5.1},
    {key: "premiumSubscribers", icon: "crown", value: premiumSubscribers, growthPct: 15.8}
  ];
}

export function getUserGrowthStats(): DashboardGrowthPoint[] {
  return [
    {month: "jan", users: 8200},
    {month: "feb", users: 9400},
    {month: "mar", users: 10800},
    {month: "apr", users: 10100},
    {month: "may", users: 9300},
    {month: "jun", users: 12200},
    {month: "jul", users: 13200}
  ];
}

export function getTestsCompletionStats(): DashboardCompletionPoint[] {
  const monthlyTotals = TEST_ENTITIES.slice(0, 6).map((test, index) => ({
    month: toMonthKey(index + 1),
    academic: 4200 + index * 620 + (test.status === "published" ? 900 : 250)
  }));
  return monthlyTotals;
}

export function getPlatformInsights() {
  const mistakes = MISTAKES_BY_RANGE.last30Days;
  const mostDifficult = [...mistakes.questionTypeAccuracy].sort((a, b) => a.accuracy - b.accuracy)[0];
  const readingAttempts = USER_TEST_ATTEMPT_ENTITIES.filter((item) => item.module === "reading");
  const avgReading = readingAttempts.reduce((sum, item) => sum + item.scoreBand, 0) / Math.max(readingAttempts.length, 1);

  return {
    mostDifficult: {
      topic: mostDifficult?.label ?? "Matching Headings",
      averageScore: `${Math.max(4.8, avgReading - 1.4).toFixed(1)}/9.0`
    },
    averageScore: {
      band: Number(avgReading.toFixed(1)),
      sampleSize: Math.max(1000, USER_TEST_ATTEMPT_ENTITIES.length * 80)
    }
  };
}

export function getRecentUserActivity(): DashboardRecentActivity[] {
  const latestAttempts = [...USER_TEST_ATTEMPT_ENTITIES]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 2)
    .map((attempt) => {
      const user = getUserById(attempt.userId);
      const test = getTestById(attempt.testId);
      return {
        id: `attempt-${attempt.id}`,
        userName: user?.name ?? "Unknown User",
        userInitials: user?.avatarFallback ?? "UU",
        avatarTone: avatarToneFromIndex(attempt.id.length),
        action: `Completed ${test?.name ?? "Test"}`,
        score: attempt.scoreBand.toFixed(1),
        status: user?.status === "verified" ? "verified" : "active"
      } satisfies DashboardRecentActivity;
    });

  const latestSubscription = SUBSCRIPTION_ACTION_ENTITIES.slice(0, 1).map((action) => {
    const user = getUserById(action.userId);
    return {
      id: `sub-${action.id}`,
      userName: user?.name ?? "Unknown User",
      userInitials: user?.avatarFallback ?? "UU",
      avatarTone: "violet",
      action: `Subscription ${toPlanTitle(action.fromPlanId)} -> ${toPlanTitle(action.toPlanId)}`,
      score: "-",
      status: action.status === "success" ? "active" : "pendingReview"
    } satisfies DashboardRecentActivity;
  });

  const latestAchievement = USER_ACHIEVEMENT_ENTITIES.slice(0, 1).map((item) => {
    const user = getUserById(item.userId);
    const achievement = ACHIEVEMENT_ENTITIES.find((ach) => ach.id === item.achievementId);
    return {
      id: `ach-${item.id}`,
      userName: user?.name ?? "Unknown User",
      userInitials: user?.avatarFallback ?? "UU",
      avatarTone: "amber",
      action: `Achieved "${achievement?.title ?? "Badge"}"`,
      score: "-",
      status: "verified"
    } satisfies DashboardRecentActivity;
  });

  return [...latestAttempts, ...latestSubscription, ...latestAchievement].slice(0, 4);
}

export function getTestsManagementRows(): TestsRow[] {
  return TEST_ENTITIES.map((test) => ({
    id: test.id,
    name: test.name,
    module: test.module,
    book: test.book,
    questions: test.questions,
    difficulty: test.difficulty,
    status: test.status,
    createdAt: test.createdAt,
    passages:
      test.module === "reading"
        ? test.structures.map((structure) => ({
            id: structure.id,
            title: structure.title,
            shortDescription: structure.shortDescription,
            questionCount: structure.questionCount
          }))
        : undefined,
    sections:
      test.module === "listening"
        ? test.structures.map((structure) => ({
            id: structure.id,
            title: structure.title,
            shortDescription: structure.shortDescription,
            questionCount: structure.questionCount
          }))
        : undefined
  }));
}

export function getUsersTableData(filters: UsersTableFilters = {}): UsersPageUser[] {
  const query = filters.query?.trim().toLowerCase() ?? "";
  const status = filters.status ?? "all";
  const role = filters.role ?? "all";
  const plan = filters.plan ?? "all";
  const locale = filters.locale ?? "all";

  const mappedUsers = USER_ENTITIES.map<UsersPageUser>((user) => {
    const history = USER_TEST_ATTEMPT_ENTITIES.filter((attempt) => attempt.userId === user.id)
      .sort((a, b) => b.date.localeCompare(a.date))
      .map((attempt, index) => ({
        id: `${user.id}-hist-${index + 1}`,
        testName: getTestById(attempt.testId)?.name ?? "Unknown Test",
        module: attempt.module,
        score: attempt.scoreBand.toFixed(1),
        date: attempt.date
      }));

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      avatarFallback: user.avatarFallback,
      avatarUrl: user.avatarUrl,
      plan: user.planId === "guest" ? "free" : user.planId,
      role: user.role,
      status: user.status,
      locale: user.locale,
      overallBand: user.overallBand,
      targetBand: user.targetBand,
      joinedAt: user.joinedAt,
      isActiveToday: user.isActiveToday,
      stats: user.moduleStats,
      weakAreas: user.weakAreas,
      bandProgress: user.bandProgress,
      history,
      payments: user.payments
    };
  });

  return mappedUsers.filter((user) => {
    if (status !== "all" && user.status !== status) return false;
    if (role !== "all" && user.role !== role) return false;
    if (plan !== "all" && user.plan !== plan) return false;
    if (locale !== "all" && user.locale !== locale) return false;
    if (!query) return true;
    return user.name.toLowerCase().includes(query) || user.email.toLowerCase().includes(query) || user.id.toLowerCase().includes(query);
  });
}

export function getUsersSummaryStats() {
  const users = getUsersTableData();
  const totalUsers = users.length;
  const activeToday = users.filter((user) => user.isActiveToday).length;
  const newThisMonth = users.filter((user) => user.joinedAt.startsWith("2026-03")).length;
  const payingUsers = users.filter((user) => user.plan !== "free").length;

  return [
    {id: "totalUsers", value: totalUsers, change: "+12.5%", icon: "users"},
    {id: "activeToday", value: activeToday, change: "+4.3%", icon: "activity"},
    {id: "newThisMonth", value: newThisMonth, change: "+8.1%", icon: "newUsers"},
    {id: "payingUsers", value: payingUsers, change: "+6.8%", icon: "crown"}
  ] as const;
}

export function getSubscriptionStats() {
  const totalSubscribers = Math.round(USER_ENTITIES.length * 2451.2);
  const recurringRevenue = USER_ENTITIES.reduce((sum, user) => {
    const plan = PLAN_ENTITIES.find((item) => item.id === user.planId);
    return sum + (plan?.price ?? 0);
  }, 0);
  const monthlyRevenue = Math.round(recurringRevenue * 531);
  const freeUsers = USER_ENTITIES.filter((user) => user.planId === "free").length * 51455;
  const conversionRate = ((USER_ENTITIES.filter((user) => user.planId !== "free" && user.planId !== "guest").length / totalSubscribers) * 100).toFixed(2);

  return [
    {
      id: "totalSubscribers",
      labelKey: "stats.totalSubscribers",
      value: totalSubscribers.toLocaleString(),
      change: "+12%",
      tone: "positive",
      icon: "users"
    },
    {
      id: "monthlyRevenue",
      labelKey: "stats.monthlyRevenue",
      value: `$${monthlyRevenue.toLocaleString()}`,
      change: "+8.4%",
      tone: "positive",
      icon: "wallet"
    },
    {
      id: "freeUsers",
      labelKey: "stats.freeUsers",
      value: freeUsers.toLocaleString(),
      change: "-0.2%",
      tone: "negative",
      icon: "userCheck"
    },
    {
      id: "conversionRate",
      labelKey: "stats.conversionRate",
      value: `${conversionRate}%`,
      change: "+1.1%",
      tone: "positive",
      icon: "percent"
    }
  ] as const;
}

export function getSubscriptionsPageData(): SubscriptionsPageData {
  const planUserCounts = USER_ENTITIES.reduce(
    (acc, user) => {
      if (user.planId === "free") acc.free += 1;
      if (user.planId === "pro") acc.pro += 1;
      if (user.planId === "premium") acc.premium += 1;
      return acc;
    },
    {free: 0, pro: 0, premium: 0}
  );

  const distribution = ([
    {plan: "free", count: planUserCounts.free, color: "#334155"},
    {plan: "pro", count: planUserCounts.pro, color: "#2F5BFF"},
    {plan: "premium", count: planUserCounts.premium, color: "#8B9CFF"}
  ] as const).map((item) => {
    const weightedUsers = item.count * 12600;
    const totalWeighted = (planUserCounts.free + planUserCounts.pro + planUserCounts.premium) * 12600;
    return {
      plan: item.plan,
      users: weightedUsers,
      percentage: Math.round((weightedUsers / Math.max(totalWeighted, 1)) * 100),
      color: item.color
    };
  });

  const recentActions = SUBSCRIPTION_ACTION_ENTITIES.map((action) => {
    const user = getUserById(action.userId);
    return {
      id: action.id,
      userName: user?.name ?? "Unknown User",
      email: user?.email ?? "unknown@example.com",
      avatarFallback: user?.avatarFallback ?? "UU",
      fromPlan: toPlanTitle(action.fromPlanId),
      toPlan: toPlanTitle(action.toPlanId),
      date: action.date,
      status: action.status
    };
  });

  return {
    stats: [...getSubscriptionStats()],
    plans: PLAN_ENTITIES,
    settings: GLOBAL_PLAN_SETTINGS_ENTITY,
    distribution,
    recentActions
  };
}

export function getAnalyticsSummary(range: AnalyticsRangeKey): AnalyticsSummaryStat[] {
  const attempts = USER_TEST_ATTEMPT_ENTITIES;
  const readingAttempts = attempts.filter((item) => item.module === "reading");
  const listeningAttempts = attempts.filter((item) => item.module === "listening");
  const averageReading = readingAttempts.reduce((sum, item) => sum + item.scoreBand, 0) / Math.max(readingAttempts.length, 1);
  const averageListening = listeningAttempts.reduce((sum, item) => sum + item.scoreBand, 0) / Math.max(listeningAttempts.length, 1);

  const rangeMultiplier = range === "last7Days" ? 0.23 : range === "last30Days" ? 1 : 2.86;
  const totalTestsTaken = Math.round(attempts.length * 3767.5 * rangeMultiplier);
  const activeStudents = Math.round(USER_ENTITIES.filter((user) => user.isActiveToday).length * (range === "last7Days" ? 463 : range === "last30Days" ? 1834 : 4823));

  return [
    {id: "totalTestsTaken", value: totalTestsTaken.toLocaleString(), change: range === "last7Days" ? "+6.2%" : range === "last30Days" ? "+12.4%" : "+19.3%", icon: "tests"},
    {id: "avgReadingScore", value: averageReading.toFixed(1), change: range === "last7Days" ? "+0.2" : range === "last30Days" ? "+0.2" : "+0.4", icon: "reading"},
    {id: "avgListeningScore", value: averageListening.toFixed(1), change: range === "last7Days" ? "+0.3" : range === "last30Days" ? "+0.5" : "+0.6", icon: "listening"},
    {id: "activeStudents", value: activeStudents.toLocaleString(), change: range === "last7Days" ? "+5.4%" : range === "last30Days" ? "+8.1%" : "+14.7%", icon: "users"}
  ];
}

export function getAnalyticsDataset(range: AnalyticsRangeKey): AnalyticsDataset {
  const hardestQuestions = HARDEST_QUESTIONS_BY_RANGE[range].map((item) => ({
    id: item.id,
    preview: item.preview,
    type: item.type,
    testName: getTestById(item.testId)?.name ?? "Unknown Test",
    accuracy: item.accuracy,
    attempts: item.attempts
  }));

  return {
    summary: getAnalyticsSummary(range),
    scoreTrend: SCORE_TREND_BY_RANGE[range],
    completedPerDay: DAILY_COMPLETION_BY_RANGE[range],
    questionTypeAccuracy: QUESTION_TYPE_ACCURACY_BY_RANGE[range],
    skillDistribution: SKILL_DISTRIBUTION_BY_RANGE[range],
    hardestQuestions,
    passagePerformance: PASSAGE_PERFORMANCE_BY_RANGE[range],
    insights: [
      {
        id: "insight-1",
        tone: "info",
        badgeKey: "optimize",
        titleKey: "risingDifficultyGap",
        descriptionKey: "risingDifficultyGapDesc"
      },
      {
        id: "insight-2",
        tone: "success",
        badgeKey: "strength",
        titleKey: "vocabularyRetention",
        descriptionKey: "vocabularyRetentionDesc"
      },
      {
        id: "insight-3",
        tone: "default",
        badgeKey: "segment",
        titleKey: "regionalPerformance",
        descriptionKey: "regionalPerformanceDesc"
      }
    ]
  };
}

export function getAchievementsSummary() {
  const totalAchievements = ACHIEVEMENT_ENTITIES.length * 7;
  const earnedToday = Math.round(USER_ACHIEVEMENT_ENTITIES.length * 171.2);
  const mostEarned = ACHIEVEMENT_ENTITIES[0]?.title ?? "First Test";
  const activeStreakUsers = USER_ACHIEVEMENT_ENTITIES.filter((entry) => Number.parseInt(entry.currentStreak, 10) >= 7).length * 248;

  return [
    {id: "totalAchievements", value: totalAchievements.toLocaleString(), icon: "total"},
    {id: "earnedToday", value: earnedToday.toLocaleString(), icon: "earned"},
    {id: "mostEarnedBadge", value: mostEarned, icon: "badge"},
    {id: "activeStreakUsers", value: activeStreakUsers.toLocaleString(), icon: "streak"}
  ] as const;
}

export function getAchievementsPageData(): AchievementsPageData {
  const timesEarnedByAchievementId: Record<string, number> = {
    "achv-7day-streak": 4210,
    "achv-high-flyer": 1120,
    "achv-30day-streak": 420,
    "achv-perfect-score": 85,
    "achv-listening-momentum": 730,
    "achv-reading-marathon": 265
  };

  return {
    stats: [...getAchievementsSummary()],
    activeAchievements: ACHIEVEMENT_ENTITIES.map((achievement) => ({
      id: achievement.id,
      title: achievement.title,
      description: achievement.description,
      tone: achievement.tone,
      badgeIcon: achievement.badgeIcon,
      timesEarned: timesEarnedByAchievementId[achievement.id] ?? 0
    })),
    recentProgress: USER_ACHIEVEMENT_ENTITIES.map((entry) => {
      const user = getUserById(entry.userId);
      const achievement = ACHIEVEMENT_ENTITIES.find((item) => item.id === entry.achievementId);
      return {
        id: entry.id,
        userName: user?.name ?? "Unknown User",
        email: user?.email ?? "unknown@example.com",
        avatarFallback: user?.avatarFallback ?? "UU",
        achievement: achievement?.title ?? "Achievement",
        dateEarned: entry.dateEarned,
        currentStreak: entry.currentStreak
      };
    }),
    settings: GAMIFICATION_SETTINGS_ENTITY,
    trends: ACHIEVEMENT_TRENDS,
    badgeLibrary: BADGE_LIBRARY_ENTITIES
  };
}

export function getMistakesAnalysisData(range: AnalyticsRangeKey): MistakesDataset {
  const source = MISTAKES_BY_RANGE[range];
  const mostMissedQuestions = source.mostMissedQuestions.map((question) => ({
    id: question.id,
    preview: question.preview,
    testName: getTestById(question.testId)?.name ?? "Unknown Test",
    type: question.type,
    accuracyRate: question.accuracyRate,
    attempts: question.attempts,
    topics: question.topics
  }));

  const readingAccuracy = source.questionTypeAccuracy.reduce((sum, item) => sum + item.accuracy, 0) / Math.max(source.questionTypeAccuracy.length, 1);
  const listeningAccuracy = readingAccuracy + 6;

  const summaryStats = [
    {
      id: "mostDifficultType",
      value: [...source.questionTypeAccuracy].sort((a, b) => a.accuracy - b.accuracy)[0]?.label ?? "Matching Headings",
      sublabel: `${Math.min(...source.questionTypeAccuracy.map((item) => item.accuracy))}% Accuracy Rate`,
      tone: "critical"
    },
    {
      id: "lowestAccuracyPassage",
      value: [...source.passageDifficulty].sort((a, b) => a.accuracy - b.accuracy)[0]?.title ?? "Behavioral Economics",
      sublabel: `${Math.min(...source.passageDifficulty.map((item) => item.accuracy))}% Avg Score`,
      tone: "critical"
    },
    {
      id: "avgReadingAccuracy",
      value: formatPercent(readingAccuracy, 0),
      sublabel: "Global Performance",
      tone: "warning"
    },
    {
      id: "avgListeningAccuracy",
      value: formatPercent(listeningAccuracy, 0),
      sublabel: "Global Performance",
      tone: "positive"
    }
  ] as const;

  return {
    summaryStats: [...summaryStats],
    questionTypeAccuracy: source.questionTypeAccuracy,
    distribution: source.distribution,
    totalErrorsLabel: source.totalErrorsLabel,
    mostMissedQuestions,
    passageDifficulty: source.passageDifficulty.map((item) => ({
      id: item.id,
      title: item.title,
      accuracy: item.accuracy,
      rank: item.rank
    })),
    commonTopics: source.commonTopics,
    aiInsights: source.insights
  };
}

export function getReportsPageData(): ReportsPageData {
  const testsById = new Map(TEST_ENTITIES.map((test) => [test.id, test]));
  const usersById = new Map(USER_ENTITIES.map((user) => [user.id, user]));
  const passagesById = new Map(PASSAGE_ASSET_ENTITIES.map((passage) => [passage.id, passage]));
  const reportsById = new Map(REPORT_ENTITIES.map((report) => [report.id, report]));

  const reports: ReportsPageReport[] = [...REPORT_ENTITIES]
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .map((report) => {
      const test = testsById.get(report.testId);
      const reporter = usersById.get(report.userId);
      const assignedTo = report.assignedToUserId ? usersById.get(report.assignedToUserId) : undefined;
      const passage = report.passageId ? passagesById.get(report.passageId) : undefined;

      return {
        id: report.id,
        code: report.code,
        module: report.module,
        reportType: report.reportType,
        status: report.status,
        severity: report.severity,
        questionPreview: report.questionPreview,
        questionNumberLabel: report.questionNumberLabel,
        userMessage: report.userMessage,
        createdAt: report.createdAt,
        selectedAnswer: report.selectedAnswer,
        correctAnswer: report.correctAnswer,
        questionContentTitle: report.questionContentTitle,
        questionOptions: report.questionOptions?.map((option) => ({...option})),
        passageHighlight: report.passageHighlight,
        passageTitle: passage?.title,
        reporter: {
          id: report.userId,
          name: reporter?.name ?? "Unknown User",
          avatarFallback: reporter?.avatarFallback ?? "UU"
        },
        test: {
          id: report.testId,
          name: test?.name ?? "Unknown Test"
        },
        assignedTo: assignedTo
          ? {
              id: assignedTo.id,
              name: assignedTo.name
            }
          : undefined
      };
    });

  const reportFrequency = new Map<string, MostReportedQuestionItem>();
  for (const report of reports) {
    const frequencyKey = `${report.test.id}::${report.questionNumberLabel}`;
    const existing = reportFrequency.get(frequencyKey);
    const label = `${report.test.name} ${report.questionNumberLabel}`;

    if (!existing) {
      reportFrequency.set(frequencyKey, {
        id: frequencyKey,
        label,
        module: report.module,
        reportType: report.reportType,
        reportCount: 1
      });
      continue;
    }

    existing.reportCount += 1;
  }

  const mostReportedQuestions = [...reportFrequency.values()]
    .sort((left, right) => right.reportCount - left.reportCount || left.label.localeCompare(right.label))
    .slice(0, 5);

  const resolutionHistory: ReportHistoryFeedItem[] = [...REPORT_HISTORY_ENTITIES]
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .map((historyItem) => {
      const actor =
        (historyItem.actorUserId ? usersById.get(historyItem.actorUserId)?.name : undefined) ??
        historyItem.actorLabel ??
        "System";

      return {
        id: historyItem.id,
        reportId: historyItem.reportId,
        reportCode: historyItem.reportId ? reportsById.get(historyItem.reportId)?.code : undefined,
        actionType: historyItem.actionType,
        actor,
        description: historyItem.description,
        createdAt: historyItem.createdAt
      };
    });

  return {
    reports,
    mostReportedQuestions,
    resolutionHistory
  };
}

function uniqueIds(values: string[]) {
  return [...new Set(values)];
}

type QuestionRange = {
  start: number;
  end: number;
  total: number;
  from: number;
  to: number;
};

function createQuestionRange(start: number, end: number): QuestionRange {
  return {
    start,
    end,
    total: end - start + 1,
    from: start,
    to: end
  };
}

export type VariantGroupsValidation = {
  isValid: boolean;
  selectedTypesCount: number;
  maxQuestionTypes: number;
  totalSelected: number;
  allowedTotal: number;
  remaining: number;
  hasDuplicateTypes: boolean;
  hasInvalidCounts: boolean;
  exceedsMaxTypes: boolean;
  hasTotalMismatch: boolean;
};

export function getQuestionRangeForSlot(module: ContentModule, slotIndex: number): QuestionRange {
  if (module === "reading") {
    if (slotIndex === 2) return createQuestionRange(14, 26);
    if (slotIndex === 3) return createQuestionRange(27, 40);
    return createQuestionRange(1, 13);
  }

  if (slotIndex === 2) return createQuestionRange(11, 20);
  if (slotIndex === 3) return createQuestionRange(21, 30);
  if (slotIndex === 4) return createQuestionRange(31, 40);
  return createQuestionRange(1, 10);
}

export function getAllowedQuestionCount(module: ContentModule, slotIndex: number) {
  const range = getQuestionRangeForSlot(module, slotIndex);
  return range.total;
}

export function buildVariantSummary(groups: VariantGroupTemplate[]) {
  return buildVariantSummaryFromGroups(groups);
}

export function getVariantQuestionTotal(variantSet: Pick<ContentBankVariantSet, "groups"> | Pick<QuestionVariantSetEntity, "groups">) {
  return variantSet.groups.reduce((sum, group) => sum + group.count, 0);
}

export function isVariantCompatibleWithSlot(
  module: ContentModule,
  slotIndex: number,
  variantSet: Pick<ContentBankVariantSet, "module" | "groups"> | Pick<QuestionVariantSetEntity, "groups"> & {module?: ContentModule}
) {
  const variantModule = "module" in variantSet && variantSet.module ? variantSet.module : module;
  if (variantModule !== module) {
    return false;
  }
  return getVariantQuestionTotal(variantSet) === getAllowedQuestionCount(module, slotIndex);
}

export function validateVariantGroups(
  module: ContentModule,
  slotIndex: number,
  groups: VariantGroupTemplate[],
  maxQuestionTypes = MAX_VARIANT_QUESTION_TYPES
): VariantGroupsValidation {
  const selectedTypesCount = groups.length;
  const totalSelected = groups.reduce((sum, group) => sum + group.count, 0);
  const allowedTotal = getAllowedQuestionCount(module, slotIndex);
  const remaining = allowedTotal - totalSelected;
  const hasDuplicateTypes = new Set(groups.map((group) => group.type)).size !== groups.length;
  const hasInvalidCounts = groups.some((group) => !Number.isFinite(group.count) || group.count <= 0);
  const exceedsMaxTypes = selectedTypesCount > maxQuestionTypes;
  const hasTotalMismatch = totalSelected !== allowedTotal;
  const isValid =
    selectedTypesCount > 0 &&
    !hasDuplicateTypes &&
    !hasInvalidCounts &&
    !exceedsMaxTypes &&
    !hasTotalMismatch;

  return {
    isValid,
    selectedTypesCount,
    maxQuestionTypes,
    totalSelected,
    allowedTotal,
    remaining,
    hasDuplicateTypes,
    hasInvalidCounts,
    exceedsMaxTypes,
    hasTotalMismatch
  };
}

function createGeneratedBuilderQuestion(type: QuestionType, number: number): BuilderQuestion {
  const base = {
    id: `${type}-${number}`,
    number,
    type,
    prompt: "",
    explanation: "",
    evidence: "",
    evidenceText: ""
  } as const;

  if (type === "tfng") {
    return {...base, type, correctAnswer: ""};
  }

  if (type === "yes_no_not_given") {
    return {...base, type, correctAnswer: ""};
  }

  if (type === "multiple_choice") {
    return {
      ...base,
      type,
      options: ["", "", "", ""],
      correctAnswer: ""
    };
  }

  if (type === "matching_headings") {
    return {
      ...base,
      type,
      headings: [],
      correctAnswer: ""
    };
  }

  if (
    type === "matching_information" ||
    type === "matching_features" ||
    type === "selecting_from_a_list" ||
    type === "map"
  ) {
    return {
      ...base,
      type,
      items: [],
      choices: [],
      correctAnswer: {}
    };
  }

  return {
    ...base,
    type,
    correctAnswer: [],
    acceptableAnswers: []
  };
}

export function generateQuestionGroupsFromVariant(input: {
  module: ContentModule;
  slotIndex: number;
  variantSet: Pick<ContentBankVariantSet, "id" | "groups">;
}): BuilderQuestionGroup[] {
  const range = getQuestionRangeForSlot(input.module, input.slotIndex);
  let cursor = range.from;

  return input.variantSet.groups.map((group, index) => {
    const from = cursor;
    const to = cursor + group.count - 1;
    const questions: BuilderQuestion[] = [];
    for (let number = from; number <= to; number += 1) {
      questions.push(createGeneratedBuilderQuestion(group.type, number));
    }
    cursor = to + 1;

    return {
      id: `${input.variantSet.id}-group-${index + 1}`,
      title: `Questions ${from}-${to}`,
      type: group.type,
      from,
      to,
      questions,
      variantSetId: input.variantSet.id
    };
  });
}

export function getPassageVariantSets(passageId: string) {
  return getContentBankData().variants.filter((variant) => variant.passageId === passageId);
}

export function getCompatibleVariantsForSlot(passageId: string, module: ContentModule, slotIndex: number) {
  return getPassageVariantSets(passageId).filter((variant) => isVariantCompatibleWithSlot(module, slotIndex, variant));
}

export function getContentBankData(): ContentBankData {
  const runtimeVariantEntities = getQuestionVariantSetEntities();
  const tests: AdminTestSummary[] = TEST_ENTITIES.map((test) => ({
    id: test.id,
    name: test.name,
    module: test.module
  }));
  const testsById = new Map(tests.map((test) => [test.id, test]));

  const attemptsByTestId = USER_TEST_ATTEMPT_ENTITIES.reduce<Record<string, number>>((accumulator, attempt) => {
    accumulator[attempt.testId] = (accumulator[attempt.testId] ?? 0) + 1;
    return accumulator;
  }, {});

  const bandAvgByTestId = USER_TEST_ATTEMPT_ENTITIES.reduce<Record<string, {sum: number; count: number}>>((accumulator, attempt) => {
    const current = accumulator[attempt.testId] ?? {sum: 0, count: 0};
    current.sum += attempt.scoreBand;
    current.count += 1;
    accumulator[attempt.testId] = current;
    return accumulator;
  }, {});

  const passageDifficultyByTestId = MISTAKES_BY_RANGE.last30Days.passageDifficulty.reduce<Record<string, number>>((accumulator, item) => {
    accumulator[item.testId] = item.accuracy;
    return accumulator;
  }, {});

  const variants = runtimeVariantEntities.map<ContentBankVariantSet>((variant) => {
    const passage = PASSAGE_ASSET_ENTITIES.find((item) => item.id === variant.passageId);
    const usedInTests = variant.usedInTestIds
      .map((testId) => testsById.get(testId))
      .filter((item): item is AdminTestSummary => Boolean(item));

    return {
      id: variant.id,
      passageId: variant.passageId,
      passageTitle: passage?.title ?? "Unknown Passage",
      module: passage?.module ?? "reading",
      name: variant.name,
      status: variant.status,
      maxQuestionTypes: variant.maxQuestionTypes,
      groups: variant.groups.map((group) => ({...group})),
      questionTypesSummary: variant.questionTypesSummary || buildVariantSummaryFromGroups(variant.groups),
      questionTypeKeys: [...variant.questionTypeKeys],
      questionSignature: variant.questionSignature,
      usedInTestIds: [...variant.usedInTestIds],
      usedInTests,
      createdAt: variant.createdAt
    };
  });

  const variantIdsByPassage = variants.reduce<Record<string, string[]>>((accumulator, variant) => {
    const current = accumulator[variant.passageId] ?? [];
    accumulator[variant.passageId] = [...current, variant.id];
    return accumulator;
  }, {});

  const usedInByPassage = variants.reduce<Record<string, string[]>>((accumulator, variant) => {
    const current = accumulator[variant.passageId] ?? [];
    accumulator[variant.passageId] = uniqueIds([...current, ...variant.usedInTestIds]);
    return accumulator;
  }, {});

  const passages = PASSAGE_ASSET_ENTITIES.map<ContentBankPassage>((passage) => {
    const usedInTestIds = uniqueIds([...(usedInByPassage[passage.id] ?? []), ...passage.linkedTestIds]);
    const usageAttempts = usedInTestIds.reduce((sum, testId) => sum + (attemptsByTestId[testId] ?? 0), 0);

    const averageBandScoreSource = usedInTestIds
      .map((testId) => bandAvgByTestId[testId])
      .filter((item): item is {sum: number; count: number} => Boolean(item));
    const averageBandScore =
      averageBandScoreSource.length > 0
        ? Number(
            (
              averageBandScoreSource.reduce((sum, item) => sum + item.sum, 0) /
              Math.max(
                averageBandScoreSource.reduce((sum, item) => sum + item.count, 0),
                1
              )
            ).toFixed(1)
          )
        : undefined;

    const difficultyAccuracyCandidates = usedInTestIds
      .map((testId) => passageDifficultyByTestId[testId])
      .filter((item): item is number => typeof item === "number");
    const difficultyAccuracy =
      difficultyAccuracyCandidates.length > 0 ? Math.min(...difficultyAccuracyCandidates) : undefined;

    return {
      id: passage.id,
      title: passage.title,
      module: passage.module,
      wordCount: passage.wordCount,
      durationMinutes: passage.durationMinutes,
      difficulty: passage.difficulty,
      topic: passage.topic,
      source: passage.source,
      previewText: passage.previewText,
      fullText: passage.fullText,
      estimatedTimeLabel: passage.estimatedTimeLabel,
      createdAt: passage.createdAt,
      linkedStructureIds: [...passage.linkedStructureIds],
      linkedTestIds: [...passage.linkedTestIds],
      usedInTestIds,
      variantIds: variantIdsByPassage[passage.id] ?? [],
      variantCount: (variantIdsByPassage[passage.id] ?? []).length,
      usageAttempts,
      difficultyAccuracy,
      averageBandScore
    };
  });

  const meta: ContentBankMeta = {
    linkedTestsCount: tests.length,
    linkedStructuresCount: PASSAGE_ASSET_ENTITIES.reduce((sum, item) => sum + item.linkedStructureIds.length, 0),
    activeLearnersCount: USER_ENTITIES.filter((user) => user.isActiveToday).length,
    premiumPlansCount: PLAN_ENTITIES.filter((plan) => plan.price > 0).length,
    achievementTracksCount: ACHIEVEMENT_ENTITIES.length,
    topMistakeTopics: MISTAKES_BY_RANGE.last30Days.commonTopics.slice(0, 3).map((item) => item.label)
  };

  return {
    passages,
    variants,
    tests,
    meta
  };
}

export function getMistakesRecommendationDefaults() {
  return DEFAULT_RECOMMENDATION_SETTINGS_ENTITY;
}
