import {adminHttpClient, toAdminApiError} from "./httpClient";

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

function asArray(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => item && typeof item === "object")
    .map((item) => item as Record<string, unknown>);
}

function asNumber(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return fallback;
}

function asString(value: unknown, fallback = "") {
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return fallback;
}

export type AdminDashboardResponse = {
  metrics: {
    totalUsers: number;
    testsCompleted: number;
    activeUsers: number;
    premiumSubscribers: number;
  };
  userGrowth: Array<{
    date: string;
    newUsers: number;
    totalUsers: number;
  }>;
  testsCompletedSeries: Array<{
    date: string;
    testsCompleted: number;
  }>;
  platformInsights: {
    averageScore: number;
    hardestQuestionTypes: Array<{
      questionType: string;
      accuracyPercent: number;
      attempts: number;
    }>;
  };
  recentUserActivity: Array<{
    attemptId: string;
    userId: string;
    userName: string;
    email: string;
    testTitle: string;
    module: string;
    status: string;
    score: number;
    bandScore: number;
    timestamp: string;
  }>;
  raw: Record<string, unknown>;
};

function normalizeDashboardResponse(payload: unknown): AdminDashboardResponse {
  const root = asRecord(payload);
  const metrics = asRecord(root.metrics);
  const platformInsights = asRecord(root.platform_insights ?? root.platformInsights);

  return {
    metrics: {
      totalUsers: asNumber(metrics.total_users ?? metrics.totalUsers),
      testsCompleted: asNumber(metrics.tests_completed ?? metrics.testsCompleted),
      activeUsers: asNumber(metrics.active_users ?? metrics.activeUsers),
      premiumSubscribers: asNumber(
        metrics.premium_subscribers ?? metrics.paying_users ?? metrics.premiumSubscribers ?? metrics.payingUsers
      )
    },
    userGrowth: asArray(root.user_growth ?? root.userGrowth).map((item) => ({
      date: asString(item.date),
      newUsers: asNumber(item.new_users ?? item.newUsers),
      totalUsers: asNumber(item.total_users ?? item.totalUsers)
    })),
    testsCompletedSeries: asArray(root.tests_completed_series ?? root.testsCompletedSeries).map((item) => ({
      date: asString(item.date),
      testsCompleted: asNumber(item.tests_completed ?? item.testsCompleted)
    })),
    platformInsights: {
      averageScore: asNumber(platformInsights.average_score ?? platformInsights.averageScore),
      hardestQuestionTypes: asArray(
        platformInsights.hardest_question_types ?? platformInsights.hardestQuestionTypes
      ).map((item) => ({
        questionType: asString(item.question_type ?? item.questionType),
        accuracyPercent: asNumber(item.accuracy_percent ?? item.accuracyPercent),
        attempts: asNumber(item.attempts)
      }))
    },
    recentUserActivity: asArray(root.recent_user_activity ?? root.recentUserActivity).map((item) => ({
      attemptId: asString(item.attempt_id ?? item.attemptId),
      userId: asString(item.user_id ?? item.userId),
      userName: asString(item.user_name ?? item.userName),
      email: asString(item.email),
      testTitle: asString(item.test_title ?? item.testTitle),
      module: asString(item.module),
      status: asString(item.status),
      score: asNumber(item.score),
      bandScore: asNumber(item.band_score ?? item.bandScore),
      timestamp: asString(item.timestamp)
    })),
    raw: root
  };
}

export const adminDashboardService = {
  async get() {
    try {
      const response = await adminHttpClient.get<unknown>("/dashboard/");
      return normalizeDashboardResponse(response.data);
    } catch (error) {
      throw toAdminApiError(error);
    }
  }
};

