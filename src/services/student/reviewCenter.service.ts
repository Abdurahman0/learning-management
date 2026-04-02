import { studentHttpClient, toListQuery, toStudentApiError } from "./httpClient";
import type {
  StudentListQuery,
  StudentReviewCenterCreatePayload,
  StudentReviewCenterItem,
  StudentReviewCenterMistakeByModule,
  StudentReviewCenterMistakeByType,
  StudentReviewCenterResponse,
  StudentReviewCenterSummary,
  StudentReviewCenterUpdatePayload
} from "./types";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function toStringSafe(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function toNumberSafe(value: unknown, fallback = 0) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toPercentNumberSafe(value: unknown, fallback = 0) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : fallback;
  }
  if (typeof value === "string") {
    const parsed = Number(value.replace(/%/g, "").trim());
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function toBooleanSafe(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function normalizeModule(value: string): StudentReviewCenterItem["module"] {
  const normalized = value.toLowerCase();
  if (normalized.includes("listen")) return "listening";
  if (normalized.includes("write")) return "writing";
  if (normalized.includes("speak")) return "speaking";
  return "reading";
}

function normalizeDifficulty(value: string): StudentReviewCenterItem["difficulty"] {
  const normalized = value.toLowerCase();
  if (normalized.includes("hard") || normalized.includes("adv")) return "hard";
  if (normalized.includes("easy") || normalized.includes("beginner")) return "easy";
  return "medium";
}

function normalizeReasons(value: unknown): StudentReviewCenterItem["reviewReasons"] {
  if (!Array.isArray(value)) return [];
  const allowed = new Set(["wrong", "saved", "flagged", "weakArea"]);
  const normalized = value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0)
    .map((item) => {
      const lower = item.toLowerCase();
      if (lower === "weak_area") return "weakArea";
      return lower;
    })
    .filter((item): item is StudentReviewCenterItem["reviewReasons"][number] => allowed.has(item));

  return normalized;
}

function deriveReasons(record: Record<string, unknown>) {
  const explicit = normalizeReasons(record.reasons ?? record.review_reasons ?? record.reviewReasons);
  if (explicit.length) {
    return explicit;
  }

  const fromFlags: StudentReviewCenterItem["reviewReasons"] = [];
  if (toBooleanSafe(record.is_wrong)) fromFlags.push("wrong");
  if (toBooleanSafe(record.is_saved, true)) fromFlags.push("saved");
  if (toBooleanSafe(record.is_flagged)) fromFlags.push("flagged");
  if (toBooleanSafe(record.is_weak_area)) fromFlags.push("weakArea");
  return fromFlags.length ? fromFlags : ["saved"];
}

function deriveLinkedPath(module: StudentReviewCenterItem["module"]) {
  if (module === "listening") return "/listening";
  if (module === "reading") return "/reading";
  return "/dashboard";
}

function normalizeAnswerText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "number" || typeof value === "boolean") return String(value);

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return "";

    if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
      try {
        return normalizeAnswerText(JSON.parse(trimmed));
      } catch {
        // Keep original string if it isn't valid JSON.
      }
    }
    return trimmed;
  }

  if (Array.isArray(value)) {
    const normalized = value
      .map((item) => normalizeAnswerText(item))
      .map((item) => item.trim())
      .filter(Boolean);
    return normalized.join(", ");
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const answers = Array.isArray(record.answers)
      ? record.answers
          .map((item) => normalizeAnswerText(item))
          .map((item) => item.trim())
          .filter(Boolean)
      : [];
    if (answers.length) return answers.join(", ");

    if ("answer" in record) {
      return normalizeAnswerText(record.answer);
    }

    try {
      return JSON.stringify(value);
    } catch {
      return "";
    }
  }

  return "";
}

function normalizeItem(item: unknown, index = 0): StudentReviewCenterItem | null {
  const record = asRecord(item);
  if (!record) return null;

  const id = toStringSafe(record.id, "");
  if (!id) return null;

  const questionType = toStringSafe(record.question_type ?? record.questionType, "multipleChoice");
  const questionText = toStringSafe(record.question_text ?? record.question ?? record.title, "Question");
  const moduleKey = normalizeModule(
    toStringSafe(record.module ?? record.test_type ?? record.source_label ?? record.test_name, "reading")
  );
  const reviewReasons = deriveReasons(record) as StudentReviewCenterItem["reviewReasons"];
  const isSaved = toBooleanSafe(record.is_saved, reviewReasons.includes("saved"));

  return {
    id,
    questionId: toStringSafe(record.question ?? record.question_id, ""),
    attemptId: toStringSafe(record.attempt ?? record.attempt_id, ""),
    questionNumber: toNumberSafe(record.question_number),
    questionText,
    module: moduleKey,
    questionType,
    questionTypeDisplay: toStringSafe(record.question_type_display, ""),
    question: questionText,
    snippet: toStringSafe(record.snippet, toStringSafe(record.explanation, "")),
    context: toStringSafe(record.context, ""),
    sourceLabel: toStringSafe(record.source_label ?? record.sourceLabel ?? record.test_name, `Saved Item ${index + 1}`),
    difficulty: normalizeDifficulty(toStringSafe(record.difficulty, "medium")),
    correctAnswer: normalizeAnswerText(record.correct_answer),
    explanation: toStringSafe(record.explanation, ""),
    testName: toStringSafe(record.test_name, ""),
    studentAnswer: record.student_answer ?? null,
    isWrong: toBooleanSafe(record.is_wrong, reviewReasons.includes("wrong")),
    isSaved,
    isWeakArea: toBooleanSafe(record.is_weak_area, reviewReasons.includes("weakArea")),
    isFlagged: toBooleanSafe(record.is_flagged, reviewReasons.includes("flagged")),
    reasons: Array.isArray(record.reasons) ? (record.reasons as string[]) : undefined,
    createdAt: typeof record.created_at === "string" ? record.created_at : null,
    reviewReasons,
    savedAgoKey: toStringSafe(record.saved_ago_key ?? record.savedAgoKey, "today"),
    linkedPracticePath: toStringSafe(record.linked_practice_path ?? record.linkedPracticePath, deriveLinkedPath(moduleKey)),
    raw: record
  };
}

