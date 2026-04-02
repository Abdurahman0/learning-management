import {adminHttpClient, toAdminApiError, toListQuery} from "./httpClient";
import {practiceTestsService} from "./practiceTests.service";
import {AdminApiError} from "./types";

type ContentBankModule = "READING" | "LISTENING";

type ContentBankPassageListItem = {
  id: string;
  module: ContentBankModule | string;
  title: string;
  difficulty_level?: string | null;
  topic?: string | null;
  source?: string | null;
  variants_count?: number | null;
  used_in_tests_count?: number | null;
  is_active?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type ContentBankPassageDetail = ContentBankPassageListItem & {
  preview_text?: string | null;
  full_text?: string | null;
  passage_text?: string | null;
  transcript_text?: string | null;
  estimated_time_minutes?: number | null;
  word_count?: number | null;
  practice_test?: string | null;
  passage_number?: string | null;
  part_number?: string | null;
  max_questions?: number | null;
  question_count?: number | null;
  total_questions?: number | null;
  variant_sets?: Array<Record<string, unknown>>;
  used_in_tests?: Array<string | number>;
};

export type AdminContentBankPassage = {
  id: string;
  title: string;
  module: "reading" | "listening";
  wordCount?: number;
  durationMinutes?: number;
  difficulty: "easy" | "medium" | "hard";
  topic: string;
  source: "cambridge" | "practice" | "custom";
  contentType?: string;
  tags: string[];
  notes?: string;
  previewText: string;
  fullText: string[];
  questionCount: number;
  status: "draft" | "published";
  estimatedTimeLabel?: string;
  createdAt: string;
  updatedAt?: string;
  linkedStructureIds: string[];
  linkedTestIds: string[];
  usedInTestIds: string[];
  variantIds: string[];
  variantCount: number;
  usageAttempts: number;
  difficultyAccuracy?: number;
  averageBandScore?: number;
  backendKind: "reading" | "listening";
  parentTestId: string;
  numberLabel: string;
  timeLimitSeconds: number | null;
};

export type UpsertContentBankPassagePayload = {
  title: string;
  module: "reading" | "listening";
  difficulty: "easy" | "medium" | "hard";
  topic: string;
  source: "cambridge" | "practice" | "custom";
  contentType?: string;
  tags?: string[];
  notes?: string;
  previewText: string;
  fullText: string[];
  estimatedTimeLabel?: string;
  durationMinutes?: number;
  status: "draft" | "published";
  questionCount: number;
};

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function asString(value: unknown, fallback = "") {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return fallback;
}

function asNumber(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function asBoolean(value: unknown, fallback = false) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }
  return fallback;
}

function mapModule(value: unknown): "reading" | "listening" {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .startsWith("LISTENING")
    ? "listening"
    : "reading";
}

function toApiModule(value: "reading" | "listening" | string | undefined | null): ContentBankModule | null {
  const normalized = String(value ?? "")
    .trim()
    .toUpperCase();
  if (normalized.startsWith("READING")) return "READING";
  if (normalized.startsWith("LISTENING")) return "LISTENING";
  return null;
}

function mapDifficulty(value: unknown): AdminContentBankPassage["difficulty"] {
  const normalized = String(value ?? "").trim().toUpperCase();
  if (normalized.includes("BEGINNER") || normalized.includes("EASY")) return "easy";
  if (normalized.includes("ADVANCED") || normalized.includes("HARD")) return "hard";
  return "medium";
}

function mapSource(value: unknown): AdminContentBankPassage["source"] {
  const normalized = String(value ?? "").trim().toUpperCase();
  if (normalized.includes("CAMBRIDGE")) return "cambridge";
  if (normalized.includes("PRACTICE")) return "practice";
  return "custom";
}

function toApiDifficulty(value: UpsertContentBankPassagePayload["difficulty"]) {
  if (value === "easy") return "BEGINNER";
  if (value === "hard") return "ADVANCED";
  return "INTERMEDIATE";
}

function toApiSource(value: UpsertContentBankPassagePayload["source"]) {
  if (value === "cambridge") return "CAMBRIDGE";
  if (value === "practice") return "CUSTOM_PRACTICE";
  return "CUSTOM_PRACTICE";
}

function toParagraphs(value: unknown) {
  const source = String(value ?? "").replace(/\r\n/g, "\n");
  const split = source
    .split(/\n{2,}/)
    .map((item) => item.trim())
    .filter(Boolean);
  if (split.length) return split;
  const single = source.trim();
  return single ? [single] : [];
}

function toPreview(value: string) {
  const clean = value.trim();
  if (clean.length <= 220) return clean;
  return `${clean.slice(0, 219).trimEnd()}...`;
}

