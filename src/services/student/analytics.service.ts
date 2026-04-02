import { studentHttpClient, toStudentApiError } from "./httpClient";
import type {
  StudentAnalyticsInsight,
  StudentAnalyticsModulePerformance,
  StudentAnalyticsPracticeActivity,
  StudentAnalyticsResponse
} from "./types";

const ANALYTICS_MODULE_KEYS = ["reading", "listening", "writing", "speaking"] as const;

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function toStringSafe(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function toNumberSafe(value: unknown, fallback = 0) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function pickRecord(source: Record<string, unknown> | null, keys: string[]) {
  if (!source) return null;
  for (const key of keys) {
    const candidate = asRecord(source[key]);
    if (candidate) return candidate;
  }
  return null;
}

function pickArray(source: Record<string, unknown> | null, keys: string[]) {
  if (!source) return [];
  for (const key of keys) {
    const value = source[key];
    if (Array.isArray(value)) return value;
  }
  return [];
}

function normalizeModule(value: string): StudentAnalyticsModulePerformance["module"] {
  const normalized = value.toLowerCase();
  if (normalized.includes("listen")) return "listening";
  if (normalized.includes("write")) return "writing";
  if (normalized.includes("speak")) return "speaking";
  return "reading";
}

function isAnalyticsModuleKey(value: string): value is (typeof ANALYTICS_MODULE_KEYS)[number] {
  return (ANALYTICS_MODULE_KEYS as readonly string[]).includes(value);
}

function normalizeResponse(data: unknown): StudentAnalyticsResponse {
  const root = asRecord(data);
  const summary = pickRecord(root, ["summary", "stats", "overview"]) ?? root;

  const bandProgression = pickArray(root, ["band_progression", "bandProgression", "progression"]).map((item, index) => {
    const record = asRecord(item);
    if (!record) return null;
    return {
      id: toStringSafe(record.id, `band-${index + 1}`),
      label: toStringSafe(record.label ?? record.date, `#${index + 1}`),
      band: toNumberSafe(record.band ?? record.band_score ?? record.score, 0)
    };
  }).filter((item): item is StudentAnalyticsResponse["bandProgression"][number] => Boolean(item));

  const accuracyImprovement = pickArray(root, ["accuracy_improvement", "accuracyImprovement", "accuracy_trend"]).map((item, index) => {
    const record = asRecord(item);
    if (!record) return null;
    return {
      id: toStringSafe(record.id, `accuracy-${index + 1}`),
      label: toStringSafe(record.label ?? record.date, `#${index + 1}`),
      percentage: toNumberSafe(record.percentage ?? record.accuracy ?? record.value, 0)
    };
  }).filter((item): item is StudentAnalyticsResponse["accuracyImprovement"][number] => Boolean(item));

  const weeklyStudyActivity = pickArray(root, ["weekly_study_activity", "weeklyStudyActivity", "weekly_activity"]).map((item, index) => {
    const record = asRecord(item);
    if (!record) return null;
    return {
      id: toStringSafe(record.id, `weekly-${index + 1}`),
      label: toStringSafe(record.label ?? record.week, `W${index + 1}`),
      sessions: toNumberSafe(record.sessions ?? record.count, 0)
    };
  }).filter((item): item is StudentAnalyticsResponse["weeklyStudyActivity"][number] => Boolean(item));

  const modulePerformanceArray = pickArray(root, ["module_performance", "modulePerformance"]).map((item) => {
    const record = asRecord(item);
    if (!record) return null;
    return {
      module: normalizeModule(toStringSafe(record.module, "reading")),
      percentage: toNumberSafe(record.percentage ?? record.score ?? record.accuracy, 0)
    } as StudentAnalyticsModulePerformance;
  }).filter((item): item is StudentAnalyticsModulePerformance => Boolean(item));
  const modulePerformanceObject = asRecord(root?.module_performance ?? root?.modulePerformance);
  const modulePerformanceFromObject = modulePerformanceObject
    ? Object.entries(modulePerformanceObject).map(([moduleKey, value]) => {
        const normalized = moduleKey.toLowerCase();
        if (!isAnalyticsModuleKey(normalized)) return null;
        return {
          module: normalized,
          percentage: toNumberSafe(value, 0)
        };
      }).filter((item): item is StudentAnalyticsModulePerformance => Boolean(item))
    : [];
  const modulePerformance = modulePerformanceArray.length > 0 ? modulePerformanceArray : modulePerformanceFromObject;

  const learningInsights = pickArray(root, ["learning_insights", "learningInsights", "insights"]).map((item, index) => {
    if (typeof item === "string") {
      return {
        id: `insight-${index + 1}`,
        tone: "neutral",
        title: "",
        description: item
      } as StudentAnalyticsInsight;
    }
    const record = asRecord(item);
    if (!record) return null;
    const tone = toStringSafe(record.tone, "neutral").toLowerCase();
    return {
      id: toStringSafe(record.id, `insight-${index + 1}`),
      tone: tone === "positive" || tone === "warning" ? tone : "neutral",
      title: toStringSafe(record.title),
      description: toStringSafe(record.description)
    } as StudentAnalyticsInsight;
  }).filter((item): item is StudentAnalyticsInsight => Boolean(item));

  const recentPracticeActivity = pickArray(root, ["recent_practice_activity", "recentPracticeActivity", "activity", "recent_activity"]).map((item, index) => {
    const record = asRecord(item);
    if (!record) return null;
    return {
      id: toStringSafe(record.id ?? record.attempt_id, `activity-${index + 1}`),
      dateLabel: toStringSafe(record.date_label ?? record.date ?? record.completed_at, ""),
      module: normalizeModule(toStringSafe(record.module ?? record.test_type, "reading")),
      questionType: toStringSafe(record.question_type ?? record.questionType ?? record.top_question_type, ""),
      accuracy: toNumberSafe(record.accuracy, 0),
      durationMinutes: toNumberSafe(
        record.duration_minutes ??
          record.durationMinutes ??
          (typeof record.time_used_seconds === "number" ? Math.round(record.time_used_seconds / 60) : 0),
        0
      ),
      action: toStringSafe(record.action, "toast") === "navigate" ? "navigate" : "toast",
      href: toStringSafe(record.href)
    } as StudentAnalyticsPracticeActivity;
  }).filter((item): item is StudentAnalyticsPracticeActivity => Boolean(item));

  return {
    summary: {
      currentBandEstimate: toNumberSafe(summary?.current_band_estimate ?? summary?.currentBandEstimate ?? summary?.current_band, 0),
      currentBandDelta: toNumberSafe(summary?.current_band_delta ?? summary?.currentBandDelta, 0),
      targetBand: toNumberSafe(summary?.target_band ?? summary?.targetBand, 0),
      practiceSessions: toNumberSafe(summary?.practice_sessions ?? summary?.practiceSessions, 0),
      averageAccuracy: toNumberSafe(summary?.average_accuracy ?? summary?.averageAccuracy, 0),
      accuracyDelta: toNumberSafe(summary?.accuracy_delta ?? summary?.accuracyDelta, 0)
    },
    bandProgression,
    accuracyImprovement,
    weeklyStudyActivity,
    modulePerformance,
    learningInsights,
    recentPracticeActivity,
    raw: root
  };
}

export const studentAnalyticsService = {
  async getAnalytics() {
    try {
      const response = await studentHttpClient.get("/analytics/");
      return normalizeResponse(response.data);
    } catch (error) {
      throw toStudentApiError(error);
    }
  }
};
