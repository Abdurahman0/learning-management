import {studentHttpClient, toStudentApiError} from "./httpClient";
import type {
  MistakeReasonAttemptResponse,
  MistakeReasonCategory,
  MistakeReasonDetail,
  MistakeReasonModule,
  MistakeReasonUsageStatus,
  StudentMistakeAdvice
} from "./types";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function asArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  const record = asRecord(value);
  const candidates = [record?.results, record?.items, record?.data];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }
  return [];
}

function getNextUrl(value: unknown) {
  const record = asRecord(value);
  const next = record?.next;
  return typeof next === "string" && next.trim() ? next.trim() : null;
}

function toStringSafe(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function normalizeModule(value: unknown): MistakeReasonModule {
  const normalized = toStringSafe(value, "BOTH").trim().toUpperCase();
  if (normalized === "READING" || normalized === "LISTENING" || normalized === "BOTH") {
    return normalized;
  }
  return "BOTH";
}

function normalizeCategory(value: unknown): MistakeReasonCategory {
  const normalized = toStringSafe(value, "fully_incorrect").trim().toLowerCase();
  if (normalized === "fully_incorrect" || normalized === "blank_answer" || normalized === "misspelled") {
    return normalized;
  }
  return "fully_incorrect";
}

function normalizeFileUrl(value: unknown) {
  const raw = toStringSafe(value).trim();
  if (!raw) return null;

  try {
    const url = new URL(raw);
    if (url.protocol === "https:" || url.protocol === "http:") {
      return url.toString();
    }
  } catch {
    return null;
  }

  return null;
}

function normalizeResourceType(value: unknown): "file" | "link" | null {
  const normalized = toStringSafe(value).trim().toLowerCase();
  if (normalized === "file" || normalized === "link") return normalized;
  return null;
}

function toNumberSafe(value: unknown, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalizeUsageStatus(value: unknown): MistakeReasonUsageStatus | null {
  const record = asRecord(value);
  if (!record) return null;

  const module = normalizeModule(record.module);
  if (module === "BOTH") return null;

  return {
    is_ai_allowed: Boolean(record.is_ai_allowed),
    module,
    limit: toNumberSafe(record.limit),
    used_count: toNumberSafe(record.used_count),
    remaining_count: toNumberSafe(record.remaining_count),
    period_starts_at: toStringSafe(record.period_starts_at) || null,
    period_ends_at: toStringSafe(record.period_ends_at) || null,
    already_used_for_attempt: Boolean(record.already_used_for_attempt),
    reset_message: toStringSafe(record.reset_message)
  };
}

function normalizeDetail(value: unknown): MistakeReasonDetail | null {
  const record = asRecord(value);
  if (!record) return null;

  const id = toStringSafe(record.id).trim();
  const reason = toStringSafe(record.reason).trim();
  if (!id || !reason) return null;

  const module = normalizeModule(record.module);
  return {
    id,
    reason,
    module,
    module_display: toStringSafe(record.module_display, module),
    mistake_category: normalizeCategory(record.mistake_category),
    mistake_category_display: toStringSafe(record.mistake_category_display, toStringSafe(record.mistake_category, "Fully incorrect")),
    is_file_consists: Boolean(record.is_file_consists),
    general_solution: toStringSafe(record.general_solution),
    solution_1: toStringSafe(record.solution_1),
    solution_2: toStringSafe(record.solution_2),
    solution_3: toStringSafe(record.solution_3),
    file_url: normalizeFileUrl(record.file_url),
    link_url: normalizeFileUrl(record.link_url),
    resource_type: normalizeResourceType(record.resource_type),
    resource_url: normalizeFileUrl(record.resource_url),
    created_at: toStringSafe(record.created_at) || null,
    updated_at: toStringSafe(record.updated_at) || null
  };
}

function normalizeAdvice(value: unknown): StudentMistakeAdvice | null {
  const record = asRecord(value);
  if (!record) return null;

  const reason = normalizeDetail(record.reason);
  const slot = Number(record.slot);
  const id = toStringSafe(record.id).trim();
  if (!id || !reason || !Number.isFinite(slot) || slot < 1) return null;

  return {
    id,
    slot,
    updated_at: toStringSafe(record.updated_at) || null,
    reason
  };
}

function normalizeAttemptResponse(value: unknown): MistakeReasonAttemptResponse {
  const record = asRecord(value);
  const results = asArray(value).map(normalizeDetail).filter((item): item is MistakeReasonDetail => Boolean(item));
  const usageStatus = normalizeUsageStatus(record?.usage_status);
  const isAllowed = typeof record?.is_ai_allowed === "boolean"
    ? record.is_ai_allowed
    : (usageStatus?.is_ai_allowed ?? true);

  return {
    is_ai_allowed: isAllowed,
    usage_status: usageStatus,
    results
  };
}

function resolveAdviceNextPath(nextUrl: string | null) {
  if (!nextUrl) return null;

  try {
    const url = new URL(nextUrl, "https://backend.local");
    const marker = "/mistake-analysis/advice/";
    const markerIndex = url.pathname.indexOf(marker);
    if (markerIndex === -1) return null;

    return `${url.pathname.slice(markerIndex)}${url.search}`;
  } catch {
    return null;
  }
}

export const studentMistakeReasonsService = {
  async listForAttempt(attemptId: string, category?: MistakeReasonCategory) {
    const response = await this.listForAttemptWithUsage(attemptId, category);
    return response.results;
  },

  async listForAttemptWithUsage(attemptId: string, category?: MistakeReasonCategory) {
    try {
      const normalizedAttemptId = encodeURIComponent(attemptId);
      const response = await studentHttpClient.get(`/attempts/${normalizedAttemptId}/mistake-reasons/`, {
        params: category ? {mistake_category: category} : undefined
      });
      return normalizeAttemptResponse(response.data);
    } catch (error) {
      throw toStudentApiError(error);
    }
  },

  async selectForAttempt(attemptId: string, reasonIds: string[]) {
    try {
      const normalizedAttemptId = encodeURIComponent(attemptId);
      const uniqueReasonIds = [...new Set(reasonIds.map((reasonId) => reasonId.trim()).filter(Boolean))];
      const response = await studentHttpClient.post(`/attempts/${normalizedAttemptId}/mistake-reasons/select/`, {
        reason_ids: uniqueReasonIds
      });
      return normalizeAttemptResponse(response.data);
    } catch (error) {
      throw toStudentApiError(error);
    }
  },

  async advice() {
    try {
      const collected: StudentMistakeAdvice[] = [];
      const visited = new Set<string>();
      let path: string | null = "/mistake-analysis/advice/";

      for (let page = 0; path && page < 20; page += 1) {
        if (visited.has(path)) break;
        visited.add(path);

        const response = await studentHttpClient.get(path);
        collected.push(...asArray(response.data).map(normalizeAdvice).filter((item): item is StudentMistakeAdvice => Boolean(item)));
        path = resolveAdviceNextPath(getNextUrl(response.data));
      }

      return collected.sort((a, b) => {
        const aTime = a.updated_at ? new Date(a.updated_at).getTime() : 0;
        const bTime = b.updated_at ? new Date(b.updated_at).getTime() : 0;
        return bTime - aTime;
      });
    } catch (error) {
      throw toStudentApiError(error);
    }
  }
};
