import { studentHttpClient, toStudentApiError } from "./httpClient";
import { getQuestionTypeHumanLabel } from "./questionTypeLabels";
import type {
  StudentDashboardAchievement,
  StudentDashboardContinueTest,
  StudentDashboardResponse,
  StudentDashboardSkillPoint,
  StudentDashboardWeakArea
} from "./types";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function toNumberSafe(value: unknown, fallback = 0) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function pickRecord(source: Record<string, unknown> | null, keys: string[]) {
  if (!source) return null;
  for (const key of keys) {
    const value = asRecord(source[key]);
    if (value) return value;
  }
  return null;
}

function pickArray(source: Record<string, unknown> | null, keys: string[]) {
  if (!source) return [];
  for (const key of keys) {
    const value = source[key];
    if (Array.isArray(value)) {
      return value;
    }
  }
  return [];
}

function pickString(source: Record<string, unknown> | null, keys: string[], fallback = "") {
  if (!source) return fallback;
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }
    if (typeof value === "boolean") {
      return value ? "true" : "false";
    }
  }
  return fallback;
}

function pickNumber(source: Record<string, unknown> | null, keys: string[], fallback = 0) {
  if (!source) return fallback;
  for (const key of keys) {
    const value = source[key];
    const parsed = typeof value === "number" ? value : Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function pickBoolean(source: Record<string, unknown> | null, keys: string[], fallback = false) {
  if (!source) return fallback;
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "boolean") return value;
  }
  return fallback;
}

function normalizeAccuracyLabel(value: string) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return "0%";
  if (trimmed.includes("%")) return trimmed;
  const parsed = Number(trimmed);
  if (Number.isFinite(parsed)) {
    return `${parsed}%`;
  }
  return trimmed;
}

function normalizeContinueModule(value: string) {
  const normalized = String(value ?? "").toLowerCase();
  if (normalized.includes("listen")) return "Listening";
  if (normalized.includes("write")) return "Writing";
  if (normalized.includes("speak")) return "Speaking";
  return "Reading";
}

function normalizeContinue(value: unknown): StudentDashboardContinueTest | null {
  const record = asRecord(value);
  if (!record) return null;

  const id = pickString(record, ["id", "test_id", "practice_test"]);
  const attemptId = pickString(record, ["attempt_id", "active_attempt_id", "current_attempt_id", "last_attempt_id"]);
  if (!id && !attemptId) return null;
  const rawModule = pickString(record, ["module", "type_display", "test_type"], "Reading");
  const moduleLabel = normalizeContinueModule(rawModule);
  const progressPercent = pickNumber(record, ["progress_percent", "progressPercent"], Number.NaN);

  return {
    id: id || attemptId,
    attemptId: attemptId || undefined,
    module: moduleLabel,
    title: pickString(record, ["title", "test_title", "practice_test_title"], "Practice Test"),
    level: pickString(record, ["level", "difficulty", "difficulty_display"], "General"),
    lastActiveLabel: pickString(record, ["last_active_label", "last_active", "updated_at"], "Recently active"),
    progressQuestions: Math.max(0, pickNumber(record, ["progress_questions", "progress_answered", "answered_count", "answered"], 0)),
    totalQuestions: Math.max(1, pickNumber(record, ["total_questions", "progress_total", "questions"], 40)),
    progressPercent: Number.isFinite(progressPercent) ? progressPercent : undefined,
    href: pickString(record, ["href", "continue_href"], "") || undefined
  };
}

function normalizeSkills(value: unknown): StudentDashboardSkillPoint[] {
  const keys: StudentDashboardSkillPoint["key"][] = ["listening", "reading", "writing", "speaking"];
  const byKey = new Map<StudentDashboardSkillPoint["key"], number>();

  if (Array.isArray(value)) {
    value.forEach((item) => {
      const record = asRecord(item);
      if (!record) return;
      const key = pickString(record, ["key", "module"], "").toLowerCase() as StudentDashboardSkillPoint["key"];
      if (!keys.includes(key)) return;
      byKey.set(key, pickNumber(record, ["band", "score"], 0));
    });
  } else {
    const record = asRecord(value);
    if (record) {
      keys.forEach((key) => {
        const parsed = toNumberSafe(record[key], Number.NaN);
        if (Number.isFinite(parsed)) {
          byKey.set(key, parsed);
        }
      });
    }
  }

  return keys.map((key) => ({
    key,
    band: byKey.get(key) ?? 0
  }));
}

function normalizeWeakAreas(values: unknown[]): StudentDashboardWeakArea[] {
  return values
    .map((item, index) => {
      const record = asRecord(item);
      if (!record) return null;
      const moduleKey = pickString(record, ["module", "skill"], "reading").toLowerCase();
      if (!["reading", "listening", "writing", "speaking"].includes(moduleKey)) return null;
      const questionType = pickString(record, ["question_type", "questionType"], "");
      const titleFromPayload = pickString(record, ["title", "name"], "");
      const title = titleFromPayload || getQuestionTypeHumanLabel(questionType, "") || "Weak Area";
      const accuracy = normalizeAccuracyLabel(pickString(record, ["accuracy", "score", "value"], "0"));
      return {
        id: pickString(record, ["id"], questionType ? `weak-area-${questionType.toLowerCase()}-${index + 1}` : `weak-area-${index + 1}`),
        title,
        module: moduleKey as StudentDashboardWeakArea["module"],
        questionType: questionType || undefined,
        questionTypeLabel: getQuestionTypeHumanLabel(questionType, "") || undefined,
        accuracy,
        actionLabel: pickString(record, ["action_label", "actionLabel"], "Practice now")
      } as StudentDashboardWeakArea;
    })
    .filter((item): item is StudentDashboardWeakArea => Boolean(item));
}