function toEstimatedTimeLabel(minutes: number | null | undefined, module: "reading" | "listening") {
  if (!minutes || minutes <= 0) {
    return module === "listening" ? "7 - 8 min" : "12 - 15 min";
  }
  return `${Math.max(1, minutes - 1)} - ${minutes} min`;
}

function buildCountArray(prefix: string, count: number) {
  return Array.from({length: Math.max(0, count)}, (_, index) => `${prefix}-${index + 1}`);
}

function normalizePassage(
  payload: ContentBankPassageListItem | ContentBankPassageDetail,
  fallbackModule?: "reading" | "listening"
): AdminContentBankPassage {
  const moduleKey = fallbackModule ?? mapModule(payload.module);
  const detail = payload as ContentBankPassageDetail;
  const fullTextValue =
    asString(detail.full_text).trim() ||
    asString(detail.passage_text).trim() ||
    asString(detail.transcript_text).trim();
  const fullText = toParagraphs(fullTextValue);
  const previewText = asString(detail.preview_text).trim() || toPreview(fullText[0] ?? "");
  const variantsRaw = asArray<Record<string, unknown>>(detail.variant_sets);
  const variantIds = variantsRaw
    .map((item) => asString(item.id))
    .filter(Boolean);
  const variantCount = asNumber(detail.variants_count, variantIds.length);
  const usedCount = asNumber(detail.used_in_tests_count, asArray(detail.used_in_tests).length);
  const usedInTests = asArray<string | number>(detail.used_in_tests)
    .map((item) => asString(item))
    .filter(Boolean);
  const usedInTestIds = usedInTests.length ? usedInTests : buildCountArray("used-test", usedCount);
  const questionsCount = asNumber(
    detail.question_count ?? detail.total_questions ?? detail.max_questions,
    0
  );
  const minutes = asNumber(detail.estimated_time_minutes, 0);
  const createdAt = asString(payload.created_at).trim() || new Date().toISOString();
  const updatedAt = asString(payload.updated_at).trim() || createdAt;
  const numberLabel =
    moduleKey === "reading"
      ? asString(detail.passage_number).trim() || "PASSAGE_1"
      : asString(detail.part_number).trim() || "PART_1";
  const wordCountFromApi = asNumber(detail.word_count, 0);
  const wordCount =
    moduleKey === "reading" ? wordCountFromApi || fullText.join(" ").split(/\s+/).filter(Boolean).length : 0;

  return {
    id: asString(payload.id),
    title: asString(payload.title).trim() || "Untitled",
    module: moduleKey,
    wordCount: moduleKey === "reading" ? wordCount : undefined,
    durationMinutes: minutes > 0 ? minutes : undefined,
    difficulty: mapDifficulty(payload.difficulty_level),
    topic: asString(payload.topic).trim() || "General",
    source: mapSource(payload.source),
    contentType: moduleKey === "reading" ? "passage" : "transcript",
    tags: [],
    notes: "",
    previewText,
    fullText,
    questionCount: questionsCount,
    status: asBoolean(payload.is_active, true) ? "published" : "draft",
    estimatedTimeLabel: toEstimatedTimeLabel(minutes || undefined, moduleKey),
    createdAt,
    updatedAt,
    linkedStructureIds: [],
    linkedTestIds: buildCountArray("linked-test", usedCount),
    usedInTestIds,
    variantIds,
    variantCount,
    usageAttempts: 0,
    backendKind: moduleKey,
    parentTestId: asString(detail.practice_test),
    numberLabel,
    timeLimitSeconds: minutes > 0 ? minutes * 60 : null
  };
}

function toCreatePayload(payload: UpsertContentBankPassagePayload) {
  return {
    module: payload.module.toUpperCase(),
    title: payload.title.trim(),
    difficulty_level: toApiDifficulty(payload.difficulty),
    topic: payload.topic.trim() || "General",
    source: toApiSource(payload.source),
    full_text: payload.fullText.join("\n\n").trim() || payload.previewText.trim(),
    estimated_time_minutes:
      Number.isFinite(payload.durationMinutes) && Number(payload.durationMinutes) > 0
        ? Math.round(Number(payload.durationMinutes))
        : undefined,
    // Content Bank passage API uses is_active for archive state only.
    // Keep create/update active; archive is handled by DELETE endpoint.
    is_active: true
  };
}

async function fetchPassageDetail(module: ContentBankModule, passageId: string) {
  const response = await adminHttpClient.get<ContentBankPassageDetail>(`/content-bank/passages/${module}/${passageId}/`);
  return response.data;
}

async function listAllPassages() {
  const rows: ContentBankPassageListItem[] = [];
  let page = 1;

  while (true) {
    const response = await adminHttpClient.get<unknown>("/content-bank/passages/", {
      params: {
        ...toListQuery({page, pageSize: 100, ordering: "-updated_at"}),
        status: "ACTIVE"
      }
    });

    const data = response.data;
    const record = asRecord(data);
    const pageRows = (Array.isArray(data)
      ? data
      : asArray<ContentBankPassageListItem>(record.results)) as ContentBankPassageListItem[];
    rows.push(...pageRows);

    const next = Array.isArray(data) ? null : record.next;
    if (!next) break;
    page += 1;
    if (page > 100) break;
  }

  return rows;
}