function normalizeSummary(value: unknown): StudentReviewCenterSummary | null {
  const record = asRecord(value);
  if (!record) return null;

  return {
    questionsToReview: Math.max(0, toNumberSafe(record.total_to_review ?? record.questions_to_review ?? record.questionsToReview, 0)),
    mostDifficultType: toStringSafe(record.most_difficult_type ?? record.mostDifficultType, "multipleChoice"),
    weakestModule: normalizeModule(toStringSafe(record.weakest_module ?? record.weakestModule, "reading")),
    accuracyTrend: toPercentNumberSafe(record.accuracy_trend ?? record.accuracyTrend, 0)
  };
}

function normalizeMistakesByType(root: Record<string, unknown> | null): StudentReviewCenterMistakeByType[] {
  return asArray(root?.mistakes_by_type ?? root?.mistakesByType).map((item, index) => {
    const record = asRecord(item);
    if (!record) return null;
    return {
      id: toStringSafe(record.id, `mistake-type-${index + 1}`),
      type: toStringSafe(record.question_type ?? record.questionType, ""),
      count: Math.max(0, toNumberSafe(record.count, 0))
    };
  }).filter((item): item is StudentReviewCenterMistakeByType => Boolean(item && item.type));
}

function normalizeMistakesByModule(root: Record<string, unknown> | null): StudentReviewCenterMistakeByModule[] {
  const source = root?.mistakes_by_module ?? root?.mistakesByModule;
  const byObject = asRecord(source);

  if (byObject) {
    const points = Object.entries(byObject).map(([key, value]) => {
      const moduleKey = normalizeModule(key);
      return {
        id: `mistake-module-${moduleKey}`,
        module: moduleKey,
        count: Math.max(0, toNumberSafe(value, 0))
      };
    });
    const total = Math.max(1, points.reduce((sum, point) => sum + point.count, 0));
    return points.map((point) => ({
      ...point,
      share: Number(((point.count / total) * 100).toFixed(1))
    }));
  }

  const byArray = asArray(source).map((item, index) => {
    const record = asRecord(item);
    if (!record) return null;
    const moduleKey = normalizeModule(toStringSafe(record.module, "reading"));
    return {
      id: toStringSafe(record.id, `mistake-module-${index + 1}`),
      module: moduleKey,
      count: Math.max(0, toNumberSafe(record.count, 0)),
      share: Math.max(0, toNumberSafe(record.share ?? record.percentage ?? record.percent, 0))
    };
  }).filter((item): item is StudentReviewCenterMistakeByModule => Boolean(item));

  return byArray;
}

function normalizeResponse(data: unknown): StudentReviewCenterResponse {
  if (Array.isArray(data)) {
    const items = data.map((item, index) => normalizeItem(item, index)).filter((item): item is StudentReviewCenterItem => Boolean(item));
    return {
      summary: null,
      mistakesByType: [],
      mistakesByModule: [],
      items,
      count: items.length,
      next: null,
      previous: null,
      raw: null
    };
  }

  const root = asRecord(data);
  const results = asArray(root?.results ?? root?.items ?? root?.data ?? root?.review_items)
    .map((item, index) => normalizeItem(item, index))
    .filter((item): item is StudentReviewCenterItem => Boolean(item));

  return {
    summary: normalizeSummary(root?.summary ?? root?.stats),
    mistakesByType: normalizeMistakesByType(root),
    mistakesByModule: normalizeMistakesByModule(root),
    items: results,
    count: toNumberSafe(root?.count ?? results.length, results.length),
    next: typeof root?.next === "string" ? root.next : null,
    previous: typeof root?.previous === "string" ? root.previous : null,
    raw: root
  };
}

export const studentReviewCenterService = {
  async list(params?: StudentListQuery) {
    try {
      const normalizedParams = {
        ...params,
        ...(params?.module ? {module: String(params.module).toUpperCase()} : {}),
        ...(params?.reason ? {reason: String(params.reason).toLowerCase().replace("weakarea", "weak_area")} : {})
      } satisfies StudentListQuery;

      const response = await studentHttpClient.get("/review-center/", {
        params: toListQuery(normalizedParams)
      });
      return normalizeResponse(response.data);
    } catch (error) {
      throw toStudentApiError(error);
    }
  },

  async create(payload: StudentReviewCenterCreatePayload) {
    try {
      const response = await studentHttpClient.post("/review-center/", payload);
      return normalizeItem(response.data, 0);
    } catch (error) {
      throw toStudentApiError(error);
    }
  },

  async update(id: string, payload: StudentReviewCenterUpdatePayload) {
    try {
      const response = await studentHttpClient.patch(`/review-center/${id}/`, payload);
      return normalizeItem(response.data, 0);
    } catch (error) {
      throw toStudentApiError(error);
    }
  },

  async remove(itemId: string) {
    try {
      const normalizedItemId = encodeURIComponent(itemId);
      await studentHttpClient.delete(`/review-center/${normalizedItemId}/`);
      return { ok: true as const };
    } catch (error) {
      throw toStudentApiError(error);
    }
  }
};