function normalizeAchievements(values: unknown[]): StudentDashboardAchievement[] {
  return values
    .map((item, index) => {
      const record = asRecord(item);
      if (!record) return null;
      return {
        id: pickString(record, ["id"], `achievement-${index + 1}`),
        title: pickString(record, ["title", "name"], "Achievement"),
        subtitle: pickString(record, ["subtitle", "description"], ""),
        earned: pickBoolean(record, ["earned", "is_earned", "completed"], false)
      } as StudentDashboardAchievement;
    })
    .filter((item): item is StudentDashboardAchievement => Boolean(item));
}

function normalizeResponse(data: unknown): StudentDashboardResponse {
  const root = asRecord(data);
  const summaryRecord = pickRecord(root, ["summary", "user_summary", "stats"]) ?? root;
  const overallJourneyCandidate = toNumberSafe((root ?? {})["overall_journey_pct"] ?? (root ?? {})["overall_journey_percent"], -1);

  const currentBand = pickNumber(summaryRecord, ["current_band", "currentBand", "band"], 0);
  const goalBand = pickNumber(summaryRecord, ["goal_band", "goalBand", "target_band"], 0);
  const testsTaken = pickNumber(summaryRecord, ["tests_taken", "testsTaken", "total_tests"], 0);

  const scoreProgress = pickArray(root, ["score_progress", "scoreProgress", "band_progression", "bandProgression"])
    .map((item, index) => {
      const record = asRecord(item);
      if (!record) return null;
      return {
        id: pickString(record, ["id"], `score-${index + 1}`),
        label: pickString(record, ["label", "date", "name"], `#${index + 1}`),
        band: pickNumber(record, ["band", "band_score", "score"], 0)
      };
    })
    .filter((item): item is { id: string; label: string; band: number } => Boolean(item));

  const recentHistory = pickArray(root, ["recent_tests", "recent_history", "recentHistory", "recent_test_history"])
    .map((item, index) => {
      const record = asRecord(item);
      if (!record) return null;
      const moduleKey = pickString(record, ["module", "test_type"], "reading").toLowerCase();
      if (!["reading", "listening", "writing", "speaking"].includes(moduleKey)) return null;
      return {
        id: pickString(record, ["id", "attempt_id"], `recent-${index + 1}`),
        testName: pickString(record, ["test_name", "testName", "title"], "Practice Test"),
        date: pickString(record, ["date", "completed_at", "completedAt"], ""),
        module: moduleKey as "reading" | "listening" | "writing" | "speaking",
        score: pickString(record, ["band_score", "score", "result"], "")
      };
    })
    .filter((item): item is StudentDashboardResponse["recentHistory"][number] => Boolean(item));

  return {
    summary: {
      name: pickString(summaryRecord, ["name", "full_name", "fullName"], "Student"),
      currentBand,
      goalBand,
      testsTaken,
      readingAccuracy: pickNumber(summaryRecord, ["reading_accuracy", "readingAccuracy"], 0),
      listeningAccuracy: pickNumber(summaryRecord, ["listening_accuracy", "listeningAccuracy"], 0),
      streakDays: pickNumber(summaryRecord, ["streak_days", "streakDays", "study_streak", "studyStreak"], 0),
      streakIncreasedToday: pickBoolean(summaryRecord, ["streak_increased_today", "streakIncreasedToday"], false),
      bandsAway: pickNumber(summaryRecord, ["bands_away", "bandsAway"], Math.max(0, goalBand - currentBand))
    },
    continueTest: normalizeContinue((root ?? {})["continue_test"] ?? (root ?? {})["continueTest"] ?? (root ?? {})["in_progress_test"]),
    scoreProgress,
    skillsSnapshot: normalizeSkills((root ?? {})["skills_snapshot"] ?? (root ?? {})["skillsSnapshot"]),
    overallJourneyPct: overallJourneyCandidate >= 0 ? overallJourneyCandidate : null,
    weakAreas: normalizeWeakAreas(pickArray(root, ["weak_areas", "weakAreas"])),
    aiRecommendation: (() => {
      const recommendation = asRecord((root ?? {})["ai_recommendation"] ?? (root ?? {})["aiRecommendation"]);
      if (!recommendation) return null;
      return {
        tag: pickString(recommendation, ["tag"], "Tutor insight"),
        message: pickString(recommendation, ["message", "text"], "")
      };
    })(),
    recentHistory,
    achievements: normalizeAchievements(pickArray(root, ["achievements"])),
    raw: root
  };
}

export const studentDashboardService = {
  async getDashboard() {
    try {
      const response = await studentHttpClient.get("/dashboard/");
      return normalizeResponse(response.data);
    } catch (error) {
      throw toStudentApiError(error);
    }
  }
};