export const adminContentBankService = {
  async getTargetTestId(module: "reading" | "listening" = "reading") {
    const response = await practiceTestsService.list({
      page: 1,
      pageSize: 50,
      test_type: module.toUpperCase()
    });
    const test = response.results[0];
    if (!test) {
      throw new AdminApiError(`No ${module} practice test exists yet.`, 400);
    }
    return String(test.id);
  },

  async listPassages() {
    try {
      const rows = await listAllPassages();
      return rows
        .map((row) => normalizePassage(row))
        .sort((left, right) => String(right.updatedAt ?? right.createdAt).localeCompare(String(left.updatedAt ?? left.createdAt)));
    } catch (error) {
      throw toAdminApiError(error);
    }
  },

  async getPassageById(passageId: string) {
    try {
      const reading = await fetchPassageDetail("READING", passageId);
      return normalizePassage(reading, "reading");
    } catch (error) {
      const normalized = toAdminApiError(error);
      if (normalized.status !== 404) {
        throw normalized;
      }
    }

    try {
      const listening = await fetchPassageDetail("LISTENING", passageId);
      return normalizePassage(listening, "listening");
    } catch (error) {
      const normalized = toAdminApiError(error);
      if (normalized.status !== 404) {
        throw normalized;
      }
    }

    return null;
  },

  async createPassage(payload: UpsertContentBankPassagePayload) {
    try {
      const response = await adminHttpClient.post<ContentBankPassageDetail>("/content-bank/passages/", toCreatePayload(payload));
      return normalizePassage(response.data, payload.module);
    } catch (error) {
      throw toAdminApiError(error);
    }
  },

  async updatePassage(passageId: string, payload: UpsertContentBankPassagePayload) {
    try {
      const moduleKey = payload.module.toUpperCase() as ContentBankModule;
      const response = await adminHttpClient.patch<ContentBankPassageDetail>(
        `/content-bank/passages/${moduleKey}/${passageId}/`,
        toCreatePayload(payload)
      );
      return normalizePassage(response.data, payload.module);
    } catch (error) {
      throw toAdminApiError(error);
    }
  },

  async deletePassage(passageId: string, module?: "reading" | "listening") {
    const preferredModule = toApiModule(module);

    const runDelete = async (moduleKey: ContentBankModule) => {
      await adminHttpClient.delete(`/content-bank/passages/${moduleKey}/${passageId}/`);
    };

    if (preferredModule) {
      try {
        await runDelete(preferredModule);
        return;
      } catch (error) {
        const normalized = toAdminApiError(error);
        if (normalized.status !== 404) {
          throw normalized;
        }
      }
    }

    for (const fallbackModule of ["READING", "LISTENING"] as const) {
      if (fallbackModule === preferredModule) continue;
      try {
        await runDelete(fallbackModule);
        return;
      } catch (error) {
        const normalized = toAdminApiError(error);
        if (normalized.status !== 404) {
          throw normalized;
        }
      }
    }

    throw new AdminApiError("Passage not found.", 404);
  },

  async duplicatePassage(passageId: string) {
    const existing = await this.getPassageById(passageId);
    if (!existing) {
      throw new AdminApiError("Passage not found.", 404);
    }

    return this.createPassage({
      title: `${existing.title} Copy`.slice(0, 190),
      module: existing.module,
      difficulty: existing.difficulty,
      topic: existing.topic,
      source: existing.source,
      contentType: existing.contentType,
      tags: existing.tags,
      notes: existing.notes,
      previewText: existing.previewText,
      fullText: existing.fullText,
      estimatedTimeLabel: existing.estimatedTimeLabel,
      durationMinutes:
        Number.isFinite(existing.durationMinutes) && Number(existing.durationMinutes) > 0
          ? Number(existing.durationMinutes)
          : undefined,
      status: existing.status,
      questionCount: existing.questionCount
    });
  },

  async attachPassageToTest(payload: {
    module: "reading" | "listening";
    passageId: string;
    practiceTestId: string;
    variantSetId: string;
  }) {
    try {
      const moduleKey = toApiModule(payload.module);
      if (!moduleKey) {
        throw new AdminApiError("Invalid content module for attach.", 400);
      }

      const response = await adminHttpClient.post<unknown>(`/content-bank/passages/${moduleKey}/${payload.passageId}/attach/`, {
        practice_test: payload.practiceTestId,
        variant_set: payload.variantSetId
      });
      return response.data;
    } catch (error) {
      throw toAdminApiError(error);
    }
  }
};
