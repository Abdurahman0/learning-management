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
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function asString(value: unknown, fallback = "") {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return fallback;
}

export type AdminAnalyticsQuery = {
  module?: "READING" | "LISTENING";
  dateFrom?: string;
  dateTo?: string;
  difficulty?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  source?: "CUSTOM_PRACTICE" | "CAMBRIDGE";
};

export type AdminAnalyticsResponse = {
  metrics: {
    totalCompletedAttempts: number;
    averageReadingBand: number;
    averageListeningBand: number;
    activeStudents: number;
  };
  studentScoreTrend: Array<{
    weekStart: string;
    weekEnd: string;
    readingBand: number;
    listeningBand: number;
  }>;
  testsPerDay: Array<{
    date: string;
    testsCompleted: number;
  }>;
  questionTypeAccuracy: Array<{
    questionType: string;
    attempts: number;
    accuracyPercent: number;
  }>;
  skillDistribution: {
    reading: number;
    listening: number;
  };
  hardestQuestions: Array<{
    questionId: string;
    questionLabel: string;
    questionType: string;
    module: string;
    parentTitle: string;
    attempts: number;
    accuracyPercent: number;
  }>;
  passagePerformance: Array<{
    contentId: string;
    module: string;
    title: string;
    attempts: number;
    accuracyPercent: number;
  }>;
  insights: string[];
  raw: Record<string, unknown>;
};

function normalizeAnalyticsResponse(payload: unknown): AdminAnalyticsResponse {
  const root = asRecord(payload);
  const metrics = asRecord(root.metrics);
  const skillDistribution = asRecord(root.skill_distribution ?? root.skillDistribution);

  return {
    metrics: {
      totalCompletedAttempts: asNumber(metrics.total_completed_attempts ?? metrics.totalCompletedAttempts),
      averageReadingBand: asNumber(metrics.average_reading_band ?? metrics.averageReadingBand),
      averageListeningBand: asNumber(metrics.average_listening_band ?? metrics.averageListeningBand),
      activeStudents: asNumber(metrics.active_students ?? metrics.activeStudents)
    },
    studentScoreTrend: asArray(root.student_score_trend ?? root.studentScoreTrend).map((item) => ({
      weekStart: asString(item.week_start ?? item.weekStart),
      weekEnd: asString(item.week_end ?? item.weekEnd),
      readingBand: asNumber(item.reading_band ?? item.readingBand),
      listeningBand: asNumber(item.listening_band ?? item.listeningBand)
    })),
    testsPerDay: asArray(root.tests_per_day ?? root.testsPerDay).map((item) => ({
      date: asString(item.date),
      testsCompleted: asNumber(item.tests_completed ?? item.testsCompleted)
    })),
    questionTypeAccuracy: asArray(root.question_type_accuracy ?? root.questionTypeAccuracy).map((item) => ({
      questionType: asString(item.question_type ?? item.questionType),
      attempts: asNumber(item.attempts),
      accuracyPercent: asNumber(item.accuracy_percent ?? item.accuracyPercent)
    })),
    skillDistribution: {
      reading: asNumber(skillDistribution.reading),
      listening: asNumber(skillDistribution.listening)
    },
    hardestQuestions: asArray(root.hardest_questions ?? root.hardestQuestions).map((item) => ({
      questionId: asString(item.question_id ?? item.questionId),
      questionLabel: asString(item.question_label ?? item.questionLabel),
      questionType: asString(item.question_type ?? item.questionType),
      module: asString(item.module),
      parentTitle: asString(item.parent_title ?? item.parentTitle),
      attempts: asNumber(item.attempts),
      accuracyPercent: asNumber(item.accuracy_percent ?? item.accuracyPercent)
    })),
    passagePerformance: asArray(root.passage_performance ?? root.passagePerformance).map((item) => ({
      contentId: asString(item.content_id ?? item.contentId),
      module: asString(item.module),
      title: asString(item.title),
      attempts: asNumber(item.attempts),
      accuracyPercent: asNumber(item.accuracy_percent ?? item.accuracyPercent)
    })),
    insights: (Array.isArray(root.insights) ? root.insights : [])
      .map((item) => asString(item).trim())
      .filter(Boolean),
    raw: root
  };
}

export const adminAnalyticsService = {
  async get(query?: AdminAnalyticsQuery) {
    try {
      const response = await adminHttpClient.get<unknown>("/analytics/", {
        params: {
          ...(query?.module ? {module: query.module} : {}),
          ...(query?.dateFrom ? {date_from: query.dateFrom} : {}),
          ...(query?.dateTo ? {date_to: query.dateTo} : {}),
          ...(query?.difficulty ? {difficulty: query.difficulty} : {}),
          ...(query?.source ? {source: query.source} : {})
        }
      });
      return normalizeAnalyticsResponse(response.data);
    } catch (error) {
      throw toAdminApiError(error);
    }
  }
};

